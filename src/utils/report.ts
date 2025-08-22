import type * as t from '@babel/core';
import chalk, { type ChalkInstance } from 'chalk';
import type { FileInfo } from '../transform';
import { createFileUrl } from './hyper-link';

export interface ReportInfo {
  message: string;
  node?: t.Node;
  severity?: 'error' | 'info' | 'warn';
}

export function report (fileInfo: undefined | FileInfo, info: ReportInfo) {
  let text: ChalkInstance;
  let symbol: string;

  switch (info.severity) {
    case 'error': {
      text = chalk.red.bold;
      symbol = '❌';
      break;
    }

    case 'info': {
      text = chalk;
      symbol = 'ℹ️';
      break;
    }

    // case 'warn':
    default: {
      text = chalk.yellow.bold;
      symbol = '⚠️';
      break;
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    symbol,
    text(`[TRANSFORM ${ (info.severity || 'warn').toUpperCase() }]`),
    '-',
    createFileUrl(fileInfo, info.node),
    text(`\n${ info.message }`),
  );
}
