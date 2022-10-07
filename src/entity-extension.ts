import {
	ApplySchemaAttributes,
	command,
	CommandFunction,
	CreateExtensionPlugin,
	extension,
	ExtensionTag,
	findInlineNodes,
	Helper,
	helper,
	isElementDomNode,
	NodeExtension,
	NodeExtensionSpec,
	NodeSpecOverride,
	NodeWithPosition,
	omitExtraAttributes,
	Transaction,
} from '@remirror/core';
import { Node } from '@remirror/pm/dist-types/model';
import { EditorState, EditorStateConfig } from '@remirror/pm/dist-types/state';
import { NodeViewComponentProps } from '@remirror/react';
import { ComponentType } from 'react';

import { defaultRenderEntity } from './default-render-component';
import { hash } from './hash';
import {
	EntityAttrs,
	EntityOptions,
	EntityState,
	EntityWithPosition,
} from './types';

export const dataAttributeId = 's-id';
export const dataAttributeName = 's-name';

const getEntitiesFromPluginState = (
	props: StateProps,
): EntityWithPosition[] => {
	const { extension, state } = props;
	const pluginState: { entities: EntityWithPosition[] } =
		extension.getPluginState(state);
	return pluginState.entities;
};

const getUniqueEntitiesFromPluginState = (props: StateProps): EntityAttrs[] => {
	const { extension, state } = props;
	const pluginState: { uniqueEntities: EntityAttrs[] } =
		extension.getPluginState(state);
	return pluginState.uniqueEntities;
};

export interface StateProps {
	extension: EntityExtension;
	state: EditorState;
}

function computeUniqueEntities(entities: EntityAttrs[]) {
	const uniqueEntitiesById = new Map<string, EntityAttrs>();
	entities.forEach(({ id, name }) => {
		uniqueEntitiesById.set(id!, { id, name });
	});
	return [...uniqueEntitiesById.values()];
}

/**
 * Extension that stores the data of entities in the document itself.
 */
@extension<EntityOptions>({
	defaultOptions: {
		render: defaultRenderEntity,
	},
})
export class EntityExtension extends NodeExtension<EntityOptions> {
	get name() {
		return 'entity';
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	ReactComponent: ComponentType<NodeViewComponentProps> = ({
		node,
		getPosition,
	}) => {
		const { id, name } = node.attrs;
		const { render: renderEntity } = this.options as EntityOptions;

		return renderEntity({ id, name, getPosition });
	};

	/**
	 * Create the extension plugin for inserting decorations into the editor.
	 */
	createPlugin(): CreateExtensionPlugin<EntityState> {
		return {
			state: {
				init: (_: EditorStateConfig, state: EditorState): EntityState => {
					const entities = this.getAllEntitiesFromDoc(state.doc);
					const uniqueEntities = computeUniqueEntities(entities);
					return { entities, uniqueEntities };
				},

				apply: (
					tr: Transaction,
					oldEntityState: EntityState,
					_oldState: EditorState,
					newState: EditorState,
				): EntityState => {
					if (!tr.steps) {
						// Moving the cursor won't impact entities
						return oldEntityState;
					}

					const entities = this.getAllEntitiesFromDoc(newState.doc);
					if (hash(entities) === hash(oldEntityState.entities)) {
						// No changes
						return oldEntityState;
					}

					let uniqueEntities = computeUniqueEntities(entities);

					// Preserve identity of array to prevent unnecessary rerenders by the caller
					if (hash(uniqueEntities) === hash(oldEntityState.uniqueEntities)) {
						// Preserve array instance
						uniqueEntities = oldEntityState.uniqueEntities;
					}

					return { entities, uniqueEntities };
				},
			},
		};
	}

	createTags() {
		return [ExtensionTag.InlineNode];
	}

	createNodeSpec(
		extra: ApplySchemaAttributes,
		override: NodeSpecOverride,
	): NodeExtensionSpec {
		return {
			attrs: {
				...extra.defaults(),
				id: { default: null },
				name: { default: '' },
			},
			selectable: true,
			draggable: true,
			atom: true,
			inline: true,
			// To disallow all marks
			marks: '',
			...override,
			parseDOM: [
				{
					tag: `span[${dataAttributeId}]`,
					getAttrs: node => {
						if (!isElementDomNode(node)) {
							return false;
						}

						const id = node.getAttribute(dataAttributeId);
						const name = node.getAttribute(dataAttributeName);

						return {
							...extra.parse(node),
							id,
							name,
						};
					},
				},
				...(override.parseDOM ?? []),
			],
			toDOM: node => {
				const { id, name, ...rest } = omitExtraAttributes(node.attrs, extra);
				const attributes = {
					...extra.dom(node),
					...rest,
					[dataAttributeId]: id,
					[dataAttributeName]: name,
				};
				return ['span', attributes];
			},
		};
	}

	private updateEntityInPositionCommand(
		pos: number,
		attributes: EntityAttrs,
	): CommandFunction {
		return ({ tr, dispatch }) => {
			if (!dispatch) {
				return true;
			}

			tr.setNodeMarkup(pos, undefined, attributes);

			dispatch(tr);
			return true;
		};
	}

	private updateEntityByIdCommand(
		id: string,
		update: Partial<EntityAttrs>,
	): CommandFunction {
		return ({ tr, dispatch }) => {
			if (!dispatch) {
				return true;
			}

			const nodes = this.getAllEntityNodesFromDoc(tr.doc);
			const entities: EntityWithPosition[] = nodes.map(({ node, pos }) => ({
				...node.attrs,
				pos,
			}));
			const sameEntitiesId = entities.filter(entity => entity.id === id);

			if (sameEntitiesId.length === 0) {
				return true;
			}
			sameEntitiesId.forEach(entity => {
				tr.setNodeMarkup(entity.pos, undefined, update);
			});

			dispatch(tr);
			return true;
		};
	}

	private getAllEntityNodesFromDoc(doc?: Node): NodeWithPosition[] {
		const node = doc ?? this.store.getState().doc;
		return findInlineNodes({
			node,
		}).filter(inlineNode => inlineNode.node.type.name === this.name);
	}

	private getAllEntitiesFromDoc(doc?: Node): EntityAttrs[] {
		const nodes = this.getAllEntityNodesFromDoc(doc);
		const entities = nodes.map(({ node }) => ({
			...node.attrs,
		}));

		return entities;
	}

	/**
	 * Get all entity nodes attributes from the document.
	 */
	@helper()
	getAllEntityNodesAttrs(): Helper<EntityAttrs[]> {
		return getEntitiesFromPluginState({
			extension: this,
			state: this.store.getState(),
		});
	}

	/**
	 * Get all entities from the document.
	 */
	@helper()
	getUniqueEntities(): Helper<EntityAttrs[]> {
		return getUniqueEntitiesFromPluginState({
			extension: this,
			state: this.store.getState(),
		});
	}

	@command()
	createEntity(attributes: EntityAttrs): CommandFunction {
		return ({ tr, dispatch }) => {
			const entity = this.type.create(attributes);
			dispatch?.(tr.replaceSelectionWith(entity));

			return true;
		};
	}

	@command()
	updateEntityInPosition(
		pos: number,
		attributes: EntityAttrs,
	): CommandFunction {
		return this.updateEntityInPositionCommand(pos, attributes);
	}

	@command()
	updateEntityById(id: string, attributes: EntityAttrs): CommandFunction {
		return this.updateEntityByIdCommand(id, attributes);
	}
}
