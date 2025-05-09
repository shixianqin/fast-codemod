import type { NodePath } from '@babel/traverse';
import { getImportedName } from '../add-imports/utils';
import { getProgram } from '../get-program';
import type { ReferencePattern } from './types';
import { traverseReferences } from './index';

export interface DefaultSpecifierPattern extends ReferencePattern {
  type: 'default';
}

export interface NamedSpecifierPattern extends ReferencePattern {
  imported: string;
  type?: 'named';
}

export interface NamespaceSpecifierPattern extends ReferencePattern {
  type: 'namespace';
}

export type SpecifierReferencePattern = DefaultSpecifierPattern | NamedSpecifierPattern | NamespaceSpecifierPattern;

export function traverseImportReferences (
  path: NodePath,
  source: string | RegExp,
  patterns: SpecifierReferencePattern[],
) {
  const programPath = getProgram(path);

  programPath.traverse({
    ImportDeclaration (path) {
      const { node } = path;
      const src = node.source.value;

      if (!(typeof source === 'string' ? src === source : source.test(src))) {
        return;
      }

      for (const specifier of node.specifiers) {
        let type: SpecifierReferencePattern['type'];
        let importedName: undefined | string;

        switch (specifier.type) {
          case 'ImportDefaultSpecifier': {
            type = 'default';
            break;
          }

          case 'ImportNamespaceSpecifier': {
            type = 'namespace';
            break;
          }

          // case 'ImportSpecifier':
          default: {
            type = 'named';
            importedName = getImportedName(specifier);
          }
        }

        for (const pattern of patterns) {
          if (
            (!pattern.type || pattern.type === 'named')
              ? (importedName && pattern.imported === importedName)
              : pattern.type === type
          ) {
            traverseReferences(path, specifier.local, pattern);
          }
        }
      }
    },
  });
}
