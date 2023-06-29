// it looks like a linked list, and each node can have siblings and child nodes

// could sort make it faster?

// a graph?
//const nodes = require("../input/nodes.json");

function flatToTree(nodes) {
  // a hashmap to group each node by its parent id
  const groupedNodeByParentIdMap = new Map();

  // first group each node by its parent id (null it's the root nodes)
  nodes.forEach((node) => {
    if (!groupedNodeByParentIdMap.has(node.parentId))
      groupedNodeByParentIdMap.set(node.parentId, new Map());

    // (>> sibling = node)
    // each node will have its previous sibling id as key
    groupedNodeByParentIdMap
      .get(node.parentId)
      .set(node.previousSiblingId, node);
  });

  // now we have a map of nodes grouped by their parent id, I can start from root
  function constructTree(parentId = null) {
    const siblingMap = groupedNodeByParentIdMap.get(parentId);

    if (!siblingMap) return [];

    // Now, how to sort the nodes in the same level?
    // Ok.. a hashmap with previousSiblingId as key and the node as value
    // so it start from null again (<< sibling = node)

    const sortedNodes = [];
    let node = siblingMap.get(null);

    while (node) {
      sortedNodes.push({
        ...node,
        children: constructTree(node.nodeId),
      });

      node = siblingMap.get(node.nodeId);
    }

    groupedNodeByParentIdMap.delete(parentId);

    return sortedNodes;
  }

  return constructTree();
}

//console.dir(flatToTree(nodes), { depth: null });


export default flatToTree;
