import * as t from '@babel/types';
import { createValidProperty } from '../property';
import type { ObjectProperties, TransformObjectOptions } from './types';

/**
 * 基于变量标识符转换
 * @param objectId
 * @param options
 */
export function transformFromIdentifier (objectId: t.Identifier, options: TransformObjectOptions) {
  const properties: ObjectProperties = [];

  if (options.rename) {
    for (const [oldKey, newKey] of Object.entries(options.rename)) {
      const newKeyObj = typeof newKey === 'string' ? { name: newKey } : newKey;
      const validNewProperty = createValidProperty(newKeyObj.name);
      const validOldProperty = createValidProperty(oldKey);

      const memberExp = t.memberExpression(
        objectId,
        validOldProperty.key,
        validOldProperty.computed,
      );

      if (newKeyObj.get) {
        properties.push(
          t.objectMethod(
            'get',
            validNewProperty.key,
            [],
            t.blockStatement(
              [t.returnStatement(memberExp)],
            ),
            validNewProperty.computed,
          ),
        );
      }
      else {
        properties.push(
          t.objectProperty(
            validNewProperty.key,
            memberExp,
            validNewProperty.computed,
          ),
        );
      }

      if (newKeyObj.set) {
        const valueId = t.identifier('value');

        properties.push(
          t.objectMethod(
            'set',
            validNewProperty.key,
            [valueId],
            t.blockStatement([
              t.expressionStatement(
                t.assignmentExpression(
                  '=',
                  memberExp,
                  valueId,
                ),
              ),
            ]),
            validNewProperty.computed,
          ),
        );
      }
    }
  }

  if (options.extract) {
    for (const [key, extract] of Object.entries(options.extract)) {
      const validProperty = createValidProperty(key);

      const memberExp = t.memberExpression(
        objectId,
        validProperty.key,
        validProperty.computed,
      );

      extract(memberExp, memberExp);
    }
  }

  if (options.flatUnmatched === true) {
    properties.unshift(
      t.spreadElement(objectId),
    );
  }
  else if (options.wrapUnmatchedIn) {
    const validNestKey = createValidProperty(options.wrapUnmatchedIn);

    properties.push(
      t.objectProperty(
        validNestKey.key,
        objectId,
        validNestKey.computed,
      ),
    );
  }

  return t.objectExpression(properties);
}
