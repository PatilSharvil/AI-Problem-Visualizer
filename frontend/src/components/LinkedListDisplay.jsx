import React, { useState, useEffect, useRef } from 'react';
import './LinkedListDisplay.css';

function LinkedListDisplay({ data, pointers, highlight, operation, swap }) {
  const [swapState, setSwapState] = useState({ active: false, indices: [], oldData: null });
  const [removedIndices, setRemovedIndices] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const prevDataRef = useRef(null);

  useEffect(() => {
    const oldData = prevDataRef.current;
    const newData = Array.isArray(data) ? data : [];

    if (oldData && oldData.length > 0) {
      // Detect swap (same length, two elements changed positions)
      if (oldData.length === newData.length) {
        const swap = detectSwap(oldData, newData);
        if (swap) {
          setDisplayData([...oldData]);
          setSwapState({ active: true, indices: swap, oldData: [...oldData] });
          setTimeout(() => {
            setSwapState({ active: false, indices: [], oldData: null });
            setDisplayData(newData);
          }, 500);
          prevDataRef.current = newData;
          return;
        }
      }

      // Detect removal (length decreased)
      if (newData.length < oldData.length) {
        // Find which indices were removed
        const removed = findRemovedIndices(oldData, newData);
        if (removed.length > 0) {
          setDisplayData([...oldData]);
          setRemovedIndices(removed);
          setTimeout(() => {
            setRemovedIndices([]);
            setDisplayData(newData);
          }, 500);
          prevDataRef.current = newData;
          return;
        }
      }
    }

    setDisplayData(newData);
    prevDataRef.current = newData;
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

  const findRemovedIndices = (oldArr, newArr) => {
    const removed = [];
    let newIdx = 0;
    for (let oldIdx = 0; oldIdx < oldArr.length; oldIdx++) {
      if (newIdx < newArr.length && String(oldArr[oldIdx]) === String(newArr[newIdx])) {
        newIdx++;
      } else {
        removed.push(oldIdx);
      }
    }
    return removed;
  };

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
  const isBeingRemoved = (index) => removedIndices.includes(index);

  const getSwapTransform = (index) => {
    if (!swapState.active || !swapState.indices.includes(index)) return '';
    const [i, j] = swapState.indices;
    const nodeWidth = 90;
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
        <span className="ll-size">Length: {data?.length || 0}</span>
      </div>

      {swapState.active && (
        <div className="ll-swap-banner">
          🔄 Swapping: [{swapState.indices[0]}] ↔ [{swapState.indices[1]}]
        </div>
      )}

      {removedIndices.length > 0 && (
        <div className="ll-remove-banner">
          ❌ Removing node(s): {removedIndices.map(i => `[${i}]`).join(', ')}
        </div>
      )}

      <div className="ll-container">
        <div className="ll-head-marker">HEAD →</div>

        {displayData.map((item, index) => {
          const highlighted = isHighlighted(index);
          const pointerLabels = getPointerLabels(index);
          const isLast = index === displayData.length - 1;
          const swapping = isSwapping(index);
          const removing = isBeingRemoved(index);
          const transform = getSwapTransform(index);

          return (
            <React.Fragment key={index}>
              <div
                className={`ll-node-wrapper ${swapping ? 'swapping' : ''} ${removing ? 'removing' : ''}`}
                style={{
                  transform,
                  transition: swapState.active ? 'transform 0.4s ease-in-out' : 'none',
                  zIndex: swapping || removing ? 10 : 1
                }}
              >
                {pointerLabels.length > 0 && (
                  <div className="ll-ptr-labels">
                    {pointerLabels.map(p => (
                      <span key={p} className={`ll-ptr ${p}`}>{p}</span>
                    ))}
                  </div>
                )}

                <div className={`ll-node ${highlighted ? 'highlighted' : ''} ${swapping ? 'swap-active' : ''} ${removing ? 'remove-active' : ''}`}>
                  <div className="ll-value">{String(item)}</div>
                  <div className="ll-next-ptr">{isLast ? '∅' : '→'}</div>
                </div>

                <div className="ll-idx">{index}</div>
              </div>

              {!isLast && <div className={`ll-arrow ${removing ? 'fade-out' : ''}`}>→</div>}
            </React.Fragment>
          );
        })}

        <div className="ll-null-marker">NULL</div>
      </div>
    </div>
  );
}

export default LinkedListDisplay;
