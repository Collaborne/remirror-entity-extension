# remirror-entity-extension
Extension for remirror.io to store entities

[Live demo](https://collaborne.github.io/remirror-entity-extension/)

## Motivation

Remirror's native [EntityReferenceExtension](https://remirror.io/docs/extensions/entity-reference-extension) allows to store in the document IDs that point to entities that are outside the document. In contrast, the `EntityExtension` stores all the data of the entity within the document itself.

## Features

- Updating the data of an entity will update all instances of the entity within the document
- Add new entities
- Entities are removed once they are no longer in use
- Custom rendering
