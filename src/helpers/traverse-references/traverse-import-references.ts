import type { NodePath } from '@babel/core';
import { getImportedName } from '../add-imports/utils';
import { getProgram } from '../get-program';
import type { ReferencePattern } from './types';
import { traverseReferences } from './index';

export type SpecifierReferencePattern = DefaultSpecifierPattern | NamedSpecifierPattern | NamespaceSpecifierPattern;

type Key = `named:${ string }` | Exclude<SpecifierReferencePattern['type'], 'named'>;

export interface DefaultSpecifierPattern extends ReferencePattern {
  type: 'default';
}

export interface NamedSpecifierPattern extends ReferencePattern {
  type: 'named';
  imported: string;
}

export interface NamespaceSpecifierPattern extends ReferencePattern {
  type: 'namespace';
}

export function traverseImportReferences (
  path: NodePath,
  source: string | RegExp,
  patterns: SpecifierReferencePattern[],
) {
  const programPath = getProgram(path);

  const patternsMap = new Map<Key, SpecifierReferencePattern>(
    patterns.map((pattern) => {
      return [
        pattern.type + (pattern.type === 'named' ? `:${ pattern.imported }` : '') as Key,
        pattern,
      ];
    }),
  );

  programPath.traverse({
    ImportDeclaration (path) {
      const { node } = path;
      const src = node.source.value;

      if (!(typeof source === 'string' ? src === source : source.test(src))) {
        return;
      }

      for (const specifier of node.specifiers) {
        let key: undefined | Key;

        switch (specifier.type) {
          case 'ImportDefaultSpecifier': {
            key = 'default';
            break;
          }

          case 'ImportNamespaceSpecifier': {
            key = 'namespace';
            break;
          }

          case 'ImportSpecifier': {
            key = `named:${ getImportedName(specifier) }`;
            break;
          }

          // no default
        }

        const pattern = patternsMap.get(key);

        if (pattern) {
          traverseReferences(path, specifier.local, pattern);
        }
      }
    },
  });
}
