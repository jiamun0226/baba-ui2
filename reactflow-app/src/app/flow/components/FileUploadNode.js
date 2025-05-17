'use client';

import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { storeFile, retrieveFileURL } from '../../../lib/oss/init';
import { v4 as uuidv4 } from 'uuid';

async function fetchData(fileName) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_INFERENCE_IP}/process-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: fileName
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
    if (!file) return alert('No file selected');
    setUploading(true);

    try {
      const fileName = uuidv4() + '_' + file.name;
      const filePath = `${fileName}`;
      const fileStream = file.stream();

      const { status, result } = await storeFile(filePath, fileName, fileStream);
      if (status === 'success') {
        const { ossUrl }= await retrieveFileURL(filePath)
        const processPdfData = await fetchData(result.name)
        if (!processPdfData.success) {
          alert('Process pdf failed!');
        }
        data.onUploadSuccess({ossUrl, documentId:processPdfData.document_id});
        alert('Uploaded successfully!');
      } else {
        alert('Upload failed!');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        padding: 10,
        border: '1px solid #ddd',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 400,
      }}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />

      <div>
        <strong>{data.label || 'File Upload'}</strong>
      </div>

      <div>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept="application/pdf"
        />
        <label
          htmlFor="file-upload"
          style={{
            padding: '8px 12px',
            backgroundColor: '#1e40af',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'inline-block',
          }}
        >
          Choose File
        </label>
        {file && <span style={{ marginLeft: '10px' }}>{file.name}</span>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={uploading}
        style={{
          padding: '6px 10px',
          backgroundColor: uploading ? '#ccc' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? 'Uploading...' : 'Submit to OSS'}
      </button>


      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
}
