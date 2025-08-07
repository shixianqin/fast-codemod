import { relative } from 'node:path';
import type { Node } from '@babel/types';
import chalk from 'chalk';
import type { FileInfo } from '../transform';

function createNodePosition (node: undefined | Node) {
  const start = node?.loc?.start;

  return start ? `:${start.line}:${start.column}` : '';
}

export function createFileLink (fileInfo: undefined | FileInfo, node?: Node) {
  if (!fileInfo) {
    return '';
  }

  return createHyperlink(
    relative(process.cwd(), fileInfo.path) + createNodePosition(node),
    createFileUrl(fileInfo, node),
  );
}

export function createFileUrl (fileInfo: undefined | FileInfo, node?: Node) {
  if (!fileInfo) {
    return '';
  }

  return `file://${fileInfo.path}${createNodePosition(node)}`;
}

/**
 * @param text - 文本
 * @param url - 链接
 * @see https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda
 * @see https://github.com/sindresorhus/ansi-escapes?tab=readme-ov-file#linktext-url
 */
export function createHyperlink (text: string, url: string) {
  const START = '\u001B]8;;';
  const END = '\u0007';

  return chalk.blue(
    START +
    url +
    END +
    text +
    START +
    END,
  );
}
