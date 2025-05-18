"use client";

import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";

export default function EditableInputNode({ data, isConnectable }) {
  const [value, setValue] = useState(data.initialValue || "");
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      data.onEnter?.(value); // optional callback support
    }
  };

  function truncateHtmlText(htmlString, maxChars = 250) {
    const div = document.createElement("div");
    div.innerHTML = htmlString;
    const text = div.innerText || div.textContent || "";
    return text.length > maxChars
      ? text.substring(0, maxChars) + "......"
      : text;
  }

  return (
    <div
      style={{
        padding: 10,
        border: `1px solid ${isFocused ? "#0ea5e9" : "#aaa"}`,
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        width: 300,
        backgroundColor: "#f9fafb",
        boxShadow: isFocused ? "0 0 0 2px rgba(14, 165, 233, 0.2)" : "none",
        transition: "all 0.2s ease",
      }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />

      <div
        style={{
          position: "relative",
          flexGrow: 1,
          userSelect: "none",
          maxHeight: 200,
          overflow: "hidden",
          overflowY: "auto",
          paddingRight: "0.5rem",
        }}>
        <div dangerouslySetInnerHTML={{ __html: data.text || "" }} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          color: "black",
          padding: "4px 4px",
          borderRadius: 4,
          border: "1px solid #ccc",
          width: 280,
        }}
        placeholder={data.placeholder || ""}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
}
