import { extensionValidityTest, renderEditor } from 'jest-remirror';

import { EntityExtension } from '../entity-extension';

extensionValidityTest(EntityExtension);

function setupEditor() {
	return renderEditor([new EntityExtension()]);
}

const {
	add,
	nodes: { doc, p },
	attributeNodes: { entity },
	helpers,
	commands,
} = setupEditor();

describe('entity-extension', () => {
	describe('getUniqueEntities', () => {
		it('deduplicates entities', () => {
			const item1 = { id: '1', name: 'Name 1' };
			const item2 = { id: '2', name: 'Name 2' };
			add(doc(p(entity(item1)(), entity(item2)(), entity(item1)())));

			const actual = helpers.getUniqueEntities();
			expect(actual).toEqual([item1, item2]);
		});
	});

	describe('updateEntityById', () => {
		it('updates all entities with the same ID', () => {
			const item1 = { id: '1', name: 'Name 1' };
			const item2 = { id: '2', name: 'Name 2' };
			add(doc(p(entity(item1)(), entity(item2)(), entity(item1)())));

			const newName = 'CHANGED';
			commands.updateEntityById(item1.id, { ...item1, name: newName });

			const actual = helpers.getUniqueEntities();
			expect(actual[0].name).toEqual(newName);
			expect(actual[1].name).toEqual(item2.name);
		});

		it('ignores updates on non-existing entities', () => {
			const item1 = { id: '1', name: 'Name 1' };
			add(doc(p(entity(item1)())));

			commands.updateEntityById('other', { id: 'other', name: 'other' });

			const actual = helpers.getUniqueEntities();
			expect(actual[0].name).toEqual(item1.name);
		});
	});

	describe('createEntity', () => {
		it('creates an entity', () => {
			add(doc(p('')));

			const item = { id: '1', name: 'Name 1' };
			commands.createEntity(item);

			const actual = helpers.getUniqueEntities();
			expect(actual).toEqual([item]);
		});
	});
});
