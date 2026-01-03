import React from 'react';
import './VariablePanel.css';

function VariablePanel({ items }) {
    if (!items || Object.keys(items).length === 0) {
        return null;
    }

    const formatValue = (value) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    };

    return (
        <div className="variable-panel">
            <div className="panel-title">Variables</div>
            <div className="variables-grid">
                {Object.entries(items).map(([key, value]) => (
                    <div key={key} className="variable-item">
                        <span className="var-name">{key}</span>
                        <span className="var-value">{formatValue(value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default VariablePanel;
