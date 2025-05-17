'use client';

import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { relocateFile, retrieveFileURL, storeFile } from '../../../lib/oss/init';
import { v4 as uuidv4 } from 'uuid';



export default function FileUploadNode({ data, isConnectable }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async () => {
    if (!file) return alert('No file selected');
    setUploading(true);

    try {
        const fileName = uuidv4() + '_' + file.name
        const filePath = `docs/${fileName}`
        const fileStream = file.stream()

        const { status, result } = storeFile(filePath, fileName, fileStream)
        console.log(status)
        if (status == 'success'){
            console.log(result)
            alert('Uploaded successfully!');
        }
        else{
            alert('Uploaded failed!');
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
      />
      <label
        htmlFor="file-upload"
        style={{
          padding: '8px 12px',
          backgroundColor: '#1e40af', // Use a valid color
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
