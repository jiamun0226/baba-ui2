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
  const [uploadedFile, setUploadedFile] = useState(undefined); // ✅ Use state
  const [documentId, setDocumentId] = useState(undefined); // ✅ Use state
  const [selectedNodeText, setSelectedNodeText] = useState(undefined);
  const [historicalData, setHistoricalData] = useState([]);

  async function fetchData( { systemContent, userContent } ) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_INFERENCE_IP}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "messages": [
            {
              "role": "system",
              "content": systemContent
            },
              {
              "role": "user",
              "content": userContent
            }
          ],
          "document_id": documentId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  function processChatData(chatResponse) {
    const htmlResponse = chatResponse.section.map(section => {
      const subheadersHtml = section.subheader.map(sub => {
        return `
          <div class="subheader">
            <h2>${sub.title}</h2>
            <p>${sub.description}</p>
            <p><strong>Sources:</strong> ${sub.sources.join(', ')}</p>
          </div>
        `;
      }).join('');

      return `<div class="chat-response"><h1>${section.header}</h1>${subheadersHtml}</div>`;
    });

    return {htmlResponse, historicalResponse: htmlResponse}
  }

  const handleQuestionSubmit = async (parentId, userContent) => {
    console.log('Question submitted:', userContent);

    let systemContent = historicalData[parentId]
    if (parentId == '2') {
      systemContent = ''
    }

    // const chatResponse = await fetchData(systemContent, userContent)
    // console.log(chatResponse)
    const chatResponse = { section : [
        {
            "header": "What is the definition of a vector?",
            "subheader": [
                {
                    "title": "Definition",
                    "description": "A vector is a mathematical object that has both magnitude and direction. It is represented by an arrow with a length and a direction.",
                    "sources": [1, 2, 3]
                },
                {
                    "title": "Example",
                    "description": "A vector can be represented as an arrow with length 3 and direction pointing to the right.",
                    "sources": [4, 5]
                }
            ]
        },
        {
            "header": "What is the definition of a vector?",
            "subheader": [
                {
                    "title": "Definition",
                    "description": "A vector is a mathematical object that has both magnitude and direction. It is represented by an arrow with a length and a direction.",
                    "sources": [1, 2, 3]
                },
                {
                    "title": "Example",
                    "description": "A vector can be represented as an arrow with length 3 and direction pointing to the right.",
                    "sources": [4, 5]
                }
            ]
        }
        
    ]}
    const {htmlResponse, historicalResponse} = await processChatData(chatResponse)
    const responses = htmlResponse
    // const responses = [
    //   `Answer 1 to "${userContent}"`,
    //   `Answer 2 to "${userContent}"`,
    //   `Answer 3 to "${userContent}"`,
    // ];

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

  const onNodeClick = useCallback((event, node) => {
    if (node.type === 'editableInputNode' && node.id != '2') {
      setSelectedNodeText(node.data.text);
    }
  }, []);

  const handleUploadSuccess = async ({ossUrl, documentId}) => {
    setUploadedFile(ossUrl); 
    setDocumentId(documentId);
    console.log('this is doc id',documentId)

    const newId = '2';
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: 'editableInputNode',
        position: { x: 100, y: 300 },
        data: {
          text: '<p>Ask me some questions regarding the uploaded documents!</p>',
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


  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {(() => {
        const visiblePanels = [
          uploadedFile ? 'document' : null,
          'flow',
          selectedNodeText ? 'text' : null
        ].filter(Boolean);

        const panelCount = visiblePanels.length;
        const panelWidth = `${100 / panelCount}%`;

        return (
          <>
            {uploadedFile && (
              <div style={{ width: panelWidth, height: '100%', padding: '1rem' }}>
                <DocumentViewer queryParams="h1-N1" url={uploadedFile} />
              </div>
            )}

            <div style={{ width: panelWidth, height: '100%' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
              />
            </div>

            {selectedNodeText && (
              <div style={{ width: panelWidth, height: '100%', padding: '1rem', overflowY: 'auto' }}>
                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}
                  dangerouslySetInnerHTML={{ __html: selectedNodeText }}>
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
