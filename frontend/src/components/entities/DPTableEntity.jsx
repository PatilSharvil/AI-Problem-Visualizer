import React, { useState, useEffect, useRef } from 'react';
import './DPTableEntity.css';

function DPTableEntity({ id, data, meta, actions, className }) {
    const { label, currentCell, highlight } = meta || {};
    const [newCell, setNewCell] = useState(null);
    const prevDataRef = useRef(null);

    const is2D = Array.isArray(data) && Array.isArray(data[0]);
    const table = is2D ? data : (Array.isArray(data) ? [data] : []);

    useEffect(() => {
        const prevData = prevDataRef.current;
        if (prevData && table.length > 0) {
            // Detect newly filled cell
            const insertAction = actions?.find(a => a.type === 'insert' || a.type === 'write');
            if (insertAction) {
                setNewCell(insertAction.indices);
                setTimeout(() => setNewCell(null), 400);
            }
        }
        prevDataRef.current = table.length > 0 ? JSON.parse(JSON.stringify(table)) : null;
    }, [JSON.stringify(data)]);

    if (table.length === 0) {
        return (
            <div className={`dp-table-entity ${className || ''}`}>
                <div className="entity-header">
                    <span className="entity-icon">📈</span>
                    <span className="entity-label">{label || 'DP Table'}</span>
                </div>
                <div className="entity-empty">No DP data</div>
            </div>
        );
    }

    const isCurrentCell = (r, c) => {
        if (!currentCell) return false;
        if (is2D) return currentCell[0] === r && currentCell[1] === c;
        return currentCell === c && r === 0;
    };

    const isHighlighted = (r, c) => {
        if (!highlight) return false;
        if (is2D) return highlight.some(h => h[0] === r && h[1] === c);
        return highlight.includes(c) && r === 0;
    };

    const isNew = (r, c) => {
        if (!newCell) return false;
        if (is2D) return newCell[0] === r && newCell[1] === c;
        return newCell === c && r === 0;
    };

    return (
        <div className={`dp-table-entity ${className || ''}`}>
            <div className="entity-header">
                <span className="entity-icon">📈</span>
                <span className="entity-label">{label || 'DP Table'}</span>
                <span className="entity-size">{is2D ? `${table.length}×${table[0]?.length}` : `Length: ${table[0]?.length}`}</span>
            </div>

            <div className="dp-content">
                <table className="dp-table">
                    <thead>
                        <tr>
                            {(is2D) && <th className="dp-corner">i\\j</th>}
                            {table[0].map((_, c) => <th key={c} className="dp-col-label">{c}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {table.map((row, r) => (
                            <tr key={r}>
                                {is2D && <td className="dp-row-label">{r}</td>}
                                {row.map((cell, c) => (
                                    <td
                                        key={c}
                                        className={`dp-cell ${isCurrentCell(r, c) ? 'current' : ''} ${isHighlighted(r, c) ? 'highlighted' : ''} ${isNew(r, c) ? 'new-fill' : ''} ${cell === null ? 'empty' : ''}`}
                                    >
                                        {cell === null || cell === undefined ? '–' : cell === Infinity ? '∞' : String(cell)}
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

export default DPTableEntity;
