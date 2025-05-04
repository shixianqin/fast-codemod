import * as t from '@babel/types';
import type { ObjectProperties, RemapObjectOptions } from './types';
import { createValidKey } from './utils';

/**
 * 基于变量标识符转换
 * @param objectId
 * @param options
 */
export function remapByIdentifier (objectId: t.Identifier, options: RemapObjectOptions) {
  const properties: ObjectProperties = [];

  for (const [oldKey, newKey] of Object.entries(options.keyMap)) {
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
