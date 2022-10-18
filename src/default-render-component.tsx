import { ChangeEventHandler, memo, useCallback, useMemo } from 'react';
import { uniqueId } from 'remirror';

import { EntityComponentProps, RenderEntity } from './types';

interface Item {
	id: string;
	name?: string;
}

export const EntityComponent = memo(
	({ entity, uniqueEntities, upsertEntity }: EntityComponentProps) => {
		const items: Item[] = useMemo(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			() => uniqueEntities.map(({ id, name }) => ({ id: id!, name })),
			[uniqueEntities],
		);

		const addEntity = useCallback(() => {
			const id = uniqueId();
			// Insert new entity by passing a non existent id.
			upsertEntity({ id, name: id });
		}, [upsertEntity]);

		const handleSelectEntity: ChangeEventHandler<HTMLSelectElement> =
			useCallback(
				event => {
					const entityId = event.target.value;
					if (entityId === 'add') {
						return addEntity();
					}

					const selectedEntity = uniqueEntities.find(
						entity => entity.id === entityId,
					);
					if (selectedEntity) {
						upsertEntity({ id: selectedEntity.id, name: selectedEntity.name });
					}
				},
				[uniqueEntities, addEntity, upsertEntity],
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
	},
);

export const defaultRenderEntity: RenderEntity = ({
	entity,
	uniqueEntities,
	upsertEntity,
}) => (
	<EntityComponent
		entity={entity}
		uniqueEntities={uniqueEntities}
		upsertEntity={upsertEntity}
	/>
);
