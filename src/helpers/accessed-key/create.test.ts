import { describe, expect, test } from 'vitest';
import { createAccessedKey } from '../index';

describe('valid', () => {
  const reservedKeys = ['class', 'default', 'import', 'if', 'for', 'await'];
  const validKeys = [...reservedKeys, 'foo', '$foo', '_foo', 'foo2', 'foo_bar'];

  for (const key of validKeys) {
    test(key, () => {
      const accessedKey = createAccessedKey(key);

      expect(accessedKey.key.type).toBe('Identifier');
      expect(accessedKey.computed).toBe(false);
    });
  }
});

describe('invalid', () => {
  const invalidKeys = ['1foo', '*foo', '#foo', 'foo-bar', '123'];

  for (const key of invalidKeys) {
    test(key, () => {
      const accessedKey = createAccessedKey(key);

      expect(accessedKey.key.type).toBe('StringLiteral');
      expect(accessedKey.computed).toBe(true);
    });
  }
});
