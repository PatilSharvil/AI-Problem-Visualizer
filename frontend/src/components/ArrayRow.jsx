import React, { useState, useEffect, useRef } from 'react';
import './ArrayRow.css';

function ArrayRow({ id, label, data, highlight, pointers, window: windowRange }) {
    const [swapState, setSwapState] = useState({ active: false, indices: [], oldData: null });
    const [changeHighlight, setChangeHighlight] = useState(new Set());
    const prevDataRef = useRef(null);

    useEffect(() => {
        const oldData = prevDataRef.current;
        const newData = Array.isArray(data) ? data : [];

        if (oldData && oldData.length > 0 && newData.length > 0) {
            // Detect swap (same length, two elements swapped)
            if (oldData.length === newData.length) {
                const swap = detectSwap(oldData, newData);
                if (swap) {
                    setSwapState({ active: true, indices: swap, oldData: [...oldData] });
                    setTimeout(() => {
                        setSwapState({ active: false, indices: [], oldData: null });
                    }, 500);
                    prevDataRef.current = [...newData];
                    return;
                }

                // Detect any changes (for highlighting changed values)
                const changed = detectChanges(oldData, newData);
                if (changed.size > 0) {
                    setChangeHighlight(changed);
                    setTimeout(() => setChangeHighlight(new Set()), 400);
                }
            }
        }

        prevDataRef.current = newData.length > 0 ? [...newData] : null;
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

    const detectChanges = (oldArr, newArr) => {
        const changed = new Set();
        for (let i = 0; i < Math.max(oldArr.length, newArr.length); i++) {
            if (String(oldArr[i] ?? '') !== String(newArr[i] ?? '')) {
                changed.add(i);
            }
        }
        return changed;
    };

    // Use old data during swap animation
    const displayData = swapState.active && swapState.oldData
        ? swapState.oldData
        : (Array.isArray(data) ? data : []);

    // Handle empty data gracefully
    if (!displayData || displayData.length === 0) {
        return (
            <div className="array-row">
                <div className="array-header">
                    <span className="array-icon">📊</span>
                    <span className="array-title">{label || 'Array'}</span>
                    <span className="array-size">Length: 0</span>
                </div>
                <div className="array-empty">Empty array</div>
            </div>
        );
    }

    const isHighlighted = (index) => {
        if (Array.isArray(highlight) && highlight.includes(index)) return true;
        if (windowRange && index >= windowRange.start && index <= windowRange.end) return true;
        return false;
    };

    const isInWindow = (index) => {
        return windowRange && index >= windowRange.start && index <= windowRange.end;
    };

    const getPointerLabels = (index) => {
        if (!pointers) return [];
        return Object.entries(pointers)
            .filter(([k, v]) => v === index)
            .map(([k]) => k);
    };

    const isSwapping = (index) => swapState.active && swapState.indices.includes(index);
    const isChanged = (index) => changeHighlight.has(index);

    const getSwapTransform = (index) => {
        if (!swapState.active || !swapState.indices.includes(index)) return '';
        const [i, j] = swapState.indices;
        const boxWidth = 58; // box width + gap
        const distance = Math.abs(j - i) * boxWidth;

        if (index === i) return `translateX(${distance}px)`;
        if (index === j) return `translateX(-${distance}px)`;
        return '';
    };

    return (
        <div className="array-row">
            <div className="array-header">
                <span className="array-icon">📊</span>
                <span className="array-title">{label || 'Array'}</span>
                {windowRange && (
                    <span className="window-badge">
                        Window: [{windowRange.start}, {windowRange.end}]
                    </span>
                )}
                <span className="array-size">Length: {data?.length || 0}</span>
            </div>

            {swapState.active && (
                <div className="swap-banner">
                    🔄 Swapping: [{swapState.indices[0]}] ↔ [{swapState.indices[1]}]
                </div>
            )}

            <div className="array-boxes">
                {displayData.map((item, index) => {
                    const highlighted = isHighlighted(index);
                    const swapping = isSwapping(index);
                    const changed = isChanged(index);
                    const inWindow = isInWindow(index);
                    const pointerLabels = getPointerLabels(index);
                    const transform = getSwapTransform(index);

                    return (
                        <div
                            key={index}
                            className={`box-wrapper ${swapping ? 'swapping' : ''}`}
                            style={{
                                transform,
                                transition: swapState.active ? 'transform 0.4s ease-in-out' : 'none',
                                zIndex: swapping ? 10 : 1
                            }}
                        >
                            {/* Pointer labels */}
                            {pointerLabels.length > 0 && (
                                <div className="pointer-labels">
                                    {pointerLabels.map(p => (
                                        <span key={p} className={`pointer-tag ${p}`}>{p}</span>
                                    ))}
                                </div>
                            )}

                            {/* Box */}
                            <div className={`array-box ${highlighted ? 'highlighted' : ''} ${swapping ? 'swap-active' : ''} ${changed ? 'changed' : ''} ${inWindow ? 'in-window' : ''}`}>
                                {item === null || item === undefined ? '–' : String(item)}
                            </div>

                            {/* Index */}
                            <div className="box-index">{index}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ArrayRow;
