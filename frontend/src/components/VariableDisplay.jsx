import React from 'react';
import './VariableDisplay.css';

const VariableDisplay = ({ variables }) => {
    if (!variables || Object.keys(variables).length === 0) {
        return null;
    }

    // Filter out null/undefined values and format for display
    const displayVars = Object.entries(variables)
        .filter(([key, value]) => value !== null && value !== undefined)
        .map(([key, value]) => ({
            key,
            value,
            label: formatLabel(key)
        }));

    if (displayVars.length === 0) {
        return null;
    }

    return (
        <div className="variable-display">
            <h3 className="variable-display-title">Variables</h3>
            <div className="variable-grid">
                {displayVars.map(({ key, value, label }) => (
                    <div key={key} className="variable-card">
                        <div className="variable-label">{label}</div>
                        <div className="variable-value">
                            {formatValue(value)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Helper function to format variable names
function formatLabel(key) {
    // Convert snake_case or camelCase to Title Case
    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();
}

// Helper function to format values
function formatValue(value) {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'boolean') {
        return value ? '✓' : '✗';
    }
    if (Array.isArray(value)) {
        return `[${value.join(', ')}]`;
    }
    return String(value);
}

export default VariableDisplay;
