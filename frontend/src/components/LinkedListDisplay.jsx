import React, { useState, useEffect, useRef } from 'react';
import './LinkedListDisplay.css';

function LinkedListDisplay({ data, pointers, highlight, operation }) {
    const [animatedNodes, setAnimatedNodes] = useState(new Set());
    const prevHighlightRef = useRef([]);

    // Animate newly highlighted nodes
    useEffect(() => {
        const prevHighlight = prevHighlightRef.current;
        const currHighlight = highlight || [];

        const newHighlights = currHighlight.filter(i => !prevHighlight.includes(i));
        if (newHighlights.length > 0) {
            setAnimatedNodes(new Set(newHighlights));
            setTimeout(() => setAnimatedNodes(new Set()), 400);
        }

        prevHighlightRef.current = currHighlight;
    }, [JSON.stringify(highlight)]);

    const displayData = Array.isArray(data) ? data : [];

    if (displayData.length === 0) {
        return (
            <div className="linked-list">
                <div className="ll-label">Linked List</div>
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

    const isAnimating = (index) => animatedNodes.has(index);

    return (
        <div className="linked-list">
            <div className="ll-label">Linked List</div>

            <div className="ll-container">
                {/* HEAD */}
                <div className="ll-head">HEAD</div>
                <div className="ll-arrow-simple">→</div>

                {/* Nodes */}
                {displayData.map((item, index) => {
                    const highlighted = isHighlighted(index);
                    const pointerLabels = getPointerLabels(index);
                    const isLast = index === displayData.length - 1;
                    const animating = isAnimating(index);

                    return (
                        <React.Fragment key={index}>
                            <div className={`ll-node-box ${highlighted ? 'highlighted' : ''} ${animating ? 'animate' : ''}`}>
                                {/* Pointer labels on top */}
                                {pointerLabels.length > 0 && (
                                    <div className="ll-ptr-labels">
                                        {pointerLabels.map(p => (
                                            <span key={p} className={`ll-ptr ${p}`}>{p}</span>
                                        ))}
                                        <span className="ll-ptr-arrow">↓</span>
                                    </div>
                                )}

                                {/* Node content */}
                                <div className="ll-node-content">
                                    <div className="ll-value">{String(item)}</div>
                                    <div className="ll-next">{isLast ? '∅' : '•'}</div>
                                </div>

                                {/* Index */}
                                <div className="ll-index">{index}</div>
                            </div>

                            {/* Arrow to next */}
                            {!isLast && <div className="ll-arrow-simple">→</div>}
                        </React.Fragment>
                    );
                })}

                {/* NULL */}
                <div className="ll-null">NULL</div>
            </div>
        </div>
    );
}

export default LinkedListDisplay;
