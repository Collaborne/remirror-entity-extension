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

export interface StateProps {
	extension: EntityExtension;
	state: EditorState;
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
	private uniqueEntities: EntityAttrs[] = [];

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
					return { entities };
				},

				apply: (
					_tr: Transaction,
					_value: EntityState,
					_oldState: EditorState,
					newState: EditorState,
				): EntityState => {
					const entities = this.getAllEntitiesFromDoc(newState.doc);

					return { entities };
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

			const entities = this.getAllEntitiesFromDoc(tr.doc);
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

	protected getAllEntitiesFromDoc(doc?: Node): EntityWithPosition[] {
		const node = doc ?? this.store.getState().doc;
		const entityNodes = findInlineNodes({
			node,
		}).filter(inlineNode => inlineNode.node.type.name === this.name);

		const entities = entityNodes.map(({ node, pos }) => ({
			...node.attrs,
			pos,
		}));

		return entities;
	}

	/**
	 * Get all entity nodes attributes from the document.
	 */
	@helper()
	getAllEntityNodesAttrs(): Helper<EntityWithPosition[]> {
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
		const entities = getEntitiesFromPluginState({
			extension: this,
			state: this.store.getState(),
		});
		const seen = new Set();

		const calculatedUniqueEntities: EntityAttrs[] = [];

		entities.forEach(({ id, name }) => {
			if (!seen.has(id)) {
				calculatedUniqueEntities.push({ id, name });
				seen.add(id);
			}
		});

		// Preserve identity of array to prevent unnecessary rerenders by the caller
		if (hash(this.uniqueEntities) !== hash(calculatedUniqueEntities)) {
			this.uniqueEntities = calculatedUniqueEntities;
		}
		return this.uniqueEntities;
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
