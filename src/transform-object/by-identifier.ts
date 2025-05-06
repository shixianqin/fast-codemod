import * as t from '@babel/types';
import type { ObjectProperties, TransformObjectOptions } from './types';
import { createValidKey } from './utils';

/**
 * 基于变量标识符转换
 * @param objectId
 * @param options
 */
export function byIdentifier (objectId: t.Identifier, options: TransformObjectOptions) {
  const properties: ObjectProperties = [];

  if (options.rename) {
    for (const [oldKey, newKey] of Object.entries(options.rename)) {
      const newKeyObj = typeof newKey === 'string' ? { name: newKey } : newKey;
      const validNewKey = createValidKey(newKeyObj.name);
      const validOldKey = createValidKey(oldKey);

      const memberExp = t.memberExpression(
        objectId,
        validOldKey.id,
        validOldKey.computed,
      );

      if (newKeyObj.get) {
        properties.push(
          t.objectMethod(
            'get',
            validNewKey.id,
            [],
            t.blockStatement(
              [t.returnStatement(memberExp)],
            ),
            validNewKey.computed,
          ),
        );
      }
      else {
        properties.push(
          t.objectProperty(
            validNewKey.id,
            memberExp,
            validNewKey.computed,
          ),
        );
      }

      if (newKeyObj.set) {
        const valueId = t.identifier('value');

        properties.push(
          t.objectMethod(
            'set',
            validNewKey.id,
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
            validNewKey.computed,
          ),
        );
      }
    }
  }

  if (options.extract) {
    for (const [key, extract] of Object.entries(options.extract)) {
      const validKey = createValidKey(key);

      const memberExp = t.memberExpression(
        objectId,
        validKey.id,
        validKey.computed,
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
    const validNestKey = createValidKey(options.wrapUnmatchedIn);

    properties.push(
      t.objectProperty(
        validNestKey.id,
        objectId,
        validNestKey.computed,
      ),
    );
  }

  return t.objectExpression(properties);
}
