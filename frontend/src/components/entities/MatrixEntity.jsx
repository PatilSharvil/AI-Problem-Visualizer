import React from 'react';
import './MatrixEntity.css';

function MatrixEntity({ id, data, meta, actions, className }) {
    const { label, currentCell, path } = meta || {};
    const matrix = Array.isArray(data) ? data : [];

    if (matrix.length === 0) {
        return (
            <div className={`matrix-entity ${className || ''}`}>
                <div className="entity-header">
                    <span className="entity-icon">🔢</span>
                    <span className="entity-label">{label || 'Matrix'}</span>
                </div>
                <div className="entity-empty">No matrix data</div>
            </div>
        );
    }

    const isCurrentCell = (r, c) => {
        if (!currentCell) return false;
        return currentCell[0] === r && currentCell[1] === c;
    };

    const isInPath = (r, c) => {
        if (!path) return false;
        return path.some(p => p[0] === r && p[1] === c);
    };

    return (
        <div className={`matrix-entity ${className || ''}`}>
            <div className="entity-header">
                <span className="entity-icon">🔢</span>
                <span className="entity-label">{label || 'Matrix'}</span>
                <span className="entity-size">{matrix.length}×{matrix[0]?.length}</span>
            </div>

            <div className="matrix-content">
                <table className="matrix-table">
                    <thead>
                        <tr>
                            <th className="matrix-corner"></th>
                            {matrix[0]?.map((_, c) => <th key={c} className="matrix-col-label">{c}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row, r) => (
                            <tr key={r}>
                                <td className="matrix-row-label">{r}</td>
                                {row.map((cell, c) => (
                                    <td
                                        key={c}
                                        className={`matrix-cell ${isCurrentCell(r, c) ? 'current' : ''} ${isInPath(r, c) ? 'in-path' : ''}`}
                                    >
                                        {cell === null ? '–' : String(cell)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default MatrixEntity;
