import * as t from '@babel/types';
import type { ObjectProperties, TransformObjectOptions } from './types';
import { createValidKey } from './utils';

/**
 * 基于变量标识符转换
 * @param objectId
 * @param options
 */
export function transformByIdentifier (objectId: t.Identifier, options: TransformObjectOptions) {
  const properties: ObjectProperties = [];

  if (options.remap) {
    for (const [oldKey, newKey] of Object.entries(options.remap)) {
      const newKeyObj = typeof newKey === 'string' ? { key: newKey } : newKey;
      const validNewKey = createValidKey(newKeyObj.key);
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

  if (options.extractor) {
    for (const key of Object.keys(options.extractor)) {
      const validKey = createValidKey(key);

      const exp = t.memberExpression(
        objectId,
        validKey.id,
        validKey.computed,
      );

      options.extractor[key](exp);
    }
  }

  if (options.preserveUnmatched) {
    properties.unshift(
      t.spreadElement(objectId),
    );
  }
  else if (options.nestUnmatchedIn) {
    const validNestKey = createValidKey(options.nestUnmatchedIn);

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
