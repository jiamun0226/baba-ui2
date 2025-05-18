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
  const [isLoading, setIsLoading] = useState(false);
  const [showQuizPanel, setShowQuizPanel] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState();
  const [showFlashcardPanel, setShowFlashcardPanel] = useState(false);

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

  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [isFlashcardLoading, setIsFlashcardLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [flashcardData, setFlashcardData] = useState(null);
  let documentIdGlobal = null;
  const [globalDocumentId, setGlobalDocumentId] = useState("");
  const [selectedNodeText, setSelectedNodeText] = useState(undefined);
  let historicalData = {};
  let nodes2 = [];

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
            document_id: "392ca15f-7a8c-4924-9601-3100489981f1",
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

  // Update the fetchQuizzes function
  const fetchQuizzes = async () => {
    setIsQuizLoading(true);
    try {
      try {
        // const response = await fetch(
        //   `${process.env.NEXT_PUBLIC_INFERENCE_IP}/generate-quiz`,
        //   {
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "application/json",
        //     },
        //     body: JSON.stringify({
        //       document_id: "392ca15f-7a8c-4924-9601-3100489981f1",
        //     }),
        //   }
        // );

        // if (!response.ok) {
        //   throw new Error(`HTTP error! status: ${response.status}`);
        // }

        // const data = await response.json();
        setQuizData([
          {
            question:
              "What is the primary function of mitochondria in eukaryotic cells?",
            wrong_answers: [
              {
                description: "To synthesize proteins for cellular functions",
              },
              {
                description:
                  "To store genetic information for cell replication",
              },
              {
                description: "To provide structural support to the cell",
              },
            ],
            correct_answer:
              "To generate energy in the form of ATP through cellular respiration",
            explanation:
              "The correct answer is that mitochondria are responsible for generating energy in the form of ATP through cellular respiration. Mitochondria are often referred to as the 'powerhouses' of the cell because they produce the energy required for various cellular processes. The wrong answers are incorrect because protein synthesis occurs in ribosomes, genetic information is stored in the nucleus, and structural support is provided by the cytoskeleton.",
            sources: {
              page_numbers: [45, 78],
              supporting_text:
                "Mitochondria play a crucial role in energy production via oxidative phosphorylation... (p.45). They are not involved in protein synthesis or structural integrity (p.78).",
            },
          },
          {
            question:
              "Which process involves the splitting of glucose into pyruvate molecules within the cytoplasm?",
            wrong_answers: [
              {
                description: "Krebs cycle",
              },
              {
                description: "Electron transport chain",
              },
              {
                description: "Beta-oxidation",
              },
            ],
            correct_answer: "Glycolysis",
            explanation:
              "Glycolysis is the correct answer because it refers to the metabolic pathway where glucose is broken down into two molecules of pyruvate in the cytoplasm. The Krebs cycle occurs in the mitochondria and involves further breakdown of acetyl-CoA. The electron transport chain involves the transfer of electrons to generate ATP but does not split glucose. Beta-oxidation refers to the breakdown of fatty acids, not glucose.",
            sources: {
              page_numbers: [62],
              supporting_text:
                "Glycolysis takes place in the cytoplasm and converts glucose into pyruvate, yielding ATP and NADH (p.62).",
            },
          },
          {
            question:
              "In the context of enzyme activity, what effect does a competitive inhibitor have on an enzyme's function?",
            wrong_answers: [
              {
                description:
                  "It binds to the allosteric site, changing the enzyme's shape",
              },
              {
                description:
                  "It permanently deactivates the enzyme by denaturing it",
              },
              {
                description:
                  "It increases the rate of reaction by stabilizing the enzyme-substrate complex",
              },
            ],
            correct_answer:
              "It competes with the substrate for binding at the active site, reducing the rate of reaction",
            explanation:
              "The correct answer is that a competitive inhibitor competes with the substrate for binding at the enzyme's active site, thereby reducing the rate of reaction. The other options are incorrect: binding to the allosteric site describes non-competitive inhibition, permanent deactivation is caused by irreversible inhibitors, and increasing the reaction rate contradicts the purpose of an inhibitor.",
            sources: {
              page_numbers: [91],
              supporting_text:
                "Competitive inhibitors reduce enzyme activity by occupying the active site, preventing substrate binding (p.91).",
            },
          },
          {
            question:
              "Which statement best describes the role of tRNA during protein synthesis?",
            wrong_answers: [
              {
                description: "tRNA synthesizes amino acids from raw materials",
              },
              {
                description:
                  "tRNA carries mRNA codons to the ribosome for translation",
              },
              {
                description:
                  "tRNA modifies the structure of ribosomes to accommodate mRNA",
              },
            ],
            correct_answer:
              "tRNA delivers specific amino acids to the ribosome based on complementary anticodon pairing with mRNA",
            explanation:
              "The correct answer is that tRNA delivers specific amino acids to the ribosome by matching its anticodon to the corresponding codon on mRNA. The wrong answers are incorrect because tRNA does not synthesize amino acids (amino acids are pre-existing), it doesn't carry mRNA codons (mRNA moves along the ribosome), and it doesn't modify ribosomes (ribosomes remain unchanged during translation).",
            sources: {
              page_numbers: [105],
              supporting_text:
                "Transfer RNA (tRNA) reads the mRNA codons via complementary base pairing and brings the appropriate amino acid to the ribosome (p.105).",
            },
          },
          {
            question:
              "What distinguishes passive transport from active transport across a cell membrane?",
            wrong_answers: [
              {
                description:
                  "Passive transport requires carrier proteins, while active transport does not",
              },
              {
                description:
                  "Passive transport moves substances against their concentration gradient, while active transport moves them down the gradient",
              },
              {
                description:
                  "Passive transport can only move small molecules, while active transport handles large ones exclusively",
              },
            ],
            correct_answer:
              "Passive transport does not require energy input, whereas active transport uses ATP to move substances against their concentration gradient",
            explanation:
              "The correct answer highlights the key distinction: passive transport occurs without energy expenditure and follows the concentration gradient, while active transport requires ATP to move substances against their gradient. The wrong answers are incorrect because carrier proteins may be used in both types of transport, movement against the gradient defines active transport, and size of molecules transported is not a distinguishing factor.",
            sources: {
              page_numbers: [32],
              supporting_text:
                "Active transport differs from passive transport in that it requires energy in the form of ATP to move substances against their concentration gradient (p.32).",
            },
          },
        ]);

        // return data;
      } catch (error) {
        console.error("Error fetching data:", error);
      }

      // const data = await response.json();
      // setQuizData(data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setIsQuizLoading(false);
    }
  };

  // Update the fetchFlashcards function
  const fetchFlashcards = async () => {
    setIsFlashcardLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_INFERENCE_IP}/generate-flashcards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document_id: globalDocumentId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFlashcardData(data);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
    } finally {
      setIsFlashcardLoading(false);
    }
  };

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

    setIsLoading(true);

    const chatResponse = await fetchData({ systemContent, userContent });

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
    const { htmlResponse: responses } = await processChatData(chatResponse);

    setIsLoading(false);

    const baseX = nodes2.find((n) => n.id === parentId)?.position?.x || 100;
    const baseY = nodes2.find((n) => n.id === parentId)?.position?.y || 100;

    const mergedStringList = chatResponse.section.map((object, index) => {
      return mergeObjectToString(object);
    });

    const newNodes = responses.map((text, index) => {
      const id = `${parentId}-${index}`;
      historicalData[id] = mergedStringList[index];
      return {
        id,
        type: "editableInputNode",
        position: { x: baseX + index * 350, y: baseY + 350 },
        data: {
          text: `<div style="color: black">${text}</div>`,
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
    documentIdGlobal = setGlobalDocumentId(documentId);

    const newId = "2";
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: "editableInputNode",
        position: { x: 100, y: 300 },
        data: {
          text: '<h3 style="color: black">Ask me some questions regarding the uploaded documents!</h3>',
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

  nodes2.push({
    id: "1",
    type: "fileUploadNode",
    position: { x: 100, y: 100 },
    data: {
      label: "Upload File",
      onUploadSuccess: handleUploadSuccess,
    },
  });

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        // position: "relative",
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
            <div style={{ width: "50%" }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ maxZoom: 1.5 }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                display: "flex",
                gap: "12px",
                zIndex: 1000,
              }}>
              {/* <button
                onClick={() => {
                  setShowQuizPanel(true);
                  fetchQuizzes();
                }}
                style={{
                  padding: "8px 16px",
                  zIndex: 1000,
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s",
                  fontSize: "14px",
                  color: "#1a1a1a",
                  ":hover": {
                    backgroundColor: "#f8fafc",
                  },
                }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                Quiz
              </button>
              <button
                onClick={() => {
                  setShowFlashcardPanel(true);
                  // fetchFlashcards();
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s",
                  fontSize: "14px",
                  color: "#1a1a1a",
                  ":hover": {
                    backgroundColor: "#f8fafc",
                  },
                }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Flashcards
              </button> */}
            </div>

            {selectedNodeText && (
              <div
                style={{
                  width: panelWidth,
                  height: "100%",
                  padding: "1rem",
                  overflowY: "auto",
                  position: "relative",
                }}>
                {/* Close Button */}
                <button
                  onClick={() => setSelectedNodeText(null)}
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    background: "transparent",
                    border: "none",
                    width: "32px",
                    height: "32px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "20px",
                    lineHeight: "32px",
                    textAlign: "center",
                  }}
                  title="Close">
                  x
                </button>

                <div
                  style={{
                    background: "#f9fafb",
                    padding: "1rem",
                    borderRadius: "8px",
                    height: "100%",
                    overflowY: "auto",
                    paddingRight: "0.5rem",
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedNodeText }}
                />
              </div>
            )}
            {isLoading && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.3)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 9999,
                }}>
                <div className="spinner" />
              </div>
            )}
            {showQuizPanel && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 2000,
                }}>
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    width: "90%",
                    maxWidth: "600px",
                    maxHeight: "80vh",
                    position: "relative",
                    overflowY: "auto",
                  }}>
                  <button
                    onClick={() => setShowQuizPanel(false)}
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px",
                      fontSize: "20px",
                    }}>
                    ✕
                  </button>
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
