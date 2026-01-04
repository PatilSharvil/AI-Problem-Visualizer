import React, { useState, useEffect, useRef } from 'react';
import './StackQueueDisplay.css';

function StackQueueDisplay({ type, data, operation, operationValue }) {
    const [animatingIdx, setAnimatingIdx] = useState(null);
    const [animationType, setAnimationType] = useState(null);
    const prevDataRef = useRef(null);

    // Detect push/pop operations
    useEffect(() => {
        const prevData = prevDataRef.current || [];
        const currData = data || [];

        if (currData.length > prevData.length) {
            // Push/Enqueue - animate last element
            const newIdx = type === 'stack' ? 0 : currData.length - 1;
            setAnimatingIdx(newIdx);
            setAnimationType('push');
            setTimeout(() => {
                setAnimatingIdx(null);
                setAnimationType(null);
            }, 400);
        } else if (currData.length < prevData.length) {
            // Pop/Dequeue - the element is already gone, just show effect
            setAnimationType('pop');
            setTimeout(() => setAnimationType(null), 300);
        }

        prevDataRef.current = currData ? [...currData] : [];
    }, [JSON.stringify(data), type]);

    const isStack = type === 'stack';
    const isDeque = type === 'deque';
    const title = isStack ? 'Stack' : isDeque ? 'Double-Ended Queue' : 'Queue';
    const icon = isStack ? '📚' : isDeque ? '↔️' : '📋';

    const displayData = Array.isArray(data) ? data : [];

    return (
        <div className={`sq-container ${type}`}>
            <div className="sq-header">
                <span className="sq-icon">{icon}</span>
                <span className="sq-title">{title}</span>
                {operation && (
                    <span className={`sq-op-badge ${operation}`}>
                        {operation.toUpperCase()}
                        {operationValue !== undefined && `: ${operationValue}`}
                    </span>
                )}
            </div>

            {isStack ? (
                /* STACK - Vertical, top at top */
                <div className="stack-body">
                    <div className="stack-label top-label">← TOP</div>
                    <div className="stack-items">
                        {displayData.length === 0 ? (
                            <div className="sq-empty">Empty Stack</div>
                        ) : (
                            [...displayData].reverse().map((item, idx) => {
                                const realIdx = displayData.length - 1 - idx;
                                const isTop = idx === 0;
                                const isAnimating = animatingIdx === realIdx;

                                return (
                                    <div
                                        key={realIdx}
                                        className={`stack-item ${isTop ? 'top' : ''} ${isAnimating ? 'push-anim' : ''}`}
                                    >
                                        <span className="item-value">{String(item)}</span>
                                        {isTop && <span className="top-indicator">●</span>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="stack-label bottom-label">BOTTOM</div>
                    <div className="stack-base"></div>
                </div>
            ) : (
                /* QUEUE/DEQUE - Horizontal */
                <div className="queue-body">
                    <div className="queue-labels">
                        <span className="queue-label front">FRONT ↓</span>
                        <span className="queue-label rear">↓ REAR</span>
                    </div>
                    <div className="queue-track">
                        {displayData.length === 0 ? (
                            <div className="sq-empty">Empty {isDeque ? 'Deque' : 'Queue'}</div>
                        ) : (
                            displayData.map((item, idx) => {
                                const isFront = idx === 0;
                                const isRear = idx === displayData.length - 1;
                                const isAnimating = animatingIdx === idx;

                                return (
                                    <div
                                        key={idx}
                                        className={`queue-item ${isFront ? 'front' : ''} ${isRear ? 'rear' : ''} ${isAnimating ? 'push-anim' : ''}`}
                                    >
                                        <span className="item-value">{String(item)}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {isDeque && (
                        <div className="deque-arrows">
                            <span className="deque-arrow">← Add/Remove</span>
                            <span className="deque-arrow">Add/Remove →</span>
                        </div>
                    )}
                </div>
            )}

            <div className="sq-footer">
                <span className="sq-size">Size: {displayData.length}</span>
            </div>
        </div>
    );
}

export default StackQueueDisplay;
