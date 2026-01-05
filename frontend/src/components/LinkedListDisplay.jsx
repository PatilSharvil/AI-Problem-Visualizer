import React, { useState, useEffect, useRef } from 'react';
import './LinkedListDisplay.css';

function LinkedListDisplay({ data, pointers, highlight, operation, swap }) {
  const [swapState, setSwapState] = useState({ active: false, indices: [], oldData: null });
  const [animatedNodes, setAnimatedNodes] = useState(new Set());
  const prevDataRef = useRef(null);

  // Detect swap between frames
  useEffect(() => {
    const oldData = prevDataRef.current;
    const newData = data;

    if (oldData && newData && Array.isArray(oldData) && Array.isArray(newData) && oldData.length === newData.length) {
      const detectedSwap = detectSwap(oldData, newData);
      if (detectedSwap) {
        setSwapState({ active: true, indices: detectedSwap, oldData: [...oldData] });
        setAnimatedNodes(new Set(detectedSwap));
        setTimeout(() => {
          setSwapState({ active: false, indices: [], oldData: null });
          setAnimatedNodes(new Set());
        }, 500);
      }
    }
    prevDataRef.current = newData ? [...newData] : null;
  }, [JSON.stringify(data)]);

  const detectSwap = (oldArr, newArr) => {
    const changed = [];
    for (let i = 0; i < oldArr.length; i++) {
      if (String(oldArr[i]) !== String(newArr[i])) changed.push(i);
    }
    if (changed.length === 2) {
      const [i, j] = changed;
      if (String(oldArr[i]) === String(newArr[j]) && String(oldArr[j]) === String(newArr[i])) {
        return [i, j];
      }
    }
    return null;
  };

  // Use old data during swap animation
  const displayData = swapState.active && swapState.oldData ? swapState.oldData : (Array.isArray(data) ? data : []);

  if (displayData.length === 0) {
    return (
      <div className="linked-list">
        <div className="ll-header">
          <span className="ll-icon">🔗</span>
          <span className="ll-title">Linked List</span>
        </div>
        <div className="ll-empty">Empty List</div>
      </div>
    );
  }

  const isHighlighted = (index) => Array.isArray(highlight) && highlight.includes(index);

  const getPointerLabels = (index) => {
    if (!pointers) return [];
    return Object.entries(pointers)
      .filter(([k, v]) => v === index)
      .map(([k]) => k);
  };

  const isSwapping = (index) => swapState.active && swapState.indices.includes(index);

  const getSwapTransform = (index) => {
    if (!swapState.active || !swapState.indices.includes(index)) return '';
    const [i, j] = swapState.indices;
    const nodeWidth = 90; // node width + arrow width
    const distance = Math.abs(j - i) * nodeWidth;

    if (index === i) return `translateX(${distance}px)`;
    if (index === j) return `translateX(-${distance}px)`;
    return '';
  };

  return (
    <div className="linked-list">
      <div className="ll-header">
        <span className="ll-icon">🔗</span>
        <span className="ll-title">Linked List</span>
        {operation && <span className="ll-op-badge">{operation}</span>}
        <span className="ll-size">Length: {displayData.length}</span>
      </div>

      {swapState.active && (
        <div className="ll-swap-banner">
          🔄 Swapping nodes: [{swapState.indices[0]}] ↔ [{swapState.indices[1]}]
        </div>
      )}

      <div className="ll-container">
        <div className="ll-head-marker">HEAD →</div>

        {displayData.map((item, index) => {
          const highlighted = isHighlighted(index);
          const pointerLabels = getPointerLabels(index);
          const isLast = index === displayData.length - 1;
          const swapping = isSwapping(index);
          const transform = getSwapTransform(index);

          return (
            <React.Fragment key={index}>
              <div
                className={`ll-node-wrapper ${swapping ? 'swapping' : ''}`}
                style={{
                  transform,
                  transition: swapState.active ? 'transform 0.4s ease-in-out' : 'none',
                  zIndex: swapping ? 10 : 1
                }}
              >
                {/* Pointer labels */}
                {pointerLabels.length > 0 && (
                  <div className="ll-ptr-labels">
                    {pointerLabels.map(p => (
                      <span key={p} className={`ll-ptr ${p}`}>{p}</span>
                    ))}
                  </div>
                )}

                {/* Node */}
                <div className={`ll-node ${highlighted ? 'highlighted' : ''} ${swapping ? 'swap-active' : ''}`}>
                  <div className="ll-value">{String(item)}</div>
                  <div className="ll-next-ptr">{isLast ? '∅' : '→'}</div>
                </div>

                <div className="ll-idx">{index}</div>
              </div>

              {/* Arrow connector */}
              {!isLast && <div className="ll-arrow">→</div>}
            </React.Fragment>
          );
        })}

        <div className="ll-null-marker">NULL</div>
      </div>
    </div>
  );
}

export default LinkedListDisplay;
