import { NilNode, Node } from './node';
import { BLACK, RED } from './color';
import { CellHighlight, CellOverlay, Geometry, Graph } from '@maxgraph/core';

export class RedBlackTree {
  private cellHhighlight: CellHighlight;
  protected root: Node;

  private highlight(node: Node): void {
    if (this.cellHhighlight) {
      this.cellHhighlight.destroy();
    }
    if (!node) {
      return;
    }
    this.cellHhighlight = new CellHighlight(this.graph, 'green', 3, false);
    const state = this.graph.getView().getState(node.mxNode);
    this.cellHhighlight.highlight(state);
  }

  public constructor(private readonly graph: Graph) {}

  public getRoot(): Node {
    return this.root;
  }
  // --------------------- SEARCH -----------------------
  public searchNode(key: number): Node {
    let node = this.root;
    while (node) {
      // this.highlight(node);
      if (key === node.data) {
        return node;
      } else if (key < node.data) {
        node = node.left;
      } else {
        node = node.right;
      }
    }
    return null;
  }

  // ------------------------ INSERTION -----------------------

  insertNode(key: number): void {
    let node = this.root;
    let parent: Node = null;
    // Traverse the tree to the left or right depending on the key
    while (node) {
      parent = node;

      if (key < node.data) {
        node = node.left;
      } else if (key > node.data) {
        node = node.right;
      } else {
        return;
        throw new Error('Tree already contains a node with key: ' + key);
      }
    }

    // insert the node
    const newNode = new Node(key, this.graph);
    newNode.color = RED;
    if (!parent) {
      this.root = newNode;
    } else if (key < parent.data) {
      parent.left = newNode;
    } else {
      parent.right = newNode;
    }
    newNode.parent = parent;

    this.organizeGeometry();
    this.fixRedBlackPropertiesAfterInsert(newNode);
    this.organizeGeometry();
  }

  // --------------------------- DELETION ------------------------------
  public deleteNode(key: number): void {
    let node = this.root;

    // Find the node to be deleted
    while (node && node.data !== key) {
      // Traverse the tree to the left or right depending on the key
      if (key < node.data) {
        node = node.left;
      } else {
        node = node.right;
      }
    }

    // Node not found?
    if (!node) {
      return;
    }

    // At this point, "node" is the node to be deleted

    // In this variable, we'll store the node at which we're going to start to fix the R-B
    // properties after deleting a node.
    let movedUpNode: Node;
    let deletedNodeColor: boolean;

    // Node has zero or one child
    if (!node.left || !node.right) {
      movedUpNode = this.deleteNodeWithZeroOrOneChild(node);
      deletedNodeColor = node.color;
    }

    // Node has two children
    else {
      // Find minimum node of right subtree ("inorder successor" of current node)
      let inOrderSuccessor = this.findMinimum(node.right);

      // Copy inorder successor's data to current node (keep its color!)
      node.data = inOrderSuccessor.data;

      // Delete inorder successor just as we would delete a node with 0 or 1 child
      movedUpNode = this.deleteNodeWithZeroOrOneChild(inOrderSuccessor);
      deletedNodeColor = inOrderSuccessor.color;
    }

    if (deletedNodeColor === BLACK) {
      this.fixRedBlackPropertiesAfterDelete(movedUpNode);

      // Remove the temporary NIL node
      if (movedUpNode instanceof NilNode) {
        this.replaceParentsChild(movedUpNode.parent, movedUpNode, null);
      }
    }
  }
  private deleteNodeWithZeroOrOneChild(node: Node): Node {
    // Node has ONLY a left child --> replace by its left child
    if (!!node.left) {
      this.replaceParentsChild(node.parent, node, node.left);
      return node.left; // moved-up node
    }

    // Node has ONLY a right child --> replace by its right child
    else if (!!node.right) {
      this.replaceParentsChild(node.parent, node, node.right);
      return node.right; // moved-up node
    }

    // Node has no children -->
    // * node is red --> just remove it
    // * node is black --> replace it by a temporary NIL node (needed to fix the R-B rules)
    else {
      let newChild = node.color === BLACK ? new NilNode(this.graph) : null;
      // needed to remove from mxgrapg
      // node.destroy();
      this.replaceParentsChild(node.parent, node, newChild);
      return newChild;
    }
  }
  private findMinimum(node: Node): Node {
    while (!!node.left) {
      node = node.left;
    }
    return node;
  }
  private fixRedBlackPropertiesAfterDelete(node: Node): void {
    // Case 1: Examined node is root, end of recursion
    if (node == this.root) {
      // Uncomment the following line if you want to enforce black roots (rule 2):
      node.color = BLACK;
      return;
    }

    let sibling = this.getSibling(node);

    // Case 2: Red sibling
    if (sibling.color === RED) {
      this.handleRedSibling(node, sibling);
      sibling = this.getSibling(node); // Get new sibling for fall-through to cases 3-6
    }

    // Cases 3+4: Black sibling with two black children
    if (this.isBlack(sibling.left) && this.isBlack(sibling.right)) {
      sibling.color = RED;

      // Case 3: Black sibling with two black children + red parent
      if (node.parent.color === RED) {
        node.parent.color = BLACK;
      }

      // Case 4: Black sibling with two black children + black parent
      else {
        this.fixRedBlackPropertiesAfterDelete(node.parent);
      }
    }

    // Case 5+6: Black sibling with at least one red child
    else {
      this.handleBlackSiblingWithAtLeastOneRedChild(node, sibling);
    }
  }
  private handleRedSibling(node: Node, sibling: Node) {
    // Recolor...
    sibling.color = BLACK;
    node.parent.color = RED;

    // ... and rotate
    if (node == node.parent.left) {
      this.rotateLeft(node.parent);
    } else {
      this.rotateRight(node.parent);
    }
  }

