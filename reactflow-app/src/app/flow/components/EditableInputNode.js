'use client';

import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';

export default function EditableInputNode({ data, isConnectable }) {
  const [value, setValue] = useState(data.initialValue || '');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      console.log('Entered value:', value);
      data.onEnter?.(value); // optional callback support
    }
  };

  return (
    <div
      style={{
        padding: 10,
        border: '1px solid #aaa',
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        minWidth: 200,
        backgroundColor: '#f9fafb',
      }}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />

      <div style={{ flexGrow: 1, userSelect: 'none' }}>
        {data.text || 'Enter value:'}
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          padding: '4px 8px',
          borderRadius: 4,
          border: '1px solid #ccc',
          width: 100,
        }}
        placeholder={data.placeholder || ''}
      />

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
}
