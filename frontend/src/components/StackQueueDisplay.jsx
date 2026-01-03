import React from 'react';
import './StackQueueDisplay.css';

function StackQueueDisplay({ type, data }) {
    if (!data || !Array.isArray(data)) {
        return null;
    }

    const isStack = type === 'stack';
    const title = isStack ? 'Stack' : 'Queue';
    const displayData = isStack ? [...data].reverse() : data;

    return (
        <div className={`stack-queue-display ${type}`}>
            <div className="sq-title">{title}</div>
            <div className={`sq-container ${isStack ? 'vertical' : 'horizontal'}`}>
                {displayData.length === 0 ? (
                    <div className="sq-empty">Empty</div>
                ) : (
                    displayData.map((item, index) => (
                        <div key={index} className="sq-item">
                            {String(item)}
                        </div>
                    ))
                )}
            </div>
            {isStack && data.length > 0 && (
                <div className="sq-label">← Top</div>
            )}
            {!isStack && data.length > 0 && (
                <div className="sq-labels">
                    <span>Front →</span>
                    <span>← Back</span>
                </div>
            )}
        </div>
    );
}

export default StackQueueDisplay;
