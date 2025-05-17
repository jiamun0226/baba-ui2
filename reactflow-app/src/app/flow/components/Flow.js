"use client";

import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import FileUploadNode from "./FileUploadNode";
import EditableInputNode from "./EditableInputNode";
import { Document, Page, pdfjs } from "react-pdf";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

const nodeTypes = {
  fileUploadNode: FileUploadNode,
  editableInputNode: EditableInputNode,
};

export default function App() {
  const [uploadedFile, setUploadedFile] = useState(undefined);
  const [showQuizPanel, setShowQuizPanel] = useState(false);
  const [pageNumber, setPageNumber] = useState(10);
  const [numPages, setNumPages] = useState();

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }
  React.useEffect(() => {
    window.setPageNumber = (page) => {
      setPageNumber(page);
    };

    // Cleanup function to remove the global reference when component unmounts
    return () => {
      delete window.setPageNumber;
    };
  }, []); // Empty dependency array since we only need to set this up once

  const [showFlashcardPanel, setShowFlashcardPanel] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [isFlashcardLoading, setIsFlashcardLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [flashcardData, setFlashcardData] = useState(null);
  let documentIdGlobal = null;
  const [selectedNodeText, setSelectedNodeText] = useState(undefined);
  let historicalData = {};
  async function fetchData({ systemContent, userContent }) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_INFERENCE_IP}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: systemContent,
              },
              {
                role: "user",
                content: userContent,
              },
            ],
            document_id: documentIdGlobal,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  function processChatData(chatResponse) {
    const htmlResponse = chatResponse.section.map((section) => {
      const subheadersHtml = section.subheader
        .map((sub) => {
          return `
          <div class="subheader">
            <h2>${sub.title}</h2>
            <p>${sub.description}</p>
            <p><strong>Sources:</strong> ${sub.sources
              .map(
                (source) =>
                  `<span 
                style="cursor: pointer; color: #007AFF; margin: 0 4px; text-decoration: underline" 
                onclick="window.setPageNumber(${source})"
              >${source}</span>`
              )
              .join("")}</p>
          </div>
        `;
        })
        .join("");

      return `<div class="chat-response"><h1>${section.header}</h1>${subheadersHtml}</div>`;
    });

    return { htmlResponse };
  }

  function mergeObjectToString(obj) {
    if (!obj) return "";

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
    if (parentId == "2") {
      systemContent = "";
    } else {
      systemContent = historicalData[parentId];
    }

    // const chatResponse = await fetchData({systemContent, userContent})
    // console.log(chatResponse)
    const chatResponse = {
      section: [
        {
          header: "What is the definition of a vector?",
          subheader: [
            {
              title: "Definition",
              description:
                "A vector is a mathematical object that has both magnitude and direction. It is represented by an arrow with a length and a direction.",
              sources: [1, 2, 3],
            },
            {
              title: "Example",
              description:
                "A vector can be represented as an arrow with length 3 and direction pointing to the right.",
              sources: [4, 5],
            },
          ],
        },
        {
          header: "What is the definition of a vector?",
          subheader: [
            {
              title: "Definition",
              description:
                "A vector is a mathematical object that has both magnitude and direction. It is represented by an arrow with a length and a direction.",
              sources: [1, 2, 3],
            },
            {
              title: "Example",
              description:
                "A vector can be represented as an arrow with length 3 and direction pointing to the right.",
              sources: [4, 5],
            },
          ],
        },
      ],
    };
    const { htmlResponse: responses } = await processChatData(chatResponse);

    console.log("this is nodes", nodes2);
    const baseX = nodes2.find((n) => n.id === parentId)?.position?.x || 100;
    const baseY = nodes2.find((n) => n.id === parentId)?.position?.y || 100;

    console.log("baseX, baseY", baseX, baseY);

    const mergedStringList = chatResponse.section.map((object, index) => {
      return mergeObjectToString(object);
    });

    const newNodes = responses.map((text, index) => {
      const id = `${parentId}-${index}`;
      historicalData[id] = mergedStringList[index];
      return {
        id,
        type: "editableInputNode",
        position: { x: baseX + 200, y: baseY + index * 150 },
        data: {
          text,
          initialValue: "",
          placeholder: "More questions...",
          onEnter: (val) => handleQuestionSubmit(id, val),
        },
      };
    });

    nodes2 = [...nodes2, ...newNodes];

    const newEdges = newNodes.map((n) => ({
      id: `e-${parentId}-${n.id}`,
      source: parentId,
      target: n.id,
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
  };

  const onNodeClick = useCallback((event, node) => {
    if (node.type === "editableInputNode" && node.id != "2") {
      setSelectedNodeText(node.data.text);
    }
  }, []);

  const handleUploadSuccess = async ({ ossUrl, documentId }) => {
    setUploadedFile(ossUrl);
    documentIdGlobal = documentId;

    const newId = "2";
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: "editableInputNode",
        position: { x: 100, y: 300 },
        data: {
          text: "<h3>Ask me some questions regarding the uploaded documents!</h3>",
          initialValue: "",
          placeholder: "Type your question here...",
          onEnter: (val) => handleQuestionSubmit(newId, val),
        },
      },
    ]);

    setEdges((eds) => [
      ...eds,
      { id: `e-1-${newId}`, source: "1", target: newId },
    ]);
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "1",
      type: "fileUploadNode",
      position: { x: 100, y: 100 },
      data: {
        label: "Upload File",
        onUploadSuccess: handleUploadSuccess,
      },
    },
  ]);

  let nodes2 = [
    {
      id: "1",
      type: "fileUploadNode",
      position: { x: 100, y: 100 },
      data: {
        label: "Upload File",
        onUploadSuccess: handleUploadSuccess,
      },
    },
  ];

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const fetchQuizzes = async () => {
    setIsQuizLoading(true);
    try {
      // Simulate API call with 10s delay
      await new Promise((resolve) => setTimeout(resolve, 10000));
      // Replace with actual API call
      setQuizData({
        quizzes: [
          { id: 1, title: "Sample Quiz 1" },
          { id: 2, title: "Sample Quiz 2" },
        ],
      });
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
    setIsQuizLoading(false);
  };

  const fetchFlashcards = async () => {
    setIsFlashcardLoading(true);
    try {
      // Simulate API call with 10s delay
      await new Promise((resolve) => setTimeout(resolve, 10000));
      // Replace with actual API call
      setFlashcardData({
        flashcards: [
          { id: 1, front: "Question 1", back: "Answer 1" },
          { id: 2, front: "Question 2", back: "Answer 2" },
        ],
      });
    } catch (error) {
      console.error("Error fetching flashcards:", error);
    }
    setIsFlashcardLoading(false);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        position: "relative",
        backgroundColor: "white",
      }}>
      {(() => {
        const visiblePanels = [
          uploadedFile ? "document" : null,
          "flow",
          selectedNodeText ? "text" : null,
        ].filter(Boolean);

        const panelCount = visiblePanels.length;
        const panelWidth = `${100 / panelCount}%`;

        return (
          <>
            {uploadedFile && (
              <div
                height="100%"
                width={panelWidth}
                style={{
                  alignSelf: "center",
                  position: "relative",
                }}>
                <Document
                  file={uploadedFile}
                  onLoadSuccess={onDocumentLoadSuccess}>
                  <Page pageNumber={pageNumber} />
                </Document>
                <div
                  style={{
                    zIndex: 10,
                    position: "absolute",
                    bottom: "0px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    background: "rgba(255, 255, 255, 0.9)",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}>
                  <button
                    onClick={() =>
                      setPageNumber(pageNumber > 1 ? pageNumber - 1 : 1)
                    }
                    disabled={pageNumber <= 1}
                    style={{
                      border: "none",
                      background: pageNumber <= 1 ? "#E5E5EA" : "#F5F5F7",
                      color: pageNumber <= 1 ? "#8E8E93" : "#1C1C1E",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      cursor: pageNumber <= 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s",
                    }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M15 18L9 12L15 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#1C1C1E",
                    }}>
                    {pageNumber} / {numPages}
                  </span>
                  <button
                    onClick={() =>
                      setPageNumber(
                        pageNumber < numPages ? pageNumber + 1 : numPages
                      )
                    }
                    disabled={pageNumber >= numPages}
                    style={{
                      border: "none",
                      background:
                        pageNumber >= numPages ? "#E5E5EA" : "#F5F5F7",
                      color: pageNumber >= numPages ? "#8E8E93" : "#1C1C1E",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      cursor:
                        pageNumber >= numPages ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s",
                    }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9 18L15 12L9 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div style={{ width: panelWidth }}>
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
              <div
                style={{
                  width: panelWidth,
                  height: "100%",
                  padding: "1rem",
                  overflowY: "auto",
                }}>
                <div
                  style={{
                    background: "#f9fafb",
                    padding: "1rem",
                    borderRadius: "8px",
                    height: "100%",
                    overflow: "hidden",
                    overflowY: "auto",
                    paddingRight: "0.5rem",
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedNodeText }}></div>
              </div>
            )}

            {/* Floating Buttons */}
            <div
              style={{
                position: "fixed",
                left: "20px",
                top: "20px",
                display: "flex",
                gap: "12px",
                zIndex: 1000,
              }}>
              <button
                onClick={() => {
                  setShowQuizPanel(true);
                  fetchQuizzes();
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#F5F5F7",
                  color: "#1C1C1E",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                  fontWeight: "500",
                  ":hover": {
                    background: "#E5E5EA",
                  },
                }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 17H12.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Quizzes
              </button>
              <button
                onClick={() => {
                  setShowFlashcardPanel(true);
                  fetchFlashcards();
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#F5F5F7",
                  color: "#1C1C1E",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                  fontWeight: "500",
                  ":hover": {
                    background: "#E5E5EA",
                  },
                }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M1 10H23"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Flashcards
              </button>
            </div>

            {/* Quiz Panel */}
            {showQuizPanel && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.5)",
                  zIndex: 1001,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
                onClick={() => setShowQuizPanel(false)}>
                <div
                  style={{
                    width: "400px",
                    height: "100%",
                    background: "white",
                    padding: "20px",
                    boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
                    overflow: "auto",
                  }}
                  onClick={(e) => e.stopPropagation()}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}>
                    <h2 style={{ margin: 0 }}>Quizzes</h2>
                    <button
                      onClick={() => setShowQuizPanel(false)}
                      style={{
                        border: "none",
                        background: "none",
                        fontSize: "24px",
                        cursor: "pointer",
                        color: "#666",
                      }}>
                      ×
                    </button>
                  </div>
                  {isQuizLoading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      Loading quizzes...
                    </div>
                  ) : (
                    <div>
                      {quizData?.quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          style={{
                            padding: "15px",
                            borderRadius: "10px",
                            background: "#f5f5f7",
                            marginBottom: "10px",
                            cursor: "pointer",
                          }}>
                          {quiz.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Flashcard Panel */}
            {showFlashcardPanel && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.5)",
                  zIndex: 1001,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
                onClick={() => setShowFlashcardPanel(false)}>
                <div
                  style={{
                    width: "400px",
                    height: "100%",
                    background: "white",
                    padding: "20px",
                    boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
                    overflow: "auto",
                  }}
                  onClick={(e) => e.stopPropagation()}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}>
                    <h2 style={{ margin: 0 }}>Flashcards</h2>
                    <button
                      onClick={() => setShowFlashcardPanel(false)}
                      style={{
                        border: "none",
                        background: "none",
                        fontSize: "24px",
                        cursor: "pointer",
                        color: "#666",
                      }}>
                      ×
                    </button>
                  </div>
                  {isFlashcardLoading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      Loading flashcards...
                    </div>
                  ) : (
                    <div>
                      {flashcardData?.flashcards.map((card) => (
                        <div
                          key={card.id}
                          style={{
                            padding: "15px",
                            borderRadius: "10px",
                            background: "#f5f5f7",
                            marginBottom: "10px",
                            cursor: "pointer",
                          }}>
                          <div style={{ fontWeight: "bold" }}>{card.front}</div>
                          <div style={{ marginTop: "10px", color: "#666" }}>
                            {card.back}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}

// Add this useEffect to make setPageNumber available globally
