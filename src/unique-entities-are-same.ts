import { EntityAttrs } from './types';

export function uniqueEntitiesAreSame(
	a: EntityAttrs[],
	b: EntityAttrs[],
): boolean {
	const isSameEntity = (a: EntityAttrs, b: EntityAttrs) =>
		a.id === b.id && a.name === b.name;
	return (
		a.length === b.length && a.every((a, index) => isSameEntity(a, b[index]))
	);
}
