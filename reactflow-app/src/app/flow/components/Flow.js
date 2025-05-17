"use client"

import React, { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FileUploadNode from './FileUploadNode'; // 👈 Import custom node

const nodeTypes = {
  fileUploadNode: FileUploadNode,
};

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: '1',
      type: 'fileUploadNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Upload Image',
        onFileSelect: (file) => console.log('Uploaded file:', file.name),
      },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      />
    </div>
  );
}
