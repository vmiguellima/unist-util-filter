/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist-util-is').Test} Test
 *
 * @typedef Options
 *   Configuration (optional).
 * @property {boolean} [cascade=true]
 *   Whether to drop parent nodes if they had children, but all their children
 *   were filtered out.
 *
 * @typedef {Options} FilterOptions
 *   Deprecated, use `Options`.
 */

import {convert} from 'unist-util-is'

const own = {}.hasOwnProperty

/**
 * Create a new `tree` of copies of all nodes that pass `test`.
 * The tree is walked in preorder (NLR), visiting the node itself, then its
 * head, etc.
 *
 * @param tree
 *   Tree to filter.
 * @param options
 *   Configuration (optional).
 * @param test
 *   `unist-util-is`-compatible test (such as a type).
 * @returns
 *   New filtered tree.
 *   `null` is returned if `tree` itself didn’t pass the test, or is cascaded
 *   away.
 */
export const filter =
  /**
   * @type {(
   *  (<Tree extends Node, Check extends Test>(node: Tree, options: Options, test: Check) => import('./complex-types').Matches<Tree, Check>) &
   *  (<Tree extends Node, Check extends Test>(node: Tree, test: Check) => import('./complex-types').Matches<Tree, Check>) &
   *  (<Tree extends Node>(node: Tree, options?: Options) => Tree)
   * )}
   */
  (
    /**
     * @param {Node} tree
     * @param {Options} options
     * @param {Test} test
     * @returns {Node|null}
     */
    function (tree, options, test) {
      const is = convert(test || options)
      const cascade =
        options.cascade === undefined || options.cascade === null
          ? true
          : options.cascade

      return preorder(tree)

      /**
       * @param {Node} node
       * @param {number|undefined} [index]
       * @param {Parent|undefined} [parent]
       * @returns {Node|null}
       */
      function preorder(node, index, parent) {
        /** @type {Array<Node>} */
        const children = []
        /** @type {number} */
        let childIndex
        /** @type {Node} */
        let result
        /** @type {string} */
        let key

        if (!is(node, index, parent)) return null

        // @ts-expect-error: Looks like a parent.
        if (node.children) {
          childIndex = -1

          // @ts-expect-error Looks like a parent.
          while (++childIndex < node.children.length) {
            // @ts-expect-error Looks like a parent.
            result = preorder(node.children[childIndex], childIndex, node)

            if (result) {
              children.push(result)
            }
          }

          // @ts-expect-error Looks like a parent.
          if (cascade && node.children.length > 0 && children.length === 0)
            return null
        }

        // Create a shallow clone, using the new children.
        /** @type {typeof node} */
        // @ts-expect-error all the fields will be copied over.
        const next = {}

        for (key in node) {
          if (own.call(node, key)) {
            // @ts-expect-error: Looks like a record.
            next[key] = key === 'children' ? children : node[key]
          }
        }

        return next
      }
    }
  )
