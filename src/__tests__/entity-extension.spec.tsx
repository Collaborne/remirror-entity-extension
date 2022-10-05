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
	describe('getAllEntityNodesAttrs', () => {
		it('returns all entities with their position', () => {
			const item1 = { id: '1', name: 'Name 1' };
			const item2 = { id: '2', name: 'Name 2' };
			add(doc(p(entity(item1)(), entity(item2)(), entity(item1)())));

			const actual = helpers.getAllEntityNodesAttrs();
			expect(actual).toEqual([
				{ ...item1, pos: 1 },
				{ ...item2, pos: 2 },
				{ ...item1, pos: 3 },
			]);
		});
	});

	describe('getUniqueEntities', () => {
		it('deduplicates entities', () => {
			const item1 = { id: '1', name: 'Name 1' };
			const item2 = { id: '2', name: 'Name 2' };
			add(doc(p(entity(item1)(), entity(item2)(), entity(item1)())));

			const actual = helpers.getUniqueEntities();
			expect(actual).toEqual([item1, item2]);
		});
	});

	describe('updateEntityInPosition', () => {
		it('updates entity in position', () => {
			const item1 = { id: '1', name: 'Name 1' };
			const item2 = { id: '2', name: 'Name 2' };
			add(doc(p(entity(item1)(), entity(item2)(), entity(item1)())));

			const newName = 'CHANGED';
			commands.updateEntityInPosition(1, { ...item1, name: newName });

			const actual = helpers.getAllEntityNodesAttrs();
			expect(actual[0].name).toEqual(newName);
			expect(actual[1].name).toEqual(item2.name);
			// XXX: I wouldn't have expected this! Now, we have item with the same ID ('1') but
			// two different names ('Name 1' and 'CHANGED')
			expect(actual[2].name).toEqual(item1.name);
		});
	});

	describe('updateEntityById', () => {
		it('updates all entities with the same ID', () => {
			const item1 = { id: '1', name: 'Name 1' };
			const item2 = { id: '2', name: 'Name 2' };
			add(doc(p(entity(item1)(), entity(item2)(), entity(item1)())));

			const newName = 'CHANGED';
			commands.updateEntityById(item1.id, { ...item1, name: newName });

			const actual = helpers.getAllEntityNodesAttrs();
			expect(actual[0].name).toEqual(newName);
			expect(actual[1].name).toEqual(item2.name);
			expect(actual[2].name).toEqual(newName);
		});

		it('ignores updates on non-existing entities', () => {
			const item1 = { id: '1', name: 'Name 1' };
			add(doc(p(entity(item1)())));

			commands.updateEntityById('other', { id: 'other', name: 'other' });

			const actual = helpers.getAllEntityNodesAttrs();
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
