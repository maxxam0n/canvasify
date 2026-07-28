import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workingDirectory = await mkdtemp(join(tmpdir(), 'canvasify-package-'))
const consumerDirectory = join(workingDirectory, 'consumer')
const npmExecutable = process.env.npm_execpath

if (!npmExecutable) {
	throw new Error('test:package must be executed through npm')
}

const readOutputDirectory = () => {
	const equalsArgument = process.argv.find(argument => argument.startsWith('--output-directory='))
	if (equalsArgument) return equalsArgument.slice('--output-directory='.length)

	const argumentIndex = process.argv.indexOf('--output-directory')
	return argumentIndex === -1 ? undefined : process.argv[argumentIndex + 1]
}

const requestedOutputDirectory = readOutputDirectory()
const tarballDirectory = requestedOutputDirectory
	? resolve(rootDirectory, requestedOutputDirectory)
	: join(workingDirectory, 'tarballs')

if (requestedOutputDirectory) {
	const relativeOutputDirectory = relative(rootDirectory, tarballDirectory)
	if (
		!relativeOutputDirectory ||
		relativeOutputDirectory.startsWith('..') ||
		isAbsolute(relativeOutputDirectory)
	) {
		throw new Error('Package output directory must stay inside the repository')
	}
}

const packages = [
	{
		name: '@maxxam0n/canvasify-core',
		directory: 'canvasify-core',
		workspace: '@maxxam0n/canvasify-core',
	},
	{
		name: '@maxxam0n/canvasify-react',
		directory: 'canvasify-react',
		workspace: '@maxxam0n/canvasify-react',
	},
	{
		name: '@maxxam0n/canvasify-vue',
		directory: 'canvasify-vue',
		workspace: '@maxxam0n/canvasify-vue',
	},
]

const run = (command, args, options = {}) =>
	new Promise((resolvePromise, reject) => {
		const child = spawn(command, args, {
			cwd: options.cwd ?? rootDirectory,
			env: process.env,
			shell: false,
			stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
		})

		let stdout = ''
		let stderr = ''

		child.stdout?.on('data', chunk => {
			stdout += chunk
		})
		child.stderr?.on('data', chunk => {
			stderr += chunk
		})
		child.on('error', reject)
		child.on('exit', code => {
			if (code === 0) {
				resolvePromise({ stdout, stderr })
				return
			}

			reject(
				new Error(
					[`Command failed (${code}): ${command} ${args.join(' ')}`, stdout.trim(), stderr.trim()]
						.filter(Boolean)
						.join('\n'),
				),
			)
		})
	})

const pathExists = async path => {
	try {
		await access(path)
		return true
	} catch {
		return false
	}
}

const linkDependency = async dependency => {
	const source = join(rootDirectory, 'node_modules', ...dependency.split('/'))
	if (!(await pathExists(source))) return

	const destination = join(consumerDirectory, 'node_modules', ...dependency.split('/'))
	if (await pathExists(destination)) return

	await mkdir(dirname(destination), { recursive: true })
	await symlink(source, destination, process.platform === 'win32' ? 'junction' : 'dir')
}

const packWorkspace = async packageInfo => {
	const { stdout } = await run(
		process.execPath,
		[
			npmExecutable,
			'pack',
			'--json',
			'--silent',
			`--workspace=${packageInfo.workspace}`,
			`--pack-destination=${tarballDirectory}`,
		],
		{ capture: true },
	)
	const jsonStart = stdout.lastIndexOf('\n[')
	const jsonOutput = jsonStart === -1 ? stdout : stdout.slice(jsonStart + 1)
	const [packResult] = JSON.parse(jsonOutput)
	assert(packResult, `npm pack returned no result for ${packageInfo.name}`)

	const fileNames = new Set(packResult.files.map(file => file.path))
	assert(fileNames.has('LICENSE'), `${packageInfo.name} tarball does not contain LICENSE`)
	assert(fileNames.has('README.md'), `${packageInfo.name} tarball does not contain README.md`)
	assert(fileNames.has('package.json'), `${packageInfo.name} tarball does not contain package.json`)
	assert(
		[...fileNames].some(fileName => fileName.startsWith('dist/')),
		`${packageInfo.name} tarball does not contain dist`,
	)

	return {
		...packageInfo,
		tarball: join(tarballDirectory, packResult.filename),
	}
}

const toFileDependency = path => {
	const relativePath = relative(consumerDirectory, path).replaceAll('\\', '/')
	return `file:${relativePath.startsWith('.') ? relativePath : `./${relativePath}`}`
}

