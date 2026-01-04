import React from 'react';
import './DPTableDisplay.css';

function DPTableDisplay({ data, currentCell, highlight, rowLabels, colLabels, label }) {
    // data can be 1D or 2D array
    const is2D = Array.isArray(data) && Array.isArray(data[0]);
    const table = is2D ? data : (Array.isArray(data) ? [data] : []);

    if (table.length === 0) {
        return (
            <div className="dp-display">
                <div className="dp-label">{label || 'DP Table'}</div>
                <div className="dp-empty">No DP data</div>
            </div>
        );
    }

    const rows = table.length;
    const cols = table[0]?.length || 0;

    const isCurrentCell = (r, c) => {
        if (!currentCell) return false;
        if (is2D) {
            return currentCell[0] === r && currentCell[1] === c;
        }
        return currentCell === c && r === 0;
    };

    const isHighlighted = (r, c) => {
        if (!Array.isArray(highlight)) return false;
        if (is2D) {
            return highlight.some(h => h[0] === r && h[1] === c);
        }
        return highlight.includes(c) && r === 0;
    };

    return (
        <div className="dp-display">
            <div className="dp-header">
                <span className="dp-title">📊 {label || 'DP Table'}</span>
                <span className="dp-info">{is2D ? `${rows}×${cols}` : `1×${cols}`}</span>
            </div>

            <div className="dp-table-wrapper">
                <table className="dp-table">
                    {/* Column labels */}
                    {colLabels && (
                        <thead>
                            <tr>
                                {rowLabels && <th className="dp-corner"></th>}
                                {colLabels.map((label, c) => (
                                    <th key={c} className="dp-col-label">{label}</th>
                                ))}
                            </tr>
                        </thead>
                    )}

                    {/* Index row if no labels */}
                    {!colLabels && (
                        <thead>
                            <tr>
                                {rowLabels && <th className="dp-corner"></th>}
                                {table[0].map((_, c) => (
                                    <th key={c} className="dp-col-label">{c}</th>
                                ))}
                            </tr>
                        </thead>
                    )}

                    <tbody>
                        {table.map((row, r) => (
                            <tr key={r}>
                                {rowLabels && (
                                    <td className="dp-row-label">{rowLabels[r] ?? r}</td>
                                )}
                                {!rowLabels && is2D && (
                                    <td className="dp-row-label">{r}</td>
                                )}
                                {row.map((cell, c) => {
                                    const current = isCurrentCell(r, c);
                                    const highlighted = isHighlighted(r, c);

                                    return (
                                        <td
                                            key={c}
                                            className={`dp-cell ${current ? 'current' : ''} ${highlighted ? 'highlighted' : ''}`}
                                        >
                                            {cell === null || cell === undefined ? '-' : String(cell)}
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
