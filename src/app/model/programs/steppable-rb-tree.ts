import { SteppableProgram } from '../instructions/steppable-program';
import { Method } from '../instructions/method';
import { NilNode, Node } from '../redblacktree/node';
import { LET } from '../instructions/let';
import { WHILE } from '../instructions/while';
import { DESCRIBE } from '../instructions/instruction';
import { IF } from '../instructions/if';
import { RETURN } from '../instructions/return';
import { RUN } from '../instructions/run';
import { Geometry, Graph } from '@maxgraph/core';
import { BLACK, RED } from '../redblacktree/color';
import { CALL } from '../instructions/call';
import { TreeExport } from '../../dto/tree-export';
import { safeStringify } from '../../../util/json';

export function createSteppableRBTree(graph: Graph): SteppableProgram {
  let root: Node;

  function getAllChildrenOf(node: Node): Node[] {
    if (!node) {
      return [];
    }
    const arr: Node[] = [];
    if (node.left) {
      arr.push(node.left);
      arr.push(...getAllChildrenOf(node.left));
    }
    if (node.right) {
      arr.push(node.right);
      arr.push(...getAllChildrenOf(node.right));
    }
    return arr;
  }

  function organizeGeometry(): void {
    organizeGeometryNode(root, 0, 1000);
  }

  function organizeGeometryNode(node: Node, layer: number, center: number): void {
    if (!node) {
      return;
    }

    node.mxNode.setGeometry(new Geometry(center, layer * 100, 40, 40));

    graph.refresh(node.mxNode);
    node.mxNode.getIncomingEdges().forEach((e) => graph.refresh(e));
    node.mxNode.getOutgoingEdges().forEach((e) => graph.refresh(e));
    const heightDependentOffset = 2 / (layer + 1);
    const leftCenter = center - 100 * heightDependentOffset;
    const rightCenter = center + 100 * heightDependentOffset;
    organizeGeometryNode(node?.left, layer + 1, leftCenter);
    organizeGeometryNode(node?.right, layer + 1, rightCenter);
  }

  function rotateRight(node: Node): void {
    let parent = node.parent;
    let leftChild = node.left;

    node.left = leftChild.right;
    if (!!leftChild.right) {
      leftChild.right.parent = node;
    }

    leftChild.right = node;
    node.parent = leftChild;

    replaceParentsChild(parent, node, leftChild);
  }

  function rotateLeft(node: Node): void {
    let parent = node.parent;
    let rightChild = node.right;

    node.right = rightChild.left;
    if (!!rightChild.left) {
      rightChild.left.parent = node;
    }

    rightChild.left = node;
    node.parent = rightChild;

    replaceParentsChild(parent, node, rightChild);
  }

  function replaceParentsChild(parent: Node, oldChild: Node, newChild: Node): void {
    if (parent === null) {
      root = newChild;
    } else if (parent.left === oldChild) {
      oldChild.destroy();
      parent.left = newChild;
    } else if (parent.right === oldChild) {
      oldChild.destroy();
      parent.right = newChild;
    } else {
      throw new Error('Node is not a child of its parent');
    }

    if (!!newChild) {
      newChild.parent = parent;
    }
  }

  function findMinimum(node: Node): Node {
    while (!!node.left) {
      node = node.left;
    }
    return node;
  }

  function getSibling(node: Node): Node {
    const parent = node.parent;
    if (node === parent.left) {
      return parent.right;
    } else if (node === parent.right) {
      return parent.left;
    } else {
      throw new Error('Parent is not a child of its grandparent');
    }
  }

  const program = new SteppableProgram();

  program.implement({
    fields: [],
    methods: [
      new Method({
        // searchNode(key: number): Node {
        name: 'searchNode',
        argNames: ['key'],
        argTypes: ['number'],
        public: true,
        instructions: [
          // let node = this.root
          new LET({
            description: DESCRIBE.LET.READFROM('root'),
            name: 'node',
            value: () => root,
          }),
          // while (node)
          new WHILE({
            condition: (rw) => rw.readVariable('node'),
            body: [
              new IF({
                description: DESCRIBE.IF.MAKE('key === node.data'),
                condition: (rw) => rw.readVariable<number>('key') === rw.readVariable<Node>('node').data,
                body: [new RETURN({ returnVal: (rw) => rw.readVariable('node') })],
              }),
              // const tempData = node.data;
              new LET({
                description: DESCRIBE.LET.READFROM('node.data'),
                name: 'tempData2',
                value: (rw) => rw.readVariable<Node>('node').data,
              }),
              // if key < tempData
              new IF({
                description: DESCRIBE.IF.MAKE('key < tempData2'),
                condition: (rw) => rw.readVariable('key') < rw.readVariable('tempData2'),
                body: [new RUN((rw) => rw.writeVariable('node', rw.readVariable<Node>('node').left))],
              }),

              new IF({
                description: DESCRIBE.IF.MAKE('key > tempData2'),
                condition: (rw) => rw.readVariable('key') > rw.readVariable('tempData2'),
                body: [new RUN((rw) => rw.writeVariable('node', rw.readVariable<Node>('node').right))],
              }),
            ],
          }),
          new RETURN({ returnVal: () => null }),
        ],
      }),
      // insertNode(key: number): void
      new Method({
        name: 'insertNode',
        argNames: ['key'],
        argTypes: ['number'],
        public: true,
        instructions: [
          // let node = this.root;
          new LET({
            description: DESCRIBE.LET.READFROM('this.root'),
            name: 'node',
            value: () => root,
          }),
          // let parent: Node = null;
          new LET({
            description: DESCRIBE.LET.READFROM('null'),
            name: 'parent',
            value: () => null,
          }),
          // Traverse the tree to left or right depending on the key, where to insert
          // while (node) {
          new WHILE({
            description: DESCRIBE.WHILE.MAKE('node'),
            condition: (rw) => rw.readVariable('node'),
            body: [
              // parent = node;
              new RUN((rw) => rw.writeVariable('parent', rw.readVariable('node'))).setDescription('parent = node'),

              // const tempData = node.data;
              new LET({
                description: DESCRIBE.LET.READFROM('node.data'),
                name: 'tempData',
                value: (rw) => rw.readVariable<Node>('node').data,
              }),
              // if (key < tempData) {
              new IF({
                description: DESCRIBE.IF.MAKE('key < tempData'),
                condition: (rw) => rw.readVariable('key') < rw.readVariable('tempData'),
                body: [
                  new RUN((rw) => rw.writeVariable('node', rw.readVariable<Node>('node').left)).setDescription(
                    'node = node.left'
                  ),
                ],
              }),
              // if (key > tempData) {
              new IF({
                description: DESCRIBE.IF.MAKE('key > tempData'),
                condition: (rw) => rw.readVariable('key') > rw.readVariable('tempData'),
                body: [
                  // node = node.right
                  new RUN((rw) => rw.writeVariable('node', rw.readVariable<Node>('node').right)).setDescription(
                    'node = node.right'
                  ),
                ],
              }),

              // if key === tempData
              new IF({
                description: DESCRIBE.IF.MAKE('key === tempData'),
                condition: (rw) => rw.readVariable('key') === rw.readVariable('tempData'),
                body: [
                  new RUN((rw) => {
                    // throw new Error('Tree already contains key ' + rw.readVariable('key'));
                    console.error('Tree already contains key ' + rw.readVariable('key'));
                  }).setDescription("console.error('Tree already contains key' + key)"),
                  new RETURN({}),
                ],
              }),

              /**
               * So it appears that when there is a return inside another if block at the end, and the if is inside a loop,
               * the next instruction after the if will still be executed for some reason.
               * Should look into this, but this is a hot fix for now.
               */
              new RUN(() => {}).setDescription('Please ignore me (i fix a runtime bug)'),
            ],
          }),

          // Actually insert the node
          new LET({
            description: DESCRIBE.LET.READFROM('new Node(key, graph)'),
            name: 'newNode',
            value: (rw) => {
              const newNode = new Node(rw.readVariable('key'), graph);
              newNode.color = RED;
              return newNode;
            },
          }),

          // helper because if elseif else is not supported
          new LET({
            description: DESCRIBE.LET.READFROM('evaluate case'),
            name: 'insertCase',
            value: (rw) => {
              const parent = rw.readVariable<Node>('parent');
              const key = rw.readVariable<number>('key');
              if (!parent) {
                return 'root';
              } else if (key < parent.data) {
                return 'left';
              } else {
                return 'right';
              }
            },
          }),

          new IF({
            description: DESCRIBE.IF.MAKE('!parent'),
            condition: (rw) => rw.readVariable('insertCase') === 'root',
            body: [new RUN((rw) => (root = rw.readVariable('newNode'))).setDescription('root = newNode')],
          }),
          new IF({
            description: DESCRIBE.IF.MAKE('key < parent.data'),
            condition: (rw) => rw.readVariable('insertCase') === 'left',
            body: [
              new RUN((rw) => (rw.readVariable<Node>('parent').left = rw.readVariable('newNode'))).setDescription(
                'parent.left = newNode'
              ),
            ],
          }),

          new IF({
            description: DESCRIBE.IF.MAKE('key > parent.data'),
            condition: (rw) => rw.readVariable('insertCase') === 'right',
            body: [
              new RUN((rw) => (rw.readVariable<Node>('parent').right = rw.readVariable('newNode'))).setDescription(
                'parent.right = newNode'
              ),
            ],
          }),

          new RUN((rw) => (rw.readVariable<Node>('newNode').parent = rw.readVariable('parent'))).setDescription(
            'newNode.parent = parent'
          ),

          new CALL({
            methodName: 'fixRedBlackPropertiesAfterInsert',
            arguments: (rw) => {
              const map = new Map<string, Node>();
              map.set('node', rw.readVariable('newNode'));
              return map;
            },
          }),

          new RUN(() => organizeGeometry()).setDescription('_organizeGeometry()'),

          // perhaps organize geometry
        ],
      }),
      new Method({
        name: 'fixRedBlackPropertiesAfterInsert',
        argNames: ['node'],
        instructions: [
          new LET({
            name: 'parent',
            value: (rw) => rw.readVariable<Node>('node').parent,
          }),

          // Case 1: Parent is null, we've reached the root, the end of the recursion
          new IF({
            description: DESCRIBE.IF.MAKE('parent === null'),
            condition: (rw) => rw.readVariable('parent') === null,
            body: [new RUN((rw) => (rw.readVariable<Node>('node').color = BLACK)), new RETURN({})],
          }),

          // Parent is black --> nothing to do
          new IF({
            description: DESCRIBE.IF.MAKE('parent.color === BLACK'),
            condition: (rw) => rw.readVariable<Node>('parent').color === BLACK,
            body: [new RETURN({})],
          }),

          // From here on, parent is red
          new LET({
            description: DESCRIBE.LET.READFROM('parent.parent'),
            name: 'grandparent',
            value: (rw) => rw.readVariable<Node>('parent').parent,
          }),

          // Case 2

          // Get the uncle (may be null/nil, in which case its color is BLACK)
          new LET({
            description: DESCRIBE.LET.READFROM('getUncle()'),
            name: 'uncle',
            value: (rw) => getUncle(rw.readVariable('parent')), // not implemented as steppable on purpose => complexity
          }),

          new LET({
            description: DESCRIBE.LET.READFROM('evaluate cases'),
            name: 'case',
            value: (rw) => {
              const uncle = rw.readVariable<Node>('uncle');
              const parent = rw.readVariable<Node>('parent');
              const grandparent = rw.readVariable<Node>('grandparent');

              if (!!uncle && uncle.color === RED) {
                return 'uncle_red';
              } else if (parent === grandparent.left) {
                return 'parent_is_left';
              } else {
                return 'else';
              }
            },
          }),

          new IF({
            description: DESCRIBE.IF.MAKE('!!uncle && uncle.color === RED'),
            condition: (rw) => {
              return rw.readVariable('case') === 'uncle_red';
            },
            body: [
              new RUN((rw) => (rw.readVariable<Node>('parent').color = BLACK)).setDescription('parent.color = BLACK'),
              new RUN((rw) => (rw.readVariable<Node>('grandparent').color = RED)).setDescription(
                'grandparent.color = RED'
              ),
              new RUN((rw) => (rw.readVariable<Node>('uncle').color = BLACK)).setDescription('uncle.color = BLACK'),

              // Call recursively for grandparent, which is now red.
              // It might be root or have a red parent, in which case we need to fix more...
              new CALL({
                methodName: 'fixRedBlackPropertiesAfterInsert',
                arguments: (rw) => {
                  const map = new Map<string, Node>();
                  map.set('node', rw.readVariable('grandparent'));
                  return map;
                },
              }),
            ],
          }),

          // Parent is left child of grandparent
          new IF({
            description: 'parent === grandparent.left',
            condition: (rw) => rw.readVariable('case') === 'parent_is_left',
            body: [
              new IF({
                description: DESCRIBE.IF.MAKE('node === parent.right'),
                condition: (rw) => rw.readVariable('node') === rw.readVariable<Node>('parent').right,
                body: [
                  // TODO maybe make this a call as well
                  new RUN((rw) => rotateLeft(rw.readVariable('parent'))).setDescription('rotateLeft(parent)'),
                ],
              }),

              // TODO make rotateRight a call as well maybe
              new RUN((rw) => rotateRight(rw.readVariable('grandparent'))).setDescription('rotateRight(grandparent)'),
              new RUN((rw) => (rw.readVariable<Node>('parent').color = BLACK)).setDescription('parent.color = BLACK'),
              new RUN((rw) => (rw.readVariable<Node>('grandparent').color = RED)).setDescription(
                'grandparent.color = RED'
              ),
            ],
          }),

          // Parent is right child of grandparent
          new IF({
            description: 'else',
            condition: (rw) => rw.readVariable('case') === 'else',
            body: [
              // Case 4b: Uncle is black and node is right->left "inner child" of its grandparent
              new IF({
                description: DESCRIBE.IF.MAKE('node === parent.left'),
                condition: (rw) => rw.readVariable('node') === rw.readVariable<Node>('parent').left,
                body: [
                  new RUN((rw) => rotateRight(rw.readVariable('parent'))),

                  // Let "parent" point to the new root node of the rotated sub-tree.
                  // It will be recolored in the next step, which we're going to fall-through to.
                  new RUN((rw) => rw.writeVariable('parent', rw.readVariable('node'))),
                ],
              }),

              // Case 5b: Uncle is black and node is right->right "outer child" of its grandparent
              new RUN((rw) => rotateLeft(rw.readVariable('grandparent'))),

              // Recolor original parent and grandparent
              new RUN((rw) => (rw.readVariable<Node>('parent').color = BLACK)),
              new RUN((rw) => (rw.readVariable<Node>('grandparent').color = RED)),
            ],
          }),
        ],
      }),
      // deleteNode(key: number): void {
      new Method({
        name: 'deleteNode',
        argNames: ['key'],
        argTypes: ['number'],
        public: true,
        instructions: [
          // let node = this.node
          new LET({
            description: DESCRIBE.LET.READFROM('root'),
            name: 'node',
            value: () => root,
          }),

          // Find node to be deleted
          new WHILE({
            description: DESCRIBE.WHILE.MAKE('node && node.data !== key'),
            condition: (rw) => rw.readVariable<Node>('node').data !== rw.readVariable('key'),
            body: [
              new LET({
                description: DESCRIBE.LET.READFROM('key < node.data'),
                name: 'left',
                value: (rw) => rw.readVariable('key') < rw.readVariable<Node>('node').data,
              }),
              new IF({
                description: DESCRIBE.IF.MAKE('left'),
                condition: (rw) => rw.readVariable('left'),
                body: [
                  new RUN((rw) => rw.writeVariable('node', rw.readVariable<Node>('node').left)).setDescription(
                    'node = node.left;'
                  ),
                ],
              }),

              new IF({
                description: DESCRIBE.IF.MAKE('!left'),
                condition: (rw) => !rw.readVariable('left'),
                body: [
                  new RUN((rw) => rw.writeVariable('node', rw.readVariable<Node>('node').right)).setDescription(
                    'node = node.right'
                  ),
                ],
              }),
            ],
          }),

          // Node not found?
          new IF({
            description: DESCRIBE.IF.MAKE('!node'),
            condition: (rw) => !rw.readVariable('node'),
            body: [new RETURN({})],
          }),

          // At this point, "node" is the node to be deleted

          // In this variable, we'll store the node at which we're going to start to fix the R-B
          // properties after deleting a node.
          new LET({
            description: DESCRIBE.LET.READFROM('null'),
            name: 'movedUpNode',
            value: () => null,
          }),
          new LET({
            description: DESCRIBE.LET.READFROM('null'),
            name: 'deletedNodeColor',
            value: () => BLACK, // TODO should this be declared here?
          }),

          new LET({
            description: DESCRIBE.LET.READFROM('!node.left || !node.right'),
            name: 'oneOrZeroChildren',
            value: (rw) => !rw.readVariable<Node>('node').left || !rw.readVariable<Node>('node').right,
          }),

          // Node has zero or one child
          new IF({
            description: DESCRIBE.IF.MAKE('oneOrZeroChildren'),
            condition: (rw) => rw.readVariable('oneOrZeroChildren'),
            body: [
              new CALL({
                methodName: 'deleteNodeWithZeroOrOneChild',
                arguments: (rw) => {
                  const map = new Map<string, Node>();
                  map.set('node', rw.readVariable('node'));
                  return map;
                },
                writeReturnValueInto: 'movedUpNode',
              }),
              new RUN(() => console.log('#')),
              new RUN((rw) => rw.writeVariable('deletedNodeColor', rw.readVariable<Node>('node').color)).setDescription(
                'deleteNodeColor = node.color;'
              ),
            ],
          }),

          // Node has two children
          new IF({
            description: 'else',
            condition: (rw) => !rw.readVariable('oneOrZeroChildren'),
            body: [
              // Find minimum node of right subtree ("inorder successor" of current node)
              new LET({
                description: DESCRIBE.LET.READFROM('findMinimum(node.right)'),
                name: 'inOrderSuccessor',
                value: (rw) => findMinimum(rw.readVariable<Node>('node').right),
              }),

              // Copy inorder successor's data to current node (keep its color!)
              new RUN(
                (rw) => (rw.readVariable<Node>('node').data = rw.readVariable<Node>('inOrderSuccessor').data)
              ).setDescription('node.data = inOrderSuccessor.data'),

              // Delete inorder successor just as we would delete a node with 0 or 1 child

              new CALL({
                methodName: 'deleteNodeWithZeroOrOneChild',
                arguments: (rw) => {
                  const map = new Map<string, Node>();
                  map.set('node', rw.readVariable('inOrderSuccessor'));
                  return map;
                },
                writeReturnValueInto: 'movedUpNode',
              }),
              new RUN(() => console.log('++')),
              new RUN((rw) => rw.writeVariable('deletedNodeColor', rw.readVariable<Node>('inOrderSuccessor').color)),
            ],
          }),

          new IF({
            description: DESCRIBE.LET.READFROM('deletedNodeColor === BLACK'),
            condition: (rw) => rw.readVariable('deletedNodeColor') === BLACK, // TODO CALL
            body: [
              new CALL({
                methodName: 'fixRedBlackPropertiesAfterDelete',
                arguments: (rw) => {
                  const map = new Map<string, Node>();
                  map.set('node', rw.readVariable('movedUpNode'));
                  return map;
                },
              }).setDescription('fixRedBlackPropertiesAfterDelete(movedUpNode)'),

              // Remove the temporary NIL node
              new IF({
                description: DESCRIBE.IF.MAKE('movedUpNode instanceof NilNode'),
                condition: (rw) => rw.readVariable('movedUpNode') instanceof NilNode,
                body: [
                  new RUN((rw) =>
                    replaceParentsChild(
                      rw.readVariable<Node>('movedUpNode').parent,
                      rw.readVariable('movedUpNode'),
                      null
                    )
                  ).setDescription('replaceParentsChild(movedUpNode.parent, movedUpNode, child)'),
                ],
              }),
            ],
          }),
        ],
      }),

      new Method({
        name: 'fixRedBlackPropertiesAfterDelete',
        argNames: ['node'],
        instructions: [
          // Case 1: Examined node is root, end of recursion
          new IF({
            description: DESCRIBE.IF.MAKE('node === root'),
            condition: (rw) => rw.readVariable('node') === root,
            body: [
              // Enforces black roots
              new RUN((rw) => (rw.readVariable<Node>('node').color = BLACK)),
              new RETURN({}),
            ],
          }),

          new LET({
            description: DESCRIBE.LET.READFROM('getSibling(node)'),
            name: 'sibling',
            value: (rw) => rw.readVariable('node'),
          }),

          // Case 2: Red sibling
          new IF({
            description: DESCRIBE.IF.MAKE('sibling.color === RED'),
            condition: (rw) => rw.readVariable<Node>('sibling').color === RED,
            body: [
              new CALL({
                methodName: 'handleRedSibling',
                arguments: (rw) => {
                  const map = new Map<string, Node>();
                  map.set('node', rw.readVariable('node'));
                  map.set('sibling', rw.readVariable('sibling'));
                  return map;
                },
              }),
              // TODO SIBLING IS NULL?
              new RUN((rw) => rw.writeVariable('sibling', getSibling(rw.readVariable('node')))).setDescription(
                'sibling = getSibling(node)'
              ), // Get new sibling for fall-through to cases 3-6
            ],
          }),

          // Cases 3+4: Black sibling with two black children
          new LET({
            description: DESCRIBE.LET.READFROM('isBlack(sibling.left) && isBlack(sibling.right)'),
            name: 'case34',
            value: (rw) =>
              isBlack(rw.readVariable<Node>('sibling').left) && isBlack(rw.readVariable<Node>('sibling').right),
          }),

          new IF({
            description: DESCRIBE.IF.MAKE('case 3 or 4'),
            condition: (rw) => rw.readVariable('case34'),
            body: [
              new RUN((rw) => (rw.readVariable<Node>('sibling').color = RED)),

              // Case 3: Black sibling with two black children + red parent
              new LET({
                description: DESCRIBE.LET.READFROM('node.parent.color === RED'),
                name: 'nodeParentColorRed',
                value: (rw) => rw.readVariable<Node>('node').parent.color === RED,
              }),

              new IF({
                description: DESCRIBE.IF.MAKE('nodeParentColorRed'),
                condition: (rw) => rw.readVariable('nodeParentColorRed'),
                body: [
                  new RUN((rw) => (rw.readVariable<Node>('node').parent.color = BLACK)).setDescription(
                    'node.parent.color = BLACK;'
                  ),
                ],
              }),

              // Case 4: Black sibling with two black children + black parent
              new IF({
                description: DESCRIBE.IF.MAKE('!nodeParentColorRed'),
                condition: (rw) => !rw.readVariable('nodeParentColorRed'),
                body: [
                  // Recursive call
                  new CALL({
                    methodName: 'fixRedBlackPropertiesAfterDelete',
                    arguments: (rw) => {
                      const map = new Map<string, Node>();
                      map.set('node', rw.readVariable<Node>('node').parent);
                      return map;
                    },
                  }),
                ],
              }),
            ],
          }),

          new IF({
            description: 'else',
            condition: (rw) => !rw.readVariable('case34'),
            body: [
              new CALL({
                methodName: 'handleBlackSiblingWithAtLeastOneRedChild',
                arguments: (rw) => {
                  const map = new Map<string, Node>();
                  map.set('node', rw.readVariable('node'));
                  map.set('sibling', rw.readVariable('sibling'));
                  return map;
                },
              }),
            ],
          }),
        ],
      }),

      new Method({
        name: 'handleBlackSiblingWithAtLeastOneRedChild',
        argNames: ['node', 'siblings'],
        instructions: [
          new LET({
            description: DESCRIBE.LET.READFROM('node === node.parent.left'),
            name: 'nodeIsLeftChild',
            value: (rw) => {
              const node = rw.readVariable<Node>('node');
              return node === node.parent.left;
            },
          }),

          // Case 5: Black sibling with at least one red child + "outer nephew" is black
          // --> Recolor sibling and its child, and rotate around sibling
          new LET({
            description: DESCRIBE.LET.READFROM('nodeIsLeftChild && isBlack(sibling.right)'),
            name: 'nodeIsLeftAndSiblingRightIsBlack',
            value: (rw) => rw.readVariable('nodeIsLeftChild') && isBlack(rw.readVariable<Node>('sibling').right),
          }),

          // Case 5: Black sibling with at least one red child + "outer nephew" is black
          // --> Recolor sibling and its child, and rotate around sibling
          new IF({
            description: 'nodeIsLeftChild && isBlack(sibling.right)',
            condition: (rw) => rw.readVariable('nodeIsLeftAndSiblingRightIsBlack'),
            body: [
              new RUN((rw) => (rw.readVariable<Node>('sibling').left.color = BLACK)).setDescription(
                'sibling.left.color = BLACK'
              ),
              new RUN((rw) => (rw.readVariable<Node>('sibling').color = RED)).setDescription('sibling.color = RED'),
              new RUN((rw) => rotateRight(rw.readVariable('sibling'))).setDescription('rotateRight(sibling)'),
              new RUN((rw) => rw.writeVariable('sibling', rw.readVariable<Node>('node').parent.right)).setDescription(
                'sibling = node.parent.right'
              ),
            ],
          }),
          // Actually an else if
          new IF({
            description: DESCRIBE.IF.MAKE('!nodeIsLeftChild && this.isBlack(sibling.left)'),
            condition: (rw) => !rw.readVariable('nodeIsLeftChild') && isBlack(rw.readVariable<Node>('sibling').left),
            body: [
              new RUN((rw) => (rw.readVariable<Node>('sibling').right.color = BLACK)).setDescription(
                'sibling.right.color = BLACK'
              ),
              new RUN((rw) => (rw.readVariable<Node>('sibling').color = RED)).setDescription('sibling.color = RED'),
              new RUN((rw) => rotateLeft(rw.readVariable('sibling'))).setDescription('rotateLeft(sibling)'),
              new RUN((rw) => rw.writeVariable('sibling', rw.readVariable<Node>('node').parent.left)).setDescription(
                'sibling = node.parent.left'
              ),
            ],
          }),

          // Fall-through to case 6...

          // Case 6: Black sibling with at least one red child + "outer nephew" is red
          // --> Recolor sibling + parent + sibling's child, and rotate around parent
          new RUN(
            (rw) => (rw.readVariable<Node>('sibling').color = rw.readVariable<Node>('node').parent.color)
          ).setDescription('sibling.color = node.parent.color'),
          new RUN((rw) => (rw.readVariable<Node>('node').parent.color = BLACK)).setDescription(
            'node.parent.color = BLACK'
          ),
          new IF({
            description: DESCRIBE.IF.MAKE('nodeIsLeftChild'),
            condition: (rw) => rw.readVariable('nodeIsLeftChild'),
            body: [
              new RUN((rw) => (rw.readVariable<Node>('sibling').right.color = BLACK)),
              new RUN((rw) => rotateLeft(rw.readVariable<Node>('node').parent)),
            ],
          }),

          // Actually the else for above statement
          new IF({
            description: DESCRIBE.IF.MAKE('!nodeIsLeftChild'),
            condition: (rw) => !rw.readVariable('nodeIsLeftChild'),
            body: [
              new RUN((rw) => (rw.readVariable<Node>('sibling').left.color = BLACK)),
              new RUN((rw) => rotateRight(rw.readVariable<Node>('node').parent)),
            ],
          }),
        ],
      }),

      new Method({
        name: 'handleRedSibling',
        argNames: ['node', 'sibling'],
        instructions: [
          // Recolor
          new RUN((rw) => (rw.readVariable<Node>('sibling').color = BLACK)).setDescription('sibling.color = BLACK'),
          new RUN((rw) => (rw.readVariable<Node>('node').parent.color = RED)),

          // AND ROTATE
          new LET({
            description: DESCRIBE.LET.READFROM('node === node.parent.left'),
            name: 'isLeftChild',
            value: (rw) => rw.readVariable('node') === rw.readVariable<Node>('node').parent.left,
          }),

          new IF({
            description: DESCRIBE.IF.MAKE('isLeftChild'),
            condition: (rw) => rw.readVariable('isLeftChild'),
            body: [new RUN((rw) => rotateLeft(rw.readVariable<Node>('node').parent))],
          }),
          new IF({
            description: DESCRIBE.IF.MAKE('!isLeftChild'),
            condition: (rw) => !rw.readVariable('isLeftChild'),
            body: [new RUN((rw) => rotateRight(rw.readVariable<Node>('node').parent))],
          }),
        ],
      }),

      new Method({
        name: 'deleteNodeWithZeroOrOneChild',
        argNames: ['node'],
        instructions: [
          new LET({
            description: DESCRIBE.LET.READFROM('!!node.left'),
            name: 'hasLeft',
            value: (rw) => !!rw.readVariable<Node>('node').left,
          }),

          new LET({
            description: DESCRIBE.LET.READFROM('!!node.right'),
            name: 'hasRight',
            value: (rw) => !!rw.readVariable<Node>('node').right,
          }),

          // Node has ONLY a left child --> replace by its left child
          new IF({
            description: DESCRIBE.IF.MAKE('!!node.left'),
            condition: (rw) => rw.readVariable('hasLeft'),
            body: [
              new RUN((rw) =>
                replaceParentsChild(
                  rw.readVariable<Node>('node').parent,
                  rw.readVariable('node'),
                  rw.readVariable<Node>('node').left
                )
              ),
              new RETURN({ returnVal: (rw) => rw.readVariable<Node>('node').left }), // moved up node
            ],
          }),

          // Node has ONLY a right child --> replace by its right child
          new IF({
            description: '!!node.right',
            condition: (rw) => rw.readVariable('hasRight'),
            body: [
              new RUN((rw) =>
                replaceParentsChild(
                  rw.readVariable<Node>('node').parent,
                  rw.readVariable('node'),
                  rw.readVariable<Node>('node').right
                )
              ),
              new RETURN({ returnVal: (rw) => rw.readVariable<Node>('node').right }), // moved up node
            ],
          }),

          // Node has no children -->
          // * node is red --> just remove it
          // * node is black --> replace it by a temporary NIL node (needed to fix the R-B rules)
          new IF({
            description: 'else',
            condition: (rw) => !rw.readVariable('hasRight') && !rw.readVariable('hasLeft'),
            body: [
              new LET({
                description: DESCRIBE.LET.READFROM('node.color === BLACK ? new NilNode() : null'),
                name: 'newChild',
                value: (rw) => (rw.readVariable<Node>('node').color === BLACK ? new NilNode(graph) : null),
              }),

              // needed to remove from mxgrapg
              new RUN((rw) => rw.readVariable<Node>('node').destroy()).setDescription('node.destroy()'),

              new RUN((rw) =>
                replaceParentsChild(
                  rw.readVariable<Node>('node').parent,
                  rw.readVariable('node'),
                  rw.readVariable('newChild')
                )
              ),
              new RETURN({ returnVal: (rw) => rw.readVariable('newChild') }),
            ],
          }),
        ],
      }),
    ],
  });

  program.setOnCreateSnapshot(() => {
    const allNodes: Node[] = [];
    if (root) {
      allNodes.push(root);
      allNodes.push(...getAllChildrenOf(root));
    }
    const dto = <TreeExport>{
      elements: allNodes.map((node) => node.data),
    };

    return dto;
  });

  program.setOnApplySnapshot((snapshot: TreeExport) => {
    return snapshot.elements.map((el) => {
      return program.getMethod('insertNode');
    });
  });

  return program;
}

function getUncle(parent: Node): Node {
  let grandparent = parent.parent;
  if (grandparent.left === parent) {
    return grandparent.right;
  } else if (grandparent.right == parent) {
    return grandparent.left;
  } else {
    throw new Error('Parent is not a child of its grandparent');
  }
}

function isBlack(node: Node): boolean {
  return !node || node.color === BLACK;
}
