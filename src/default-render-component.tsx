import { useCommands, useHelpers } from '@remirror/react';
import { ChangeEventHandler, useCallback, useMemo } from 'react';
import { uniqueId } from 'remirror';

import { EntityExtension } from './entity-extension';
import { EntityComponentProps, RenderEntity } from './types';

interface Item {
	id: string;
	name?: string;
}

export function EntityComponent({ id, getPosition }: EntityComponentProps) {
	const position = typeof getPosition === 'function' && getPosition();

	const { getUniqueEntities } = useHelpers<EntityExtension>(true);
	const { updateEntityInPosition } = useCommands<EntityExtension>();

	const uniqueEntities = getUniqueEntities();

	const items: Item[] = useMemo(
		() => uniqueEntities.map(({ id, name }) => ({ id: id!, name })),
		[uniqueEntities],
	);

	const addEntity = useCallback(() => {
		// Do nothing if we can't find this nodes position
		if (!position) {
			return;
		}

		const id = uniqueId();
		updateEntityInPosition(position, { id, name: id });
	}, [updateEntityInPosition, position]);

	const handleSelectEntity: ChangeEventHandler<HTMLSelectElement> = useCallback(
		event => {
			const entityId = event.target.value;
			if (entityId === 'add') {
				return addEntity();
			}

			const selectedEntity = uniqueEntities.find(
				entity => entity.id === entityId,
			);
			if (selectedEntity && position) {
				updateEntityInPosition(position, selectedEntity);
			}
		},
		[position, uniqueEntities, updateEntityInPosition, addEntity],
	);

	if (items.length === 0) {
		return null;
	}

	return (
		<select value={id} onChange={handleSelectEntity}>
			{items.map(item => (
				<option key={item.id} value={item.id}>
					{item.name}
				</option>
			))}
			<option key="add" value="add">
				Add entity
			</option>
		</select>
	);
}

export const defaultRenderEntity: RenderEntity = props => (
	<EntityComponent {...props} />
);
