import {
	EditorComponent,
	Remirror,
	useCommands,
	useHelpers,
	useRemirror,
} from '@remirror/react';
import { uniqueId } from 'remirror';
import 'remirror/styles/all.css';

import { EntityAttrs, EntityExtension } from '../../src';

export default {
	title: 'Entity extension',
};

enum Fruit {
	apple = 'Apple',
	orange = 'Orange',
	pear = 'Pear',
}

function fruit(fruit: Fruit) {
	return `<span s-id="${fruit}" s-name="${fruit}"></span>`;
}
const CONTENT = `
<p>Hello ${fruit(Fruit.apple)},</p>
<p>Two other entities: ${fruit(Fruit.orange)}, ${fruit(Fruit.pear)}</p>
<p>And repeated: ${fruit(Fruit.apple)}, ${fruit(Fruit.orange)}, ${fruit(
	Fruit.pear,
)}</p>
<p></p>
`;

let counter = 1;
function EditButton({ id }: { id: Fruit }) {
	const { updateEntityById } = useCommands<EntityExtension>();

	const handleClick = () => {
		updateEntityById(id, { id, name: `${id} - ${counter++}` });
	};

	return <button onClick={handleClick}>Change {id}</button>;
}

function NewButton() {
	const { createEntity } = useCommands<EntityExtension>();

	const handleClick = () => {
		const id = uniqueId();
		createEntity({ id, name: `New ${id}` });
	};

	return <button onClick={handleClick}>Add new</button>;
}

let count = 0;
function Counter({ value }: { value: EntityAttrs[] }) {
	count++;
	return (
		<>
			{value.length} ({count})
		</>
	);
}

function UniqueEntities() {
	const { getUniqueEntities } = useHelpers<EntityExtension>();
	const uniqueEntities = getUniqueEntities();
	return <Counter value={uniqueEntities} />;
}

export const Basic = () => {
	const { manager, state } = useRemirror({
		content: CONTENT,
		stringHandler: 'html',
		extensions: () => [new EntityExtension()],
	});

	return (
		<div className="remirror-theme">
			<Remirror manager={manager} initialContent={state}>
				<EditorComponent />
				&nbsp;
				<div>
					<EditButton id={Fruit.apple} />
					&nbsp;
					<EditButton id={Fruit.orange} />
					&nbsp;
					<EditButton id={Fruit.pear} />
					&nbsp;
					<NewButton />
				</div>
				<UniqueEntities />
			</Remirror>
		</div>
	);
};
