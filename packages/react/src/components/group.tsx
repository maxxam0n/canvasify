import { useContext, useMemo } from 'react'
import { GroupContext } from '../contexts/group-context'
import { TransformGroup } from './transform'
import type { GroupProps } from './group.types'

export const Group = ({
	x = 0,
	y = 0,
	opacity = 1,
	zIndex = 0,
	children,
}: GroupProps) => {
	const inherited = useContext(GroupContext)

	const groupParams = useMemo(() => {
		return {
			opacity: opacity * (inherited?.opacity ?? 1),
			zIndex: zIndex + (inherited?.zIndex ?? 0),
		}
	}, [opacity, zIndex, inherited])

	return (
		<GroupContext.Provider value={groupParams}>
			<TransformGroup
				translate={{
					translateX: x,
					translateY: y,
				}}
			>
				{children}
			</TransformGroup>
		</GroupContext.Provider>
	)
}
