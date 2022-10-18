export function isSameArray<T>(
	a: T[],
	b: T[],
	predicate: (a: T, b: T) => boolean,
): boolean {
	return a.length === b.length && a.every((a, index) => predicate(a, b[index]));
}
