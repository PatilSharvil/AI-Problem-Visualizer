import React from 'react';
import './HashMapDisplay.css';

function HashMapDisplay({ data }) {
    if (!data || Object.keys(data).length === 0) {
        return null;
    }

    const entries = Object.entries(data);

    return (
        <div className="hashmap-display">
            <div className="hashmap-title">HashMap / Frequency</div>
            <table className="hashmap-table">
                <thead>
                    <tr>
                        <th>Key</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map(([key, value]) => (
                        <tr key={key}>
                            <td className="key-cell">{key}</td>
                            <td className="value-cell">{String(value)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default HashMapDisplay;
