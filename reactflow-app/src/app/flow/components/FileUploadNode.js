"use client";

import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { storeFile, retrieveFileURL } from "../../../lib/oss/init";
import { v4 as uuidv4 } from "uuid";

async function fetchData(fileName) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_INFERENCE_IP}/process-pdf`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: fileName,
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

export default function FileUploadNode({ data, isConnectable }) {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [uploading, setUploading] = useState(false);
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleSubmit = async () => {
    if (!file) return alert("No file selected");
    setUploading(true);

    try {
      const fileName = uuidv4() + "_" + file.name;
      const filePath = `${fileName}`;
      const fileStream = file.stream();

      const { status, result } = await storeFile(
        filePath,
        fileName,
        fileStream
      );
      if (status === "success") {
        const { ossUrl } = await retrieveFileURL(filePath);
        const processPdfData = await fetchData(result.name);
        if (!processPdfData.success) {
          alert("Process pdf failed!");
        }
        data.onUploadSuccess({
          ossUrl,
          documentId: processPdfData.document_id,
        });
        alert("Uploaded successfully!");
      } else {
        alert("Upload failed!");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        padding: 10,
        border: "1px solid #ddd",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 400,
      }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />

      <div
        style={{
          color: "black",
        }}>
        <strong>{data.label || "File Upload"}</strong>
      </div>

      <div>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          style={{ display: "none" }}
          accept="application/pdf"
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignItems: "center",
          }}>
          <label
            htmlFor="file-upload"
            style={{
              padding: "10px 16px",
              backgroundColor: file ? "#e0f2fe" : "#ffffff",
              color: file ? "#0369a1" : "#0f172a",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: file ? "1px solid #0ea5e9" : "1px dashed #94a3b8",
              transition: "all 0.2s ease",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: file
                ? "0 2px 4px rgba(14, 165, 233, 0.1)"
                : "0 1px 2px rgba(0, 0, 0, 0.05)",
              width: "fit-content",
            }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={file ? "#0ea5e9" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            {file ? file.name : "Choose PDF File"}
          </label>
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={uploading}
        style={{
          padding: "2px 10px",
          backgroundColor: uploading ? "#ccc" : "#173e94",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: uploading ? "not-allowed" : "pointer",
          fontSize: "small",
        }}>
        {uploading ? "Uploading..." : "Submit"}
      </button>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
}
