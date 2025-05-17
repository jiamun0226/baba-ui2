"use client";

import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FileUploadNode from './FileUploadNode';
import EditableInputNode from './EditableInputNode';
import { DocumentViewer } from "react-documents";

const nodeTypes = {
  fileUploadNode: FileUploadNode,
  editableInputNode: EditableInputNode,
};

export default function App() {
  const [uploadedFile, setUploadedFile] = useState(null); // ✅ Use state

  const handleQuestionSubmit = (parentId, inputValue) => {
    console.log('Question submitted:', inputValue);

    // Simulate responses from API
    const responses = [
      `Answer 1 to "${inputValue}"`,
      `Answer 2 to "${inputValue}"`,
      `Answer 3 to "${inputValue}"`,
    ];

    setTargetPage(targetPage+=1);

    const baseX = nodes.find((n) => n.id === parentId)?.position?.x || 100;
    const baseY = nodes.find((n) => n.id === parentId)?.position?.y || 100;

    const newNodes = responses.map((text, index) => {
      const id = `${parentId}-child-${index}`;
      return {
        id,
        type: 'editableInputNode',
        position: { x: baseX + 200, y: baseY + index * 150 },
        data: {
          text,
          initialValue: '',
          placeholder: 'Type follow-up...',
          onEnter: (val) => handleQuestionSubmit(id, val),
        },
      };
    });

    const newEdges = newNodes.map((n) => ({
      id: `e-${parentId}-${n.id}`,
      source: parentId,
      target: n.id,
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
  };

  const handleUploadSuccess = async (url) => {
    setUploadedFile(url); 

    const newId = '2';
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: 'editableInputNode',
        position: { x: 100, y: 300 },
        data: {
          text: 'Ask me some questions regarding the uploaded documents!',
          initialValue: '',
          placeholder: 'Type here...',
          onEnter: (val) => handleQuestionSubmit(newId, val)
        },
      },
    ]);

    setEdges((eds) => [...eds, { id: `e-1-${newId}`, source: '1', target: newId }]);
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: '1',
      type: 'fileUploadNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Upload File',
        onUploadSuccess: handleUploadSuccess,
      },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  const [targetPage, setTargetPage] = useState(5);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {uploadedFile && (
        <div style={{ width: '50%', height: '100%' }}>
          <DocumentViewer queryParams="#page=5" url={uploadedFile} />
        </div>
      )}
      <div style={{ flex: 1 }}>
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
    </div>
  );
}
