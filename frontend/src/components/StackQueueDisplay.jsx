import React from 'react';
import './StackQueueDisplay.css';

function StackQueueDisplay({ type, data, operation, operationValue }) {
    const isStack = type === 'stack';
    const isDeque = type === 'deque';
    const title = isStack ? 'Stack' : isDeque ? 'Deque' : 'Queue';
    const icon = isStack ? '📚' : isDeque ? '↔️' : '📋';

    const displayData = Array.isArray(data) ? data : [];

    return (
        <div className={`sq-container ${type}`}>
            <div className="sq-header">
                <span className="sq-icon">{icon}</span>
                <span className="sq-title">{title}</span>
                {operation && (
                    <span className={`sq-badge ${operation}`}>
                        {operation.toUpperCase()}
                        {operationValue !== undefined && `: ${operationValue}`}
                    </span>
                )}
                <span className="sq-size">Size: {displayData.length}</span>
            </div>

            {isStack ? (
                <div className="stack-visual">
                    <div className="stack-top-label">TOP ↓</div>
                    <div className="stack-container">
                        {displayData.length === 0 ? (
                            <div className="sq-empty">Empty</div>
                        ) : (
                            [...displayData].reverse().map((item, idx) => {
                                const isTop = idx === 0;
                                return (
                                    <div key={idx} className={`stack-item ${isTop ? 'top' : ''}`}>
                                        {String(item)}
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="stack-bottom">BOTTOM</div>
                </div>
            ) : (
                <div className="queue-visual">
                    <div className="queue-labels">
                        <span className="q-label front">FRONT</span>
                        <span className="q-label rear">REAR</span>
                    </div>
                    <div className="queue-container">
                        {displayData.length === 0 ? (
                            <div className="sq-empty">Empty</div>
                        ) : (
                            displayData.map((item, idx) => {
                                const isFront = idx === 0;
                                const isRear = idx === displayData.length - 1;
                                return (
                                    <div key={idx} className={`queue-item ${isFront ? 'front' : ''} ${isRear ? 'rear' : ''}`}>
                                        {String(item)}
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {isDeque && (
                        <div className="deque-info">↔ Double-ended operations</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default StackQueueDisplay;
