import React from 'react';
import './ArrayVisualization.css';

const ArrayVisualization = ({ array, window, animate = true }) => {
    if (!array || (Array.isArray(array) && array.length === 0) || (typeof array === 'string' && array.length === 0)) {
        return <div className="array-visualization-empty">No array data available</div>;
    }

    // Convert string to array of characters if needed
    const elements = typeof array === 'string' ? array.split('') : array;
    const { left, right, highlighted_indices = [] } = window || {};

    return (
        <div className="array-visualization">
            <div className="array-container">
                {elements.map((value, index) => {
                    const isHighlighted = highlighted_indices.includes(index);
                    const isLeft = left === index;
                    const isRight = right === index;

                    return (
                        <div key={index} className="array-element-wrapper">
                            {/* Pointer indicators */}
                            {isLeft && (
                                <div className="pointer-indicator left-pointer">
                                    <span>L</span>
                                    <div className="pointer-arrow">↓</div>
                                </div>
                            )}
                            {isRight && !isLeft && (
                                <div className="pointer-indicator right-pointer">
                                    <span>R</span>
                                    <div className="pointer-arrow">↓</div>
                                </div>
                            )}

                            {/* Array element */}
                            <div
                                className={`array-element ${isHighlighted ? 'highlighted' : ''} ${animate ? 'animate' : ''}`}
                                data-index={index}
                            >
                                <div className="element-value">{value}</div>
                            </div>

                            {/* Index label */}
                            <div className="element-index">{index}</div>
                        </div>
                    );
                })}
            </div>

            {/* Window info display */}
            {left !== null && right !== null && (
                <div className="window-info">
                    <span className="window-range">
                        Window: [{left}..{right}]
                        {highlighted_indices.length > 0 && (
                            <span className="window-size"> (size: {highlighted_indices.length})</span>
                        )}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ArrayVisualization;
