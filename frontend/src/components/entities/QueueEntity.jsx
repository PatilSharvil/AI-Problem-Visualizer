import React from 'react';
import './QueueEntity.css';

function QueueEntity({ id, data, meta, actions }) {
    const { label } = meta || {};
    const displayData = data || [];

    return (
        <div className="queue-entity">
            <div className="entity-header">
                <span className="entity-icon">🚶‍♂️</span>
                <span className="entity-label">{label || 'Queue'}</span>
                <span className="entity-size">Size: {displayData.length}</span>
            </div>

            <div className="queue-content">
                <div className="queue-front-label">FRONT →</div>
                <div className="queue-container">
                    {displayData.length === 0 ? (
                        <div className="queue-empty">Empty</div>
                    ) : (
                        displayData.map((val, idx) => (
                            <div key={idx} className={`queue-item ${idx === 0 ? 'front' : ''} ${idx === displayData.length - 1 ? 'rear' : ''}`}>
                                {String(val)}
                            </div>
                        ))
                    )}
                </div>
                <div className="queue-rear-label">← REAR</div>
            </div>
        </div>
    );
}

export default QueueEntity;
