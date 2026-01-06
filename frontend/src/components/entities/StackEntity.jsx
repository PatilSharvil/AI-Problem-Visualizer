import React, { useState, useEffect, useRef } from 'react';
import './StackEntity.css';

function StackEntity({ id, data, meta, actions }) {
    const { label } = meta || {};
    const [animState, setAnimState] = useState({ pushing: null, popping: null });
    const prevDataRef = useRef(null);

    useEffect(() => {
        const prevData = prevDataRef.current;

        if (prevData && data) {
            // Detect push (data grew)
            if (data.length > prevData.length) {
                const newItem = data[data.length - 1];
                setAnimState({ pushing: data.length - 1, popping: null });
                setTimeout(() => setAnimState({ pushing: null, popping: null }), 400);
            }

            // Detect pop (data shrunk)
            if (data.length < prevData.length) {
                setAnimState({ pushing: null, popping: prevData.length - 1 });
                setTimeout(() => setAnimState({ pushing: null, popping: null }), 400);
            }
        }

        prevDataRef.current = data ? [...data] : null;
    }, [JSON.stringify(data)]);

    const displayData = data || [];

    return (
        <div className="stack-entity">
            <div className="entity-header">
                <span className="entity-icon">📚</span>
                <span className="entity-label">{label || 'Stack'}</span>
                <span className="entity-size">Size: {displayData.length}</span>
            </div>

            {animState.pushing !== null && (
                <div className="action-banner push">⬇️ PUSH</div>
            )}
            {animState.popping !== null && (
                <div className="action-banner pop">⬆️ POP</div>
            )}

            <div className="stack-content">
                <div className="stack-labels">
                    <div className="stack-top-label">TOP</div>
                </div>

                <div className="stack-container">
                    {displayData.length === 0 ? (
                        <div className="stack-empty">Empty Stack</div>
                    ) : (
                        [...displayData].reverse().map((val, displayIdx) => {
                            const actualIdx = displayData.length - 1 - displayIdx;
                            const isTop = actualIdx === displayData.length - 1;
                            const isPushing = animState.pushing === actualIdx;

                            return (
                                <div
                                    key={`${actualIdx}-${val}`}
                                    className={`stack-item ${isTop ? 'top' : ''} ${isPushing ? 'pushing' : ''}`}
                                >
                                    <span className="stack-value">{String(val)}</span>
                                    <span className="stack-idx">[{actualIdx}]</span>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="stack-labels">
                    <div className="stack-bottom-label">BOTTOM</div>
                </div>
            </div>
        </div>
    );
}

export default StackEntity;
