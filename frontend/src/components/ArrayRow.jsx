import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import './ArrayRow.css';

function ArrayRow({ id, label, data, highlight, pointers, window }) {
    // Animation phases: 'idle' -> 'start' -> 'animate' -> 'idle'
    const [animState, setAnimState] = useState({ phase: 'idle', indices: null, transforms: {} });
    const prevDataRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const oldData = prevDataRef.current;
        const newData = data;

        if (oldData && newData && Array.isArray(oldData) && Array.isArray(newData)) {
            const swap = detectSwap(oldData, newData);
            if (swap) {
                console.log('Swap detected:', swap, 'Old:', oldData, 'New:', newData);

                const [i, j] = swap;
                const gap = 8;
                const barWidth = 40;
                const distance = Math.abs(j - i) * (barWidth + gap);

                // Phase 1: Set initial positions (no transition)
                setAnimState({
                    phase: 'start',
                    indices: swap,
                    displayData: [...oldData],
                    transforms: {
                        [i]: 0,
                        [j]: 0
                    }
                });

                // Phase 2: Animate to new positions (with transition)
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        setAnimState(prev => ({
                            ...prev,
                            phase: 'animate',
                            transforms: {
                                [i]: i < j ? distance : -distance,
                                [j]: j < i ? distance : -distance
                            }
                        }));
                    }, 50);
                });

                // Phase 3: Complete - show new data
                setTimeout(() => {
                    setAnimState({ phase: 'idle', indices: null, transforms: {} });
                }, 600);
            }
        }
        prevDataRef.current = newData ? [...newData] : null;
    }, [JSON.stringify(data)]);

    const detectSwap = (oldArr, newArr) => {
        if (oldArr.length !== newArr.length) return null;
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

    // Show animated data during animation, actual data otherwise
    const displayData = animState.displayData || (Array.isArray(data) ? data : []);

    if (!displayData || displayData.length === 0) {
        return (
            <div className="array-row">
                {label && <div className="array-label">{label}</div>}
                <div className="array-empty">No data</div>
            </div>
        );
    }

    const maxVal = Math.max(...displayData.map(v => Math.abs(Number(v) || 0)), 1);
    const barMaxHeight = 150;

    const isHighlighted = (index) => {
        if (Array.isArray(highlight) && highlight.includes(index)) return true;
        if (window && index >= window.start && index <= window.end) return true;
        return false;
    };

    const getPointerLabels = (index) => {
        if (!pointers) return [];
        return Object.entries(pointers).filter(([k, v]) => v === index).map(([k]) => k);
    };

    const isSwapping = (index) => animState.indices && animState.indices.includes(index);

    const getTransform = (index) => {
        if (animState.transforms && animState.transforms[index] !== undefined) {
            return `translateX(${animState.transforms[index]}px)`;
        }
        return 'translateX(0)';
    };

    const getTransitionStyle = (index) => {
        if (animState.phase === 'animate' && isSwapping(index)) {
            return 'transform 0.4s ease-in-out';
        }
        return 'none';
    };

    return (
        <div className="array-row">
            {label && <div className="array-label">{label}</div>}

            {animState.phase !== 'idle' && animState.indices && (
                <div className="swap-banner">
                    🔄 Swapping indices {animState.indices[0]} ↔ {animState.indices[1]}
                </div>
            )}

            <div className="bars-container" ref={containerRef}>
                {displayData.map((item, index) => {
                    const value = Number(item) || 0;
                    const height = Math.max(20, (Math.abs(value) / maxVal) * barMaxHeight);
                    const swapping = isSwapping(index);

                    return (
                        <div
                            key={index}
                            className={`bar-wrapper ${swapping ? 'swapping' : ''}`}
                            style={{
                                transform: getTransform(index),
                                transition: getTransitionStyle(index),
                                zIndex: swapping ? 10 : 1
                            }}
                        >
                            <div className="pointer-area">
                                {getPointerLabels(index).map(p => (
                                    <span key={p} className="pointer-label">{p}</span>
                                ))}
                            </div>

                            <div
                                className={`bar ${isHighlighted(index) ? 'highlighted' : ''} ${swapping ? 'swap-active' : ''}`}
                                style={{ height: `${height}px` }}
                            >
                                <span className="bar-value">{value}</span>
                            </div>

                            <div className="bar-index">{index}</div>
                        </div>
                    );
                })}
            </div>

            {/* Debug info */}
            <div style={{ fontSize: '10px', color: '#999', marginTop: '5px' }}>
                Phase: {animState.phase} | Indices: {JSON.stringify(animState.indices)} | Data: [{displayData.join(', ')}]
            </div>
        </div>
    );
}

export default ArrayRow;
