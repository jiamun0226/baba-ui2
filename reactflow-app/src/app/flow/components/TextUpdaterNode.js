import { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';


// Use NodeProps to get correctly typed built-in props like `isConnectable`
const handleStyle = { left: 10 };

function TextUpdaterNode({ data, isConnectable }) {
    const onChange = useCallback(({ target: { value } }) => {
  console.log(value);
}, []);
  return (
    <div className="text-updater-node">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div>
        <label htmlFor="text">Text:</label>
        <input id="text" name="text" onChange={onChange} className="nodrag" />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        style={handleStyle}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default TextUpdaterNode;