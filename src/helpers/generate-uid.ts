import { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';

function hasBinding (path: NodePath, name: string) {
  // 检查当前作用域和父级作用域是否存在
  let has = path.scope.hasBinding(name);

  if (!has) {
    // 遍历所有的子作用域检查是否存在
    path.traverse({
      Scopable: (path) => {
        if (has || path.scope.hasOwnBinding(name)) {
          has = true;
          path.skip();
        }
      },
    });
  }

  return has;
}

/**
 * 由于 scope.generateUid 方法在任何情况下都会给名称加上 `_` 前缀
 * 但是在代码迁移的场景中，尽可能保留原始名称有助于生成更可读、差异更小的代码
 * 为避免变量遮蔽或逻辑冲突，会检查当前路径**上下的所有作用域**，一旦发现同名变量存在，即认为该名称不可用。
 * 若名称无效或已被占用，则回退使用 scope.generateUid
 * @param path
 * @param name
 */
export function generateUid (path: NodePath, name?: string) {
  if (!name || !t.isValidIdentifier(name) || hasBinding(path, name)) {
    return path.scope.generateUid(name);
  }

  return name;
}

export function generateUidIdentifier (path: NodePath, name?: string) {
  return t.identifier(
    generateUid(path, name),
  );
}
