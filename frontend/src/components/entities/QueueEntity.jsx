import React, { useEffect, useState, useRef } from 'react';
import './QueueEntity.css';

function QueueEntity({ id, data, meta, actions }) {
    const { label, highlight = [], operation, processing } = meta || {};
    const displayData = data || [];
    const prevLengthRef = useRef(displayData.length);
    const [animationType, setAnimationType] = useState(null);

    // Detect enqueue/dequeue based on length change
    useEffect(() => {
        const prevLength = prevLengthRef.current;
        const currentLength = displayData.length;

        if (currentLength > prevLength) {
            setAnimationType('enqueue');
        } else if (currentLength < prevLength) {
            setAnimationType('dequeue');
        } else {
            setAnimationType(null);
        }

        prevLengthRef.current = currentLength;

        // Reset animation after it plays
        const timer = setTimeout(() => {
            setAnimationType(null);
        }, 600);

        return () => clearTimeout(timer);
    }, [displayData.length]);

    // Determine the operation type for visual feedback
    const getOperationType = () => {
        if (!operation) return animationType;
        const opLower = operation.toLowerCase();
        if (opLower.includes('enqueue') || opLower.includes('add')) return 'enqueue';
        if (opLower.includes('dequeue') || opLower.includes('remove')) return 'dequeue';
        if (opLower.includes('process')) return 'process';
        return animationType;
    };

    const opType = getOperationType();

    // Check if an index should be highlighted
    const isHighlighted = (idx) => {
        if (Array.isArray(highlight)) {
            return highlight.includes(idx);
        }
        return false;
    };

    // Get item classes based on state
    const getItemClasses = (idx, val) => {
        const classes = ['queue-item'];

        // Position classes
        if (idx === 0) classes.push('front');
        if (idx === displayData.length - 1) classes.push('rear');

        // Highlight class
        if (isHighlighted(idx)) classes.push('highlighted');

        // Processing class (front element being processed)
        if (idx === 0 && processing) classes.push('processing');

        // Animation classes
        if (opType === 'enqueue') {
            if (idx === displayData.length - 1) {
                // New element at rear slides in
                classes.push('slide-in-right');
            } else {
                // Existing elements slide left
                classes.push('shift-left');
            }
        }
        if (opType === 'dequeue' && idx === 0) {
            // Front element sliding out
            classes.push('slide-out-left');
        }

        return classes.join(' ');
    };

    return (
        <div className="queue-entity">
            <div className="entity-header">
                <span className="entity-icon">📤</span>
                <span className="entity-label">{label || 'Queue'}</span>
                <span className="entity-size">Size: {displayData.length}</span>
            </div>

            {/* Operation Banner */}
            {operation && (
                <div className={`queue-operation-banner ${opType || ''}`}>
                    {operation}
                </div>
            )}

            <div className="queue-visual">
                {/* Dequeue arrow */}
                <div className="queue-arrow dequeue-arrow">
                    <span className="arrow-label">Dequeue</span>
                    <span className="arrow-icon">←</span>
                </div>

                {/* Queue items */}
                <div className={`queue-container ${opType || ''}`}>
                    {displayData.length === 0 ? (
                        <div className="queue-empty">Empty Queue</div>
                    ) : (
                        displayData.map((val, idx) => (
                            <div
                                key={`${val}-${idx}`}
                                className={getItemClasses(idx, val)}
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <span className="item-value">{String(val)}</span>
                                {idx === 0 && <span className="position-label front-label">FRONT</span>}
                                {idx === displayData.length - 1 && <span className="position-label rear-label">REAR</span>}
                            </div>
                        ))
                    )}
                </div>

                {/* Enqueue arrow */}
                <div className="queue-arrow enqueue-arrow">
                    <span className="arrow-icon">←</span>
                    <span className="arrow-label">Enqueue</span>
                </div>
            </div>
        </div>
    );
}

export default QueueEntity;
