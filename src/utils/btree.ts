import __BTree from "btree";

// https://github.com/qwertie/btree-typescript/issues/36
export const BTree = (__BTree as unknown as { default: typeof __BTree }).default;
