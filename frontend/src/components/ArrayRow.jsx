import React from 'react';
import './ArrayRow.css';

function ArrayRow({ id, label, data, highlight, pointers, window }) {
    // Allow rendering even with empty data for debugging
    const displayData = Array.isArray(data) && data.length > 0 ? data : [];

    if (displayData.length === 0) {
        return (
            <div className="array-row">
                {label && <div className="array-label">{label}</div>}
                <div className="array-empty">No data available</div>
            </div>
        );
    }

    const isHighlighted = (index) => {
        if (Array.isArray(highlight) && highlight.includes(index)) {
            return true;
        }
        if (window && index >= window.start && index <= window.end) {
            return true;
        }
        if (highlight && typeof highlight === 'object' && !Array.isArray(highlight)) {
            return index >= highlight.start && index <= highlight.end;
        }
        return false;
    };

    const getPointerLabels = (index) => {
        if (!pointers) return [];
        const labels = [];
        Object.entries(pointers).forEach(([key, value]) => {
            if (value === index) labels.push(key);
        });
        return labels;
    };

    return (
        <div className="array-row">
            {label && <div className="array-label">{label}</div>}
            <div className="array-elements">
                {displayData.map((item, index) => {
                    const pointerLabels = getPointerLabels(index);
                    const highlighted = isHighlighted(index);

                    return (
                        <div key={index} className="element-wrapper">
                            <div className="pointer-area">
                                {pointerLabels.map(p => (
                                    <span key={p} className="pointer-label">{p}</span>
                                ))}
                            </div>
                            <div className={`element-box ${highlighted ? 'highlighted' : ''}`}>
                                {String(item)}
                            </div>
                            <div className="index-label">{index}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ArrayRow;
