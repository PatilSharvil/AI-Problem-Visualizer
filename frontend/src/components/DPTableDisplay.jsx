import React, { useState, useEffect, useRef } from 'react';
import './DPTableDisplay.css';

function DPTableDisplay({ data, currentCell, highlight, dependencies, rowLabels, colLabels, label }) {
    const [filledCells, setFilledCells] = useState(new Set());
    const [newCell, setNewCell] = useState(null);
    const prevDataRef = useRef(null);

    // Detect newly filled cells
    useEffect(() => {
        const prevData = prevDataRef.current;
        const currData = Array.isArray(data) ? data : [];

        if (prevData && currData.length > 0) {
            const is2D = Array.isArray(currData[0]);

            if (is2D) {
                // Find newly filled cells in 2D
                for (let r = 0; r < currData.length; r++) {
                    for (let c = 0; c < currData[r].length; c++) {
                        const prevVal = prevData[r]?.[c];
                        const currVal = currData[r][c];
                        if ((prevVal === null || prevVal === undefined) && currVal !== null && currVal !== undefined) {
                            setNewCell([r, c]);
                            setTimeout(() => setNewCell(null), 400);
                            break;
                        }
                    }
                }
            } else {
                // 1D case
                for (let c = 0; c < currData.length; c++) {
                    const prevVal = prevData[c];
                    const currVal = currData[c];
                    if ((prevVal === null || prevVal === undefined) && currVal !== null && currVal !== undefined) {
                        setNewCell(c);
                        setTimeout(() => setNewCell(null), 400);
                        break;
                    }
                }
            }
        }

        prevDataRef.current = currData.length > 0 ? JSON.parse(JSON.stringify(currData)) : null;
    }, [JSON.stringify(data)]);

    const is2D = Array.isArray(data) && Array.isArray(data[0]);
    const table = is2D ? data : (Array.isArray(data) ? [data] : []);

    if (table.length === 0 || (table[0]?.length === 0)) {
        return (
            <div className="dp-display">
                <div className="dp-header">
                    <span className="dp-icon">📈</span>
                    <span className="dp-title">{label || 'DP Table'}</span>
                </div>
                <div className="dp-empty">No DP data</div>
            </div>
        );
    }

    const rows = table.length;
    const cols = table[0]?.length || 0;

    const isCurrentCell = (r, c) => {
        if (!currentCell) return false;
        if (is2D) {
            return Array.isArray(currentCell) && currentCell[0] === r && currentCell[1] === c;
        }
        return currentCell === c && r === 0;
    };

    const isHighlighted = (r, c) => {
        if (!Array.isArray(highlight)) return false;
        if (is2D) {
            return highlight.some(h => Array.isArray(h) && h[0] === r && h[1] === c);
        }
        return highlight.includes(c) && r === 0;
    };

    const isDependency = (r, c) => {
        if (!Array.isArray(dependencies)) return false;
        if (is2D) {
            return dependencies.some(d => Array.isArray(d) && d[0] === r && d[1] === c);
        }
        return dependencies.includes(c) && r === 0;
    };

    const isNewlyFilled = (r, c) => {
        if (!newCell) return false;
        if (is2D) {
            return Array.isArray(newCell) && newCell[0] === r && newCell[1] === c;
        }
        return newCell === c && r === 0;
    };

    const formatValue = (val) => {
        if (val === null || val === undefined) return '–';
        if (val === Infinity) return '∞';
        if (val === -Infinity) return '-∞';
        return String(val);
    };

    return (
        <div className="dp-display">
            <div className="dp-header">
                <span className="dp-icon">📈</span>
                <span className="dp-title">{label || 'DP Table'}</span>
                <span className="dp-dims">{is2D ? `${rows}×${cols}` : `Length: ${cols}`}</span>
            </div>

            <div className="dp-table-wrapper">
                <table className="dp-table">
                    <thead>
                        <tr>
                            {(rowLabels || is2D) && <th className="dp-corner">i\j</th>}
                            {(colLabels || table[0]).map((_, c) => (
                                <th key={c} className="dp-col-label">{colLabels?.[c] ?? c}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {table.map((row, r) => (
                            <tr key={r}>
                                {(rowLabels || is2D) && (
                                    <td className="dp-row-label">{rowLabels?.[r] ?? r}</td>
                                )}
                                {row.map((cell, c) => {
                                    const current = isCurrentCell(r, c);
                                    const highlighted = isHighlighted(r, c);
                                    const dep = isDependency(r, c);
                                    const newFill = isNewlyFilled(r, c);
                                    const isEmpty = cell === null || cell === undefined;

                                    return (
                                        <td
                                            key={c}
                                            className={`dp-cell ${current ? 'current' : ''} ${highlighted ? 'highlighted' : ''} ${dep ? 'dependency' : ''} ${newFill ? 'new-fill' : ''} ${isEmpty ? 'empty' : ''}`}
                                        >
                                            {formatValue(cell)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DPTableDisplay;
