import {
	ApplySchemaAttributes,
	command,
	CommandFunction,
	CreateExtensionPlugin,
	ExtensionTag,
	Helper,
	helper,
	isElementDomNode,
	NodeExtension,
	NodeExtensionSpec,
	NodeSpecOverride,
	omitExtraAttributes,
	Transaction,
	extension,
} from '@remirror/core';
import { Node } from '@remirror/pm/dist-types/model';
import { EditorState, EditorStateConfig } from '@remirror/pm/dist-types/state';
import { NodeViewComponentProps } from '@remirror/react';
import { ComponentType } from 'react';

import { defaultRenderEntity } from './default-render-component';
import { EntityAttrs, EntityOptions, EntityState } from './types';
import { uniqueEntitiesAreSame } from './unique-entities-are-same';

export const dataAttributeId = 's-id';
export const dataAttributeName = 's-name';

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
		updateAttributes,
	}) => {
		const { render: renderEntity } = this.options as EntityOptions;
		const uniqueEntities = getUniqueEntitiesFromPluginState({
			extension: this,
			state: this.store.getState(),
		});
		return renderEntity({
			entity: node.attrs as EntityAttrs,
			uniqueEntities,
			upsertEntity: updateAttributes,
		});
	};

	/**
	 * Create the extension plugin for inserting decorations into the editor.
	 */
	createPlugin(): CreateExtensionPlugin<EntityState> {
		return {
			state: {
				init: (_: EditorStateConfig, state: EditorState): EntityState => {
					const uniqueEntities = this.getUniqueEntitiesFromDoc(state.doc);
					return { uniqueEntities };
				},

				apply: (tr: Transaction, oldEntityState: EntityState): EntityState => {
					if (!tr.docChanged) {
						// Moving the cursor won't impact entities
						return oldEntityState;
					}
					const uniqueEntities = this.getUniqueEntitiesFromDoc(tr.doc);

					const same = uniqueEntitiesAreSame(
						uniqueEntities,
						oldEntityState.uniqueEntities,
					);
					// Preserve identity of array to prevent unnecessary rerenders by the caller
					if (!same) {
						// Preserve array instance
						return { uniqueEntities };
					}
					return oldEntityState;
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

	private updateEntityByIdCommand(
		id: string,
		update: Partial<EntityAttrs>,
	): CommandFunction {
		return ({ tr, dispatch }) => {
			if (!dispatch) {
				return true;
			}

			tr.doc.descendants((node: Node, pos: number) => {
				if (node.type.name === this.name && node.attrs.id === id) {
					tr.setNodeMarkup(pos, undefined, update);
				}
				return true;
			});

			dispatch(tr);
			return true;
		};
	}

	private getUniqueEntitiesFromDoc(doc?: Node): EntityAttrs[] {
		const parentNode = doc ?? this.store.getState().doc;
		const uniqueEntitiesById = new Map<string, EntityAttrs>();
		parentNode.descendants((node: Node) => {
			if (node.isAtom && node.type.name === this.name) {
				const { id, name } = node.attrs;
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				uniqueEntitiesById.set(id!, { id, name });

				return false;
			}
			return true;
		});
		return [...uniqueEntitiesById.values()];
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
	updateEntityById(id: string, attributes: EntityAttrs): CommandFunction {
		return this.updateEntityByIdCommand(id, attributes);
	}
}
