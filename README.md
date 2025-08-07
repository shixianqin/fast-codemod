# fast-codemod

An easy-to-use codemod toolkit for code migration - powered by [Babel](https://babel.dev/)
and [Recast](https://github.com/benjamn/recast), with format-preserving output.

## Features

+ Quick to write transformation logic
+ Babel-powered AST API
+ Format-preserving with Recast
+ Composable transformers
+ Built-in AST helpers
+ TypeScript is supported by default

## Installation

```shell
npm i fast-codemod -D
```

## Usage

```ts
// transform.js

import { codemod } from 'fast-codemod'

/** @type {import('fast-codemod').Transformer} */
const renameFoo = () => {
  return {
    visitor: {
      Identifier: (path) => {
        if (path.node.name === 'foo') {
          path.node.name = 'bar'
        }
      }
    }
  }
}

await codemod('src/**/*.ts', {
  recastOptions: {
    // Optional: recast options
    parser: 'babel-ts' // babel-ts, babel, flow
  },

  globOptions: {
    // Optional: glob options
  },

  transformers: [renameFoo],

  dryRun: true,
  printDiff: true,

  onResult: (fileInfo, result) => {},
})
```

```shell
node ./transform.js
```

### Main runner

```ts
import {
  codemod, // Main runner
  transform, // Run a single transform manually
} from 'fast-codemod'
```

### Helpers

```ts
import {
  // Traverse all references of a given variable — including chained member expressions.
  traverseReferences,
  traverseImportReferences,

  // Make object expression restructuring easy
  transformObject,
  isStaticObject,
  createAccessedKey,
  resolveAccessedKey,

  // Add import helpers
  addImportSideEffect,
  addImportDefault,
  addImportNamed,
  addImportNamespace,

  // Create and insert a new variable
  addVariable,

  // generateUid (Use specified name whenever possible)
  generateUid,
  generateUidIdentifier,

  // Validators
  isAssignmentLeft,
  isAssignmentRight,
  isCallCallee,
  isConditionalAlternate,
  isConditionalConsequent,
  isConditionalTest,
  isLogicalLeft,
  isLogicalRight,
  isMemberObject,
  isMemberProperty,
  isNewCallee,
  isOptionalMemberObject,
  isOptionalMemberProperty,
  isPropertyKey,
  isPropertyValue,
} from 'fast-codemod/helpers'
```

### Re-exports

From [`@babel/parser`](https://babel.dev/docs/babel-parser)

```ts
import { parse } from 'fast-codemod/babel/parser'
```

From [`@babel/traverse`](https://babel.dev/docs/babel-traverse)

```ts
import { traverse, type NodePath } from 'fast-codemod/babel/traverse'
```

From [`@babel/types`](https://babel.dev/docs/babel-types)

```ts
import * as t from 'fast-codemod/babel/types'
```

From [`fast-glob`](https://www.npmjs.com/package/fast-glob)

```ts
import FastGlob from 'fast-codemod/glob'
```
