import type * as t from '@babel/types';
import chalk, { type ChalkInstance } from 'chalk';
import type { FileInfo } from '../transform';

export interface ReportInfo {
  message: string;
  node?: t.Node;
  severity?: 'error' | 'info' | 'warn';
}

export function report (fileInfo: undefined | FileInfo, info: ReportInfo) {
  let text: ChalkInstance;

  switch (info.severity) {
    case 'error': {
      text = chalk.red.bold;
      break;
    }

    case 'info': {
      text = chalk.blue.bold;
      break;
    }

    // case 'warn':
    default: {
      text = chalk.yellow.bold;
      break;
    }
  }

  const start = info.node?.loc?.start;
  const position = start ? `:${start.line}:${start.column}` : '';
  const content = `[Transform report ${info.severity || 'warn'}] - ${(fileInfo?.path || '') + position}`;

  console.log(text(`${content}\n${info.message}`));
}
