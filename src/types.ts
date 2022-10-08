import { ProsemirrorAttributes } from 'remirror';

export type EntityComponentProps = {
	// The entity data of this component
	entity: EntityAttrs;
	upsertEntity: (attrs: ProsemirrorAttributes<object>) => void;
	// All unique entities data of the document
	uniqueEntities: EntityAttrs[];
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

export interface EntityState {
	entities: EntityAttrs[];
	uniqueEntities: EntityAttrs[];
}
