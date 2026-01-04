import React from 'react';
import './MatrixDisplay.css';

function MatrixDisplay({ data, highlight, currentCell, path, label }) {
    // data should be a 2D array
    const matrix = Array.isArray(data) && Array.isArray(data[0]) ? data : [];

    if (matrix.length === 0) {
        return (
            <div className="matrix-display">
                <div className="matrix-label">{label || 'Matrix'}</div>
                <div className="matrix-empty">No matrix data</div>
            </div>
        );
    }

    const rows = matrix.length;
    const cols = matrix[0].length;

    const isHighlighted = (r, c) => {
        if (Array.isArray(highlight)) {
            return highlight.some(h => h[0] === r && h[1] === c);
        }
        return false;
    };

    const isCurrentCell = (r, c) => {
        if (currentCell && currentCell[0] === r && currentCell[1] === c) {
            return true;
        }
        return false;
    };

    const isInPath = (r, c) => {
        if (Array.isArray(path)) {
            return path.some(p => p[0] === r && p[1] === c);
        }
        return false;
    };

    return (
        <div className="matrix-display">
            <div className="matrix-header">
                <span className="matrix-label">{label || 'Matrix'}</span>
                <span className="matrix-dims">{rows} × {cols}</span>
            </div>

            <div className="matrix-grid">
                {/* Column indices */}
                <div className="matrix-row col-header">
                    <div className="matrix-cell corner"></div>
                    {matrix[0].map((_, c) => (
                        <div key={c} className="matrix-cell col-idx">{c}</div>
                    ))}
                </div>

                {/* Matrix rows */}
                {matrix.map((row, r) => (
                    <div key={r} className="matrix-row">
                        <div className="matrix-cell row-idx">{r}</div>
                        {row.map((cell, c) => {
                            const highlighted = isHighlighted(r, c);
                            const current = isCurrentCell(r, c);
                            const inPath = isInPath(r, c);

                            return (
                                <div
                                    key={c}
                                    className={`matrix-cell ${highlighted ? 'highlighted' : ''} ${current ? 'current' : ''} ${inPath ? 'path' : ''}`}
                                >
                                    {String(cell)}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MatrixDisplay;
