import { initApp } from './App'
import './index.css'

const app = document.getElementById('app')
if (!app) throw new Error('Root element #app not found')

initApp(app)
