import { types, type NodePath } from '@babel/core';
import { generateUidIdentifier } from '../generate-uid';
import { getProgram } from '../get-program';
import type { AddImportOptions, ImportKind, ImportModuleSpecifier, ImportPath } from './types';
import { getImportKind, hasConflictSpecifier } from './utils';

export class Importer {
  program: NodePath<types.Program>;
  source: string;
  options?: AddImportOptions;
  importKind: ImportKind;
  importPaths: ImportPath[] = [];
  lastImportPath?: ImportPath;

  constructor (path: NodePath, source: string, options?: AddImportOptions) {
    this.program = getProgram(path);
    this.source = source;
    this.options = options;
    this.importKind = options?.importKind || 'value';

    for (const statementPath of this.program.get('body')) {
      if (!statementPath.isImportDeclaration()) {
        continue;
      }

      if (statementPath.node.source.value === source) {
        this.importPaths.push(statementPath);
      }

      this.lastImportPath = statementPath;
    }
  }

  addDeclaration (specifiers: ImportModuleSpecifier[]) {
    const declaration = types.importDeclaration(specifiers, types.stringLiteral(this.source));

    declaration.importKind = this.importKind;

    if (this.lastImportPath) {
      this.lastImportPath.insertAfter(declaration);
    }
    else {
      this.program.unshiftContainer('body', declaration);
    }
  }

  addSpecifier (specifier: ImportModuleSpecifier) {
    const preferTypeImportInline = specifier.type === 'ImportSpecifier' && this.importKind !== 'value' && this.options?.preferTypeImportInline;

    let targetImportPath: undefined | ImportPath;

    for (const importPath of this.importPaths) {
      if (hasConflictSpecifier(importPath, specifier)) {
        continue;
      }

      const importKind = getImportKind(importPath);

      if (importKind === this.importKind) {
        targetImportPath = importPath;
        break;
      }

      if (preferTypeImportInline && importKind === 'value' && importPath.node.specifiers.length > 0) {
        specifier.importKind = this.importKind;
        targetImportPath = importPath;
        break;
      }
    }

    if (targetImportPath) {
      if (specifier.type === 'ImportDefaultSpecifier') {
        targetImportPath.unshiftContainer('specifiers', specifier);
      }
      else {
        targetImportPath.pushContainer('specifiers', specifier);
      }
    }
    else {
      this.addDeclaration([specifier]);
    }
  }

  findLocal (predicate: (specifier: ImportModuleSpecifier) => boolean) {
    for (const importPath of this.importPaths) {
      for (const specifier of importPath.node.specifiers) {
        if (predicate(specifier) && getImportKind(importPath, specifier) === this.importKind) {
          return specifier.local;
        }
      }
    }
  }

  generateLocal (name?: string) {
    return generateUidIdentifier(
      this.program,
      this.options?.nameHint || name || this.source,
    );
  }
}
