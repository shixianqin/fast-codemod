/* eslint perfectionist/sort-objects: ['error', { type: 'natural' }] */

import { traverse, types } from '@babel/core';
import { describe, expect, test } from 'vitest';
import { parse } from '../index';
import * as validators from './validators';

type ValidatorNames = keyof typeof validators;
type TestCase = `${ string }${ ValidatorNames }${ string }`;

const cases: {[K in ValidatorNames]: TestCase | TestCase[] } = {
  isAssignmentLeft: types.ASSIGNMENT_OPERATORS.map((op): TestCase => `isAssignmentLeft ${ op } 1`),
  isAssignmentPatternLeft: '[isAssignmentPatternLeft = 1] = []',
  isAssignmentPatternRight: '[a = isAssignmentPatternRight] = []',
  isAssignmentRight: types.ASSIGNMENT_OPERATORS.map((op): TestCase => `foo ${ op } isAssignmentRight`),
  isBinaryLeft: types.BINARY_OPERATORS.map((operator): TestCase => `isBinaryLeft ${ operator } foo`),
  isBinaryRight: types.BINARY_OPERATORS.map((operator): TestCase => `foo ${ operator } isBinaryRight`),
  isCallCallee: 'isCallCallee()',
  isConditionalAlternate: '1 ? 2 : isConditionalAlternate',
  isConditionalConsequent: '1 ? isConditionalConsequent : 2',
  isConditionalTest: 'isConditionalTest ? 1 : 2',
  isLogicalLeft: types.LOGICAL_OPERATORS.map((operator): TestCase => `isLogicalLeft ${ operator } foo`),
  isLogicalRight: types.LOGICAL_OPERATORS.map((operator): TestCase => `foo ${ operator } isLogicalRight`),
  isMemberObject: 'isMemberObject.foo',
  isMemberProperty: 'foo.isMemberProperty',
  isNewCallee: 'new isNewCallee()',
  isOptionalMemberObject: 'isOptionalMemberObject?.foo',
  isOptionalMemberProperty: 'foo?.isOptionalMemberProperty',
  isPropertyKey: [
    'const obj = { isPropertyKey: 1 }',
    'const { isPropertyKey: foo } = {}',
  ],
  isPropertyValue: [
    'const obj = { foo: isPropertyValue }',
    'const { foo: isPropertyValue } = {}',
  ],
};

for (const [key, value] of Object.entries(cases)) {
  const inputs = Array.isArray(value) ? value : [value];

  describe(key, () => {
    if (inputs.length === 0) {
      throw new Error('invalid input');
    }

    for (const input of inputs) {
      test(input, () => {
        let arrived = false;

        traverse(parse(input), {
          Identifier: (path) => {
            // @ts-expect-error ignore
            const validate = validators[path.node.name];

            if (path.node.name === key) {
              arrived = true;
            }

            if (validate) {
              expect(validate(path)).toBe(true);
            }
          },
        });

        if (!arrived) {
          throw new Error('invalid input');
        }
      });
    }
  });
}