  private getSibling(node: Node): Node {
    const parent = node.parent;
    if (node === parent.left) {
      return parent.right;
    } else if (node === parent.right) {
      return parent.left;
    } else {
      throw new Error('Parent is not a child of its grandparent');
    }
  }

  private handleBlackSiblingWithAtLeastOneRedChild(node: Node, sibling: Node) {
    const nodeIsLeftChild = node === node.parent.left;

    // Case 5: Black sibling with at least one red child + "outer nephew" is black
    // --> Recolor sibling and its child, and rotate around sibling
    if (nodeIsLeftChild && this.isBlack(sibling.right)) {
      sibling.left.color = BLACK;
      sibling.color = RED;
      this.rotateRight(sibling);
      sibling = node.parent.right;
    } else if (!nodeIsLeftChild && this.isBlack(sibling.left)) {
      sibling.right.color = BLACK;
      sibling.color = RED;
      this.rotateLeft(sibling);
      sibling = node.parent.left;
    }

    // Fall-through to case 6...

    // Case 6: Black sibling with at least one red child + "outer nephew" is red
    // --> Recolor sibling + parent + sibling's child, and rotate around parent
    sibling.color = node.parent.color;
    node.parent.color = BLACK;
    if (nodeIsLeftChild) {
      sibling.right.color = BLACK;
      this.rotateLeft(node.parent);
    } else {
      sibling.left.color = BLACK;
      this.rotateRight(node.parent);
    }
  }

  private isBlack(node: Node): boolean {
    return !node || node.color === BLACK;
  }
  // ------------------------------ HELPERS ------------------------------

