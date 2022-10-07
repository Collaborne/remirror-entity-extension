/**
 * Retrieve the position of the current nodeView
 */
type GetPosition = (() => number) | boolean;

export type EntityComponentProps = {
	id: string;
	name: string;
	getPosition: GetPosition;
};
export type RenderEntity = (args: EntityComponentProps) => JSX.Element | null;

export interface EntityOptions {
	render: RenderEntity;
}

export interface EntityAttrs {
	id?: string;
	name?: string;
}

export type EntityId = string;

export type EntityWithPosition = EntityAttrs & { pos: number };

export interface EntityState {
	entities: EntityAttrs[];
	uniqueEntities: EntityAttrs[];
}
