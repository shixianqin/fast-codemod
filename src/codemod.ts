import { readFile, writeFile } from 'node:fs/promises';
import fg, { type Options as GlobOptions, type Pattern as GlobPattern } from 'fast-glob';
import { printDiff } from './print-diff';
import type { PrintResult } from './recast/print';
import { transform, type FileInfo, type TransformOptions } from './transform';

export interface CodemodOptions extends TransformOptions {
  source: GlobPattern;
  dryRun?: boolean;
  globOptions?: GlobOptions;
  printDiff?: boolean;
  onResult?: (fileInfo: FileInfo, result: PrintResult) => void;
}

export async function codemod (options: CodemodOptions) {
  const entries = await fg(options.source, {
    ...options.globOptions,
    absolute: true,
    onlyFiles: true,
    stats: true,
  });

  const promises = entries.map(async (entry) => {
    const fileInfo: FileInfo = {
      name: entry.name,
      path: entry.path,
      source: await readFile(entry.path, 'utf8'),
      stats: entry.stats,
    };

    const result = transform(fileInfo.source, options, fileInfo);

    if (options.printDiff) {
      printDiff(fileInfo, result);
    }

    if (!options.dryRun) {
      await writeFile(fileInfo.path, result.code);
    }

    options.onResult?.(fileInfo, result);
  });

  return Promise.allSettled(promises);
}
