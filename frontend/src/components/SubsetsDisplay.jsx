import React from 'react';
import './SubsetsDisplay.css';

function SubsetsDisplay({ data }) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return null;
    }

    const formatSubset = (subset) => {
        if (!Array.isArray(subset) || subset.length === 0) return '∅';
        return `{${subset.join(', ')}}`;
    };

    return (
        <div className="subsets-display">
            <div className="subsets-title">Subsets</div>
            <div className="subsets-container">
                {data.map((subset, index) => (
                    <div key={index} className="subset-item">
                        {formatSubset(subset)}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SubsetsDisplay;