const writeConsumerFiles = async packedPackages => {
	await mkdir(join(consumerDirectory, 'src'), { recursive: true })
	await writeFile(
		join(consumerDirectory, 'package.json'),
		JSON.stringify(
			{
				name: 'canvasify-package-consumer',
				private: true,
				type: 'module',
				dependencies: Object.fromEntries(
					packedPackages.map(packageInfo => [
						packageInfo.name,
						toFileDependency(packageInfo.tarball),
					]),
				),
			},
			null,
			2,
		),
	)
	await writeFile(
		join(consumerDirectory, 'tsconfig.json'),
		JSON.stringify(
			{
				compilerOptions: {
					target: 'ES2022',
					module: 'NodeNext',
					moduleResolution: 'NodeNext',
					lib: ['DOM', 'ES2022'],
					strict: true,
					skipLibCheck: false,
					noEmit: true,
				},
				include: ['src'],
			},
			null,
			2,
		),
	)
	await writeFile(
		join(consumerDirectory, 'src', 'index.ts'),
		[
			"import { Canvas, Layer, type CanvasHitTestResult, type HitTestResult } from '@maxxam0n/canvasify-core'",
			"import { Canvas as ReactCanvas } from '@maxxam0n/canvasify-react'",
			"import { Canvas as VueCanvas } from '@maxxam0n/canvasify-vue'",
			'',
			'const hitResult: HitTestResult | CanvasHitTestResult | undefined = undefined',
			'void [Canvas, Layer, ReactCanvas, VueCanvas, hitResult]',
			'',
		].join('\n'),
	)
	await writeFile(
		join(consumerDirectory, 'esm-smoke.mjs'),
		[
			"import assert from 'node:assert/strict'",
			'',
			"const packageNames = ['@maxxam0n/canvasify-core', '@maxxam0n/canvasify-react', '@maxxam0n/canvasify-vue']",
			'for (const packageName of packageNames) {',
			'\tconst packageExports = await import(packageName)',
			'\tassert(Object.keys(packageExports).length > 0, `${packageName} has no ESM exports`)',
			'}',
			"assert(import.meta.resolve('@maxxam0n/canvasify-core/render-worker'))",
			'',
		].join('\n'),
	)
	await writeFile(
		join(consumerDirectory, 'cjs-smoke.cjs'),
		[
			"const assert = require('node:assert/strict')",
			"const packageNames = ['@maxxam0n/canvasify-core', '@maxxam0n/canvasify-react', '@maxxam0n/canvasify-vue']",
			'for (const packageName of packageNames) {',
			'\tconst packageExports = require(packageName)',
			'\tassert(Object.keys(packageExports).length > 0, `${packageName} has no CommonJS exports`)',
			'}',
			'',
		].join('\n'),
	)

	const viteDirectory = join(consumerDirectory, 'vite-worker')
	await mkdir(join(viteDirectory, 'src'), { recursive: true })
	await writeFile(
		join(viteDirectory, 'index.html'),
		'<div id="app"></div><script type="module" src="/src/main.ts"></script>\n',
	)
	await writeFile(
		join(viteDirectory, 'tsconfig.json'),
		JSON.stringify(
			{
				compilerOptions: {
					target: 'ES2022',
					lib: ['DOM', 'ES2022'],
					module: 'ESNext',
					moduleResolution: 'Bundler',
					types: ['vite/client'],
					strict: true,
					skipLibCheck: false,
					noEmit: true,
				},
				include: ['src'],
			},
			null,
			2,
		),
	)
	await writeFile(
		join(viteDirectory, 'src', 'main.ts'),
		[
			"import CanvasifyRenderWorker from '@maxxam0n/canvasify-core/render-worker?worker'",
			'',
			'const worker = new CanvasifyRenderWorker()',
			'worker.terminate()',
			"document.querySelector('#app')?.append('ok')",
			'',
		].join('\n'),
	)
}

let succeeded = false

try {
	await mkdir(tarballDirectory, { recursive: true })
	const packedPackages = []
	for (const packageInfo of packages) {
		packedPackages.push(await packWorkspace(packageInfo))
	}

	await writeConsumerFiles(packedPackages)
	await run(
		process.execPath,
		[
			npmExecutable,
			'install',
			'--ignore-scripts',
			'--package-lock=false',
			'--legacy-peer-deps',
			'--no-audit',
			'--no-fund',
			'--offline',
		],
		{ cwd: consumerDirectory },
	)

	for (const dependency of ['react', 'react-dom', 'vue', 'vite', '@types', '@vue']) {
		await linkDependency(dependency)
	}

	await run(process.execPath, [
		join(rootDirectory, 'node_modules', 'typescript', 'bin', 'tsc'),
		'--project',
		join(consumerDirectory, 'tsconfig.json'),
	])
	await run(process.execPath, [
		join(rootDirectory, 'node_modules', 'typescript', 'bin', 'tsc'),
		'--project',
		join(consumerDirectory, 'vite-worker', 'tsconfig.json'),
	])
	await run(process.execPath, [join(consumerDirectory, 'esm-smoke.mjs')], {
		cwd: consumerDirectory,
	})
	await run(process.execPath, [join(consumerDirectory, 'cjs-smoke.cjs')], {
		cwd: consumerDirectory,
	})
	await run(
		process.execPath,
		[join(rootDirectory, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'],
		{ cwd: join(consumerDirectory, 'vite-worker') },
	)

	const coreDeclarations = await readFile(
		join(consumerDirectory, 'node_modules', '@maxxam0n', 'canvasify-core', 'dist', 'index.d.ts'),
		'utf8',
	)
	assert(
		!coreDeclarations.includes("from '../model/"),
		'Core declarations reference source files outside the published package',
	)

	succeeded = true
	console.log(
		requestedOutputDirectory
			? `Published package smoke tests passed; tarballs are in ${tarballDirectory}`
			: 'Published package smoke tests passed',
	)
} finally {
	if (succeeded) {
		await rm(workingDirectory, { recursive: true, force: true })
	} else {
		console.error(`Package smoke artifacts were preserved at ${workingDirectory}`)
	}
}
