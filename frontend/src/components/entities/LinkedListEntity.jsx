import React, { useState, useEffect, useRef } from 'react';
import './LinkedListEntity.css';

function LinkedListEntity({ id, data, meta, actions }) {
    const { label, pointers } = meta || {};
    const [animState, setAnimState] = useState({ swap: null, removing: [], inserting: null });
    const prevDataRef = useRef(null);

    useEffect(() => {
        const prevData = prevDataRef.current;

        if (prevData && data) {
            // Check for swap
            if (prevData.length === data.length) {
                const swapAction = actions?.find(a => a.type === 'swap');
                if (swapAction) {
                    setAnimState({ swap: [swapAction.from, swapAction.to], removing: [], inserting: null });
                    setTimeout(() => setAnimState({ swap: null, removing: [], inserting: null }), 500);
                }
            }

            // Check for removal
            if (data.length < prevData.length) {
                const removeAction = actions?.find(a => a.type === 'remove');
                if (removeAction?.indices) {
                    setAnimState({ swap: null, removing: removeAction.indices, inserting: null });
                    setTimeout(() => setAnimState({ swap: null, removing: [], inserting: null }), 500);
                }
            }

            // Check for insertion
            if (data.length > prevData.length) {
                setAnimState({ swap: null, removing: [], inserting: data.length - 1 });
                setTimeout(() => setAnimState({ swap: null, removing: [], inserting: null }), 400);
            }
        }

        prevDataRef.current = data ? [...data] : null;
    }, [JSON.stringify(data), JSON.stringify(actions)]);

    const displayData = animState.swap && prevDataRef.current ? prevDataRef.current : (data || []);

    if (!displayData || displayData.length === 0) {
        return (
            <div className="linked-list-entity">
                <div className="entity-header">
                    <span className="entity-icon">🔗</span>
                    <span className="entity-label">{label || 'Linked List'}</span>
                </div>
                <div className="entity-empty">Empty List</div>
            </div>
        );
    }

    const isSwapping = (idx) => animState.swap && animState.swap.includes(idx);
    const isRemoving = (idx) => animState.removing.includes(idx);
    const isInserting = (idx) => animState.inserting === idx;

    const getSwapTransform = (idx) => {
        if (!animState.swap || !animState.swap.includes(idx)) return '';
        const [i, j] = animState.swap;
        const distance = Math.abs(j - i) * 90;
        if (idx === i) return `translateX(${distance}px)`;
        if (idx === j) return `translateX(-${distance}px)`;
        return '';
    };

    const getPointerLabels = (idx) => {
        if (!pointers) return [];
        return Object.entries(pointers).filter(([, v]) => v === idx).map(([k]) => k);
    };

    return (
        <div className="linked-list-entity">
            <div className="entity-header">
                <span className="entity-icon">🔗</span>
                <span className="entity-label">{label || 'Linked List'}</span>
                <span className="entity-size">Length: {data?.length || 0}</span>
            </div>

            {animState.swap && (
                <div className="action-banner swap">🔄 Swapping positions {animState.swap[0]} ↔ {animState.swap[1]}</div>
            )}
            {animState.removing.length > 0 && (
                <div className="action-banner remove">❌ Removing node</div>
            )}
            {animState.inserting !== null && (
                <div className="action-banner insert">➕ Inserting node</div>
            )}

            <div className="ll-content">
                <div className="ll-head">HEAD →</div>

                {displayData.map((val, idx) => {
                    const ptrs = getPointerLabels(idx);
                    const isLast = idx === displayData.length - 1;

                    return (
                        <React.Fragment key={`${idx}-${val}`}>
                            <div
                                className={`ll-node-wrapper 
                  ${isSwapping(idx) ? 'swapping' : ''} 
                  ${isRemoving(idx) ? 'removing' : ''} 
                  ${isInserting(idx) ? 'inserting' : ''}`}
                                style={{
                                    transform: getSwapTransform(idx),
                                    transition: animState.swap ? 'transform 0.4s ease' : 'none',
                                    zIndex: isSwapping(idx) || isRemoving(idx) ? 10 : 1
                                }}
                            >
                                {ptrs.length > 0 && (
                                    <div className="ptr-labels">
                                        {ptrs.map(p => <span key={p} className={`ptr ${p}`}>{p}</span>)}
                                    </div>
                                )}
                                <div className={`ll-node ${isSwapping(idx) ? 'swap-active' : ''} ${isRemoving(idx) ? 'remove-active' : ''}`}>
                                    <div className="ll-value">{String(val)}</div>
                                    <div className="ll-next">{isLast ? '∅' : '→'}</div>
                                </div>
                                <div className="ll-idx">{idx}</div>
                            </div>
                            {!isLast && <div className="ll-arrow">→</div>}
                        </React.Fragment>
                    );
                })}

                <div className="ll-null">NULL</div>
            </div>
        </div>
    );
}

export default LinkedListEntity;