  fixRedBlackPropertiesAfterInsert(node: Node): void {
    let parent = node.parent;
    // Case 1: Parent is null, we've reached the root, the end of the recursion
    if (parent === null) {
      // Uncomment the following line if you want to enforce black roots (rule 2):
      node.color = BLACK;
      return;
    }

    // Parent is black --> nothing to do
    if (parent.color === BLACK) {
      return;
    }

    // From here on, parent is red
    let grandparent = parent.parent;

    // Case 2:
    // Not having a grandparent means that parent is the root. If we enforce black roots
    // (rule 2), grandparent will never be null, and the following if-then block can be
    // removed.
    /*if (!grandparent) {
      // As this method is only called on red nodes (either on newly inserted ones - or -
      // recursively on red grandparents), all we have to do is to recolor the root black.
      parent.color = BLACK;
      return;
    }*/

    // Get the uncle (may be null/nil, in which case its color is BLACK)
    let uncle = this.getUncle(parent);

    // Case 3: Uncle is red -> recolor parent, grandparent and uncle
    if (!!uncle && uncle.color === RED) {
      parent.color = BLACK;
      grandparent.color = RED;
      uncle.color = BLACK;

      // Call recursively for grandparent, which is now red.
      // It might be root or have a red parent, in which case we need to fix more...
      this.fixRedBlackPropertiesAfterInsert(grandparent);
    }

    // Note on performance:
    // It would be faster to do the uncle color check within the following code. This way
    // we would avoid checking the grandparent-parent direction twice (once in getUncle()
    // and once in the following else-if). But for better understanding of the code,
    // I left the uncle color check as a separate step.

    // Parent is left child of grandparent
    else if (parent === grandparent.left) {
      // Case 4a: Uncle is black and node is left->right "inner child" of its grandparent
      if (node === parent.right) {
        this.rotateLeft(parent);

        // Let "parent" point to the new root node of the rotated sub-tree.
        // It will be recolored in the next step, which we're going to fall-through to.
        parent = node;
      }

      // Case 5a: Uncle is black and node is left->left "outer child" of its grandparent
      this.rotateRight(grandparent);

      // Recolor original parent and grandparent
      parent.color = BLACK;
      grandparent.color = RED;
    }

    // Parent is right child of grandparent
    else {
      // Case 4b: Uncle is black and node is right->left "inner child" of its grandparent
      if (node === parent.left) {
        this.rotateRight(parent);

        // Let "parent" point to the new root node of the rotated sub-tree.
        // It will be recolored in the next step, which we're going to fall-through to.
        parent = node;
      }

      // Case 5b: Uncle is black and node is right->right "outer child" of its grandparent
      this.rotateLeft(grandparent);

      // Recolor original parent and grandparent
      parent.color = BLACK;
      grandparent.color = RED;
    }
  }
  private getUncle(parent: Node): Node {
    let grandparent = parent.parent;
    if (grandparent.left === parent) {
      return grandparent.right;
    } else if (grandparent.right == parent) {
      return grandparent.left;
    } else {
      throw new Error('Parent is not a child of its grandparent');
    }
  }

  private rotateRight(node: Node): void {
    let parent = node.parent;
    let leftChild = node.left;

    node.left = leftChild.right;
    if (!!leftChild.right) {
      leftChild.right.parent = node;
    }

    leftChild.right = node;
    node.parent = leftChild;

    this.replaceParentsChild(parent, node, leftChild);
  }

  private rotateLeft(node: Node): void {
    let parent = node.parent;
    let rightChild = node.right;

    node.right = rightChild.left;
    if (!!rightChild.left) {
      rightChild.left.parent = node;
    }

    rightChild.left = node;
    node.parent = rightChild;

    this.replaceParentsChild(parent, node, rightChild);
  }

  private replaceParentsChild(parent: Node, oldChild: Node, newChild: Node): void {
    if (parent === null) {
      this.root = newChild;
    } else if (parent.left === oldChild) {
      // oldChild.destroy();
      parent.left = newChild;
    } else if (parent.right === oldChild) {
      // oldChild.destroy();
      parent.right = newChild;
    } else {
      throw new Error('Node is not a child of its parent');
    }

    if (!!newChild) {
      newChild.parent = parent;
    }
  }

  public printTree(): void {
    this.root.printNode();
  }

  public organizeGeometry(): void {
    this.organizeGeometryNode(this.root, 0, 1000);
  }

  private organizeGeometryNode(node: Node, layer: number, center: number): void {
    if (!node) {
      return;
    }

    node.mxNode.setGeometry(new Geometry(center, layer * 100 + 50, 40, 40));

    this.graph.refresh(node.mxNode);
    node.mxNode.getIncomingEdges().forEach((e) => this.graph.refresh(e));
    node.mxNode.getOutgoingEdges().forEach((e) => this.graph.refresh(e));
    const heightDependentOffset = 2 / (layer + 1);
    const leftCenter = center - 100 * heightDependentOffset;
    const rightCenter = center + 100 * heightDependentOffset;
    this.organizeGeometryNode(node?.left, layer + 1, leftCenter);
    this.organizeGeometryNode(node?.right, layer + 1, rightCenter);
  }
}
