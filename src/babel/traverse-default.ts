import _traverse from '@babel/traverse';

/**
 * traverse 是一个 CommonJS 模块
 * 使用 ES 模块默认导入时，得到的结果是 `module.exports` 对象
 * Node 原生导入时并没有自动识别 `module.exports.default`，所以这里需要手动兼容
 * @see https://nodejs.org/api/esm.html#interoperability-with-commonjs
 */
// @ts-expect-error ignore
export const traverse: typeof _traverse = _traverse.default || _traverse;
