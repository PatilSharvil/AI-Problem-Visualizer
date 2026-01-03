import React from 'react';
import './DynamicRenderer.css';

// Dynamic Array Component - renders any array with optional highlighting and pointers
function ArrayComponent({ id, label, data, highlight, pointers }) {
    if (!data || !Array.isArray(data)) return null;

    const getHighlightClass = (index) => {
        if (!highlight) return '';

        // Handle start/end format
        if (highlight.start !== undefined && highlight.end !== undefined) {
            if (index >= highlight.start && index <= highlight.end) {
                return 'highlighted';
            }
        }

        // Handle indices array format
        if (highlight.indices && highlight.indices.includes(index)) {
            return 'highlighted';
        }

        return '';
    };

    const getPointerLabel = (index) => {
        if (!pointers) return null;
        const labels = [];
        Object.entries(pointers).forEach(([key, value]) => {
            if (value === index) {
                labels.push(key);
            }
        });
        return labels.length > 0 ? labels.join('/') : null;
    };

    return (
        <div className="array-component">
            {label && <div className="array-label">{label}</div>}
            <div className="array-container">
                {data.map((item, index) => (
                    <div key={index} className="array-item-wrapper">
                        {getPointerLabel(index) && (
                            <div className="pointer-label">{getPointerLabel(index)}</div>
                        )}
                        <div className={`array-item ${getHighlightClass(index)}`}>
                            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                        </div>
                        <div className="index-label">{index}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Dynamic Variables Component - renders any key-value pairs
function VariablesComponent({ items }) {
    if (!items || typeof items !== 'object') return null;

    const renderValue = (value) => {
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }
        return String(value);
    };

    return (
        <div className="variables-component">
            <div className="variables-grid">
                {Object.entries(items).map(([key, value]) => (
                    <div key={key} className="variable-item">
                        <span className="variable-name">{key}</span>
                        <span className="variable-value">{renderValue(value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Text Component - renders explanatory text
function TextComponent({ content }) {
    if (!content) return null;
    return <div className="text-component">{content}</div>;
}

// Main Dynamic Renderer - renders any component based on type
export function DynamicRenderer({ components }) {
    if (!components || !Array.isArray(components)) return null;

    return (
        <div className="dynamic-renderer">
            {components.map((component, index) => {
                switch (component.type) {
                    case 'array':
                        return <ArrayComponent key={component.id || index} {...component} />;
                    case 'variables':
                        return <VariablesComponent key={index} {...component} />;
                    case 'text':
                        return <TextComponent key={index} {...component} />;
                    default:
                        // Generic fallback - display as JSON
                        return (
                            <div key={index} className="generic-component">
                                <pre>{JSON.stringify(component, null, 2)}</pre>
                            </div>
                        );
                }
            })}
        </div>
    );
}

export default DynamicRenderer;
