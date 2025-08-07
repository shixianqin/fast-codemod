import { readFile, writeFile } from 'node:fs/promises';
import fastGlob, { type Options as GlobOptions, type Pattern as GlobPattern } from 'fast-glob';
import { transform, type FileInfo, type PrintResult, type TransformOptions } from './transform';
import { printDiff } from './utils/print-diff';

export interface CodemodOptions extends TransformOptions {
  dryRun?: boolean;
  globOptions?: GlobOptions;
  printDiff?: boolean;
  onResult?: (fileInfo: FileInfo, result: PrintResult) => void;
}

export async function codemod (source: GlobPattern | GlobPattern[], options: CodemodOptions) {
  const entries = await fastGlob(source, {
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

  return Promise.all(promises);
}
