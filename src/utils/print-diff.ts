import chalk, { type ChalkInstance } from 'chalk';
import { diffLines, diffWords, type ChangeObject } from 'diff';
import type { FileInfo, PrintResult } from '../transform';
import { createFileLink } from './hyper-link';

interface ChangePart extends ChangeObject<string> {
  _changeParts?: ChangePart[];
}

interface Theme {
  symbol: ' ' | '+' | '-';
  text: ChalkInstance;
  lineText?: ChalkInstance;
}

function genLinePrefix (theme: Theme, lineIndex: number) {
  let indexPrefix = lineIndex.toString();

  while (indexPrefix.length < 6) {
    indexPrefix = ` ${indexPrefix}`;
  }

  const text = theme.lineText || theme.text;

  return `${text(`${indexPrefix} | `) + theme.symbol}    `;
}

function getTheme (part: ChangeObject<string>): Theme {
  if (part.added) {
    return {
      symbol: '+',
      text: chalk.green,
    };
  }

  if (part.removed) {
    return {
      symbol: '-',
      text: chalk.red,
    };
  }

  return {
    lineText: chalk.gray,
    symbol: ' ',
    text: chalk.cyan,
  };
}

function highlightDiffs (
  theme: Theme,
  currentPart: ChangePart,
  nextPart: undefined | ChangePart,
) {
  const highlight = (text: string) => theme.text.inverse(text);

  // 修改：删除部分
  if (currentPart.removed && nextPart?.added) {
    const changeParts = diffWords(currentPart.value, nextPart.value);

    let value = '';

    for (const part of changeParts) {
      value += part.removed ? highlight(part.value) : (part.added ? '' : part.value);
    }

    currentPart.value = value;
    nextPart._changeParts = changeParts;
  }

  // 修改：新增部分
  else if (currentPart.added && currentPart._changeParts) {
    let value = '';

    for (const part of currentPart._changeParts!) {
      value += part.added ? highlight(part.value) : (part.removed ? '' : part.value);
    }

    currentPart.value = value;
  }

  // 仅新增，仅删除
  else if (currentPart.added || currentPart.removed) {
    currentPart.value = highlight(currentPart.value);
  }
}

function printDiffLines (fileInfo: FileInfo, result: PrintResult) {
  const changeParts: ChangePart[] = diffLines(fileInfo.source, result.code);

  let newLineIndex = 0;
  let oldLineIndex = 0;
  let lineData = '';

  for (const [index, part] of changeParts.entries()) {
    const theme = getTheme(part);
    const nextPart = changeParts[index + 1];

    highlightDiffs(theme, part, nextPart);

    const lines = part.value.split('\n');
    const continueNormal = !part.added && !part.removed && part.count > 5;

    lines.pop();

    if (continueNormal) {
      lineData += chalk.gray(`\n       ------ ${part.count} lines omitted ------\n\n`);
    }

    for (const line of lines) {
      if (part.added) {
        newLineIndex += 1;
      }
      else if (part.removed) {
        oldLineIndex += 1;
      }
      else {
        newLineIndex += 1;
        oldLineIndex += 1;

        if (continueNormal) {
          continue;
        }
      }

      const prefix = genLinePrefix(theme, part.removed ? oldLineIndex : newLineIndex);

      lineData += theme.text(`${prefix + line}\n`);
    }
  }

  process.stdout.write(lineData);
}

export function printDiff (fileInfo: FileInfo, result: PrintResult) {
  // eslint-disable-next-line no-console
  console.log(
    chalk.blue.bold('###'),
    createFileLink(fileInfo),
  );

  if (fileInfo.source === result.code) {
    // eslint-disable-next-line no-console
    console.log(
      chalk.gray('No changes\n'),
    );

    return;
  }

  printDiffLines(fileInfo, result);

  // eslint-disable-next-line no-console
  console.log('');
}
