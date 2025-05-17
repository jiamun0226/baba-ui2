import dagre from 'dagre';

const nodeWidth = 200;
const nodeHeight = 80;

export const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const { x, y } = dagreGraph.node(node.id) || { x: 0, y: 0 };
    return {
      ...node,
      position: { x, y },
      // force update for ReactFlow layout (optional but useful)
      positionAbsolute: undefined,
    };
  });

  return { nodes: layoutedNodes, edges };
};
