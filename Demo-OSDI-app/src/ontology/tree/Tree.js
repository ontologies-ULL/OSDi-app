// import { Node } from "./Node";

// export class Tree {
//   constructor(data) {
//     this._root = new Node(data);
//   }

//   find = (data, node = this._root) => {
//     if (node.data === data) return node;

//     for (const child of node.children) {
//       const found = this.find(data, child);
//       if (found) return found;
//     }
//     return null;
//   };

//   add = (data, parentData) => {
//     const parent = this.find(parentData);
//     if (!parent) {
//       throw new Error(`Parent "${parentData}" not found`);
//     }

//     const node = new Node(data);
//     node.parent = parent;
//     parent.children.push(node);
//     return node;
//   };

//   forEach = (cb, node = this._root) => {
//     cb(node);
//     node.children.forEach(child => this.forEach(cb, child));
//   };
// }
