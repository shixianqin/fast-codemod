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
// @file transform.js

import { codemod } from 'fast-codemod'

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

await codemod({
  // Traversing files based on fast-glob
  source: 'src/**/*.ts',

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

## Exports

```ts
import {
  codemod, // Main runner

  t, // Alias for @babel/types
  types, // Also @babel/types

  transform, // Run a single transform manually

  parse, // Parse code (recast)
  print, // Print code (recast)

  // Traverse all references of a given variable — including chained member expressions.
  traverseReferences,
  traverseImportReferences,

  // Quickly remap keys in an object expression based on a given key map.
  remapObject,

  // Add import helpers
  addImportSideEffect,
  addImportDefault,
  addImportNamed,
  addImportNamespace,

  // generateUid (Use specified name whenever possible)
  generateUid,
  generateUidIdentifier,
  
} from 'fast-codemod'
```

### Re-export from `@babel/traverse`

```ts
import traverse, { type NodePath } from 'fast-codemod/babel/traverse'
```

### Re-export from `@babel/types`

```ts
import * as t from 'fast-codemod/babel/types'
```

### Re-export from `recast`

```ts
import { parse, print } from 'fast-codemod/recast'
```