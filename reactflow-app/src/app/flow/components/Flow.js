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
  const [uploadedFile, setUploadedFile] = useState(undefined); 
  const [isLoading, setIsLoading] = useState(false);
  let documentIdGlobal = null;
  const [selectedNodeText, setSelectedNodeText] = useState(undefined);
  let historicalData = {};
  let nodes2 = []

  async function fetchData( { systemContent, userContent} ) {
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
          "document_id": documentIdGlobal
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

    return {htmlResponse}
  }

  function mergeObjectToString(obj) {
    if (!obj) return '';

    let result = `Header is ${obj.header}.`;

    if (Array.isArray(obj.subheader)) {
      obj.subheader.forEach((item, index) => {
        const num = index + 1;
        result += ` SubHeader ${num} is ${item.title}. Description ${num} is ${item.description}.`;
      });
    }
    return result;
  }

  const handleQuestionSubmit = async (parentId, userContent) => {
    let systemContent;
    if (parentId == '2') {
      systemContent = ''
    }else{
      systemContent = historicalData[parentId]
    }

    setIsLoading(true)

    const chatResponse = await fetchData({systemContent, userContent})
    console.log(chatResponse)

    // const chatResponse = { section : [
    //     {
    //         "header": "What is the definition of a vector?",
    //         "subheader": [
    //             {
    //                 "title": "Definition",
    //                 "description": "A vector is a mathematical object that has both magnitude and direction. It is represented by an arrow with a length and a direction.",
    //                 "sources": [1, 2, 3]
    //             },
    //             {
    //                 "title": "Example",
    //                 "description": "A vector can be represented as an arrow with length 3 and direction pointing to the right.",
    //                 "sources": [4, 5]
    //             }
    //         ]
    //     },
    //     {
    //         "header": "What is the definition of a vector?",
    //         "subheader": [
    //             {
    //                 "title": "Definition",
    //                 "description": "A vector is a mathematical object that has both magnitude and direction. It is represented by an arrow with a length and a direction.",
    //                 "sources": [1, 2, 3]
    //             },
    //             {
    //                 "title": "Example",
    //                 "description": "A vector can be represented as an arrow with length 3 and direction pointing to the right.",
    //                 "sources": [4, 5]
    //             }
    //         ]
    //     }
        
    // ]}
    const {htmlResponse: responses } = await processChatData(chatResponse)

    setIsLoading(false)

    const baseX = nodes2.find((n) => n.id === parentId)?.position?.x || 100;
    const baseY = nodes2.find((n) => n.id === parentId)?.position?.y || 100;

    const mergedStringList = chatResponse.section.map((object, index)=>{
      return mergeObjectToString(object);
    })

    const newNodes = responses.map((text, index) => {
      const id = `${parentId}-${index}`;
      historicalData[id] = mergedStringList[index]
      return {
        id,
        type: 'editableInputNode',
        position: { x: baseX + index * 350 , y: baseY + 350 },
        data: {
          text,
          initialValue: '',
          placeholder: 'More questions...',
          onEnter: (val) => handleQuestionSubmit(id, val),
        },
      };
    });

    nodes2 = [...nodes2, ...newNodes]

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
    documentIdGlobal = documentId

    const newId = '2';
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: 'editableInputNode',
        position: { x: 100, y: 300 },
        data: {
          text: '<h3>Ask me some questions regarding the uploaded documents!</h3>',
          initialValue: '',
          placeholder: 'Type your question here...',
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

  nodes2.push({
      id: '1',
      type: 'fileUploadNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Upload File',
        onUploadSuccess: handleUploadSuccess,
      }
    });

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
                fitViewOptions={{maxZoom: 1.5}}
              />
            </div>

            {selectedNodeText && (
              <div style={{ width: panelWidth, height: '100%', padding: '1rem', overflowY: 'auto', position: 'relative' }}>
                {/* Close Button */}
                <button
                  onClick={() => setSelectedNodeText(null)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'transparent',
                    border: 'none',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '20px',
                    lineHeight: '32px',
                    textAlign: 'center',
                  }}
                  title="Close"
                >
                  x
                </button>

                <div
                  style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    borderRadius: '8px',
                    height: '100%',
                    overflowY: 'auto',
                    paddingRight: '0.5rem',
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedNodeText }}
                />
              </div>
            )}

            {isLoading && (
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999
              }}>
                <div className="spinner" />
              </div>
            )}

          </>
        );
      })()}
    </div>
  );
}
