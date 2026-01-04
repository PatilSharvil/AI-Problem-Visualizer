import React, { useState, useEffect, useRef } from 'react';
import './ArrayRow.css';

function ArrayRow({ id, label, data, highlight, pointers, window }) {
    const [swapState, setSwapState] = useState({ active: false, indices: [], oldData: null });
    const prevDataRef = useRef(null);

    // Detect swap between frames
    useEffect(() => {
        const oldData = prevDataRef.current;
        const newData = data;

        if (oldData && newData && Array.isArray(oldData) && Array.isArray(newData) && oldData.length === newData.length) {
            const swap = detectSwap(oldData, newData);
            if (swap) {
                setSwapState({ active: true, indices: swap, oldData: [...oldData] });
                setTimeout(() => {
                    setSwapState({ active: false, indices: [], oldData: null });
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

    // Use old data during animation
    const displayData = swapState.active && swapState.oldData ? swapState.oldData : (Array.isArray(data) ? data : []);

    if (displayData.length === 0) {
        return (
            <div className="array-row">
                {label && <div className="array-label">{label}</div>}
                <div className="array-empty">No data</div>
            </div>
        );
    }

    const isHighlighted = (index) => {
        if (Array.isArray(highlight) && highlight.includes(index)) return true;
        if (window && index >= window.start && index <= window.end) return true;
        return false;
    };

    const getPointerLabels = (index) => {
        if (!pointers) return [];
        return Object.entries(pointers).filter(([k, v]) => v === index).map(([k]) => k);
    };

    const isSwapping = (index) => swapState.active && swapState.indices.includes(index);

    const getSwapTransform = (index) => {
        if (!swapState.active || !swapState.indices.includes(index)) return '';
        const [i, j] = swapState.indices;
        const gap = 8;
        const boxWidth = 50;
        const distance = Math.abs(j - i) * (boxWidth + gap);

        if (index === i) return `translateX(${distance}px)`;
        if (index === j) return `translateX(-${distance}px)`;
        return '';
    };

    return (
        <div className="array-row">
            {label && <div className="array-label">{label}</div>}

            {swapState.active && (
                <div className="swap-banner">
                    🔄 Swapping: [{swapState.indices[0]}] ↔ [{swapState.indices[1]}]
                </div>
            )}

            <div className="array-boxes">
                {displayData.map((item, index) => {
                    const highlighted = isHighlighted(index);
                    const swapping = isSwapping(index);
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
                                    <span className="pointer-arrow">↓</span>
                                </div>
                            )}

                            {/* Box */}
                            <div className={`array-box ${highlighted ? 'highlighted' : ''} ${swapping ? 'swap-active' : ''}`}>
                                {String(item)}
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
