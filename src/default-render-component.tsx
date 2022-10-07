import { ChangeEventHandler, useCallback, useMemo } from 'react';
import { uniqueId } from 'remirror';

import { EntityComponentProps, RenderEntity } from './types';

interface Item {
	id: string;
	name?: string;
}

export function EntityComponent({
	entity,
	uniqueEntities,
	updateAttributes,
}: EntityComponentProps) {
	const items: Item[] = useMemo(
		() => uniqueEntities.map(({ id, name }) => ({ id: id!, name })),
		[uniqueEntities],
	);

	const addEntity = useCallback(() => {
		const id = uniqueId();
		updateAttributes({ id, name: id });
	}, [updateAttributes]);

	const handleSelectEntity: ChangeEventHandler<HTMLSelectElement> = useCallback(
		event => {
			const entityId = event.target.value;
			if (entityId === 'add') {
				return addEntity();
			}

			const selectedEntity = uniqueEntities.find(
				entity => entity.id === entityId,
			);
			if (selectedEntity) {
				updateAttributes({ id: selectedEntity.id, name: selectedEntity.name });
			}
		},
		[uniqueEntities, addEntity, updateAttributes],
	);

	if (items.length === 0) {
		return null;
	}

	return (
		<select value={entity.id} onChange={handleSelectEntity}>
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
