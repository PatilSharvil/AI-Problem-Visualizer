import React from 'react';
import './HeapDisplay.css';

function HeapDisplay({ data, type = 'min' }) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return null;
    }

    return (
        <div className="heap-display">
            <div className="heap-title">{type === 'min' ? 'Min Heap' : 'Max Heap'}</div>
            <div className="heap-array">
                {data.map((item, index) => (
                    <div key={index} className={`heap-item ${index === 0 ? 'root' : ''}`}>
                        {String(item)}
                    </div>
                ))}
            </div>
            <div className="heap-hint">Top: {data[0]}</div>
        </div>
    );
}

export default HeapDisplay;
