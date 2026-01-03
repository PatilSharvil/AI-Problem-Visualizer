import React from 'react';
import './StackQueueDisplay.css';

function StackQueueDisplay({ type, data, operation, operationValue }) {
    if (!data) {
        data = [];
    }

    const isStack = type === 'stack';
    const title = isStack ? 'Stack' : 'Queue';

    // For stack, show bottom to top (last element is top)
    // For queue, show front to back (first element is front)

    return (
        <div className={`stack-queue-display ${type}`}>
            <div className="sq-header">
                <span className="sq-title">{title}</span>
                {operation && (
                    <span className={`sq-operation ${operation}`}>
                        {operation.toUpperCase()}
                        {operationValue !== undefined && `: ${operationValue}`}
                    </span>
                )}
            </div>

            {isStack ? (
                <div className="stack-container">
                    {/* Stack - vertical, top is at top */}
                    <div className="stack-indicator top">← TOP</div>
                    <div className="stack-elements">
                        {data.length === 0 ? (
                            <div className="sq-empty">Empty Stack</div>
                        ) : (
                            [...data].reverse().map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`stack-item ${idx === 0 ? 'top-item' : ''} ${operation === 'push' && idx === 0 ? 'pushing' : ''} ${operation === 'pop' && idx === 0 ? 'popping' : ''}`}
                                >
                                    {String(item)}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="stack-indicator bottom">← BOTTOM</div>
                </div>
            ) : (
                <div className="queue-container">
                    {/* Queue - horizontal, front is left */}
                    <div className="queue-labels">
                        <span className="queue-label front">FRONT ↓</span>
                        <span className="queue-label rear">↓ REAR</span>
                    </div>
                    <div className="queue-elements">
                        {data.length === 0 ? (
                            <div className="sq-empty">Empty Queue</div>
                        ) : (
                            data.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`queue-item ${idx === 0 ? 'front-item' : ''} ${idx === data.length - 1 ? 'rear-item' : ''} ${operation === 'enqueue' && idx === data.length - 1 ? 'enqueueing' : ''} ${operation === 'dequeue' && idx === 0 ? 'dequeueing' : ''}`}
                                >
                                    {String(item)}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Size indicator */}
            <div className="sq-size">Size: {data.length}</div>
        </div>
    );
}

export default StackQueueDisplay;
