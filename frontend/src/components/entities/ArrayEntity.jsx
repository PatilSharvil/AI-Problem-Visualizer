import React, { useState, useEffect, useRef } from 'react';
import './ArrayEntity.css';

/**
 * Universal Array Entity - renders array with action-based animations
 */
function ArrayEntity({ id, data, meta, actions, className }) {
    const { label, pointers, highlight } = meta || {};
    const [animState, setAnimState] = useState({ swap: null, removing: [], inserting: null });
    const prevDataRef = useRef(null);

    // Detect and animate changes
    useEffect(() => {
        const prevData = prevDataRef.current;

        if (prevData && data && prevData.length === data.length) {
            // Check for swap from actions
            const swapAction = actions?.find(a => a.type === 'swap');
            if (swapAction) {
                setAnimState({ swap: [swapAction.from, swapAction.to], removing: [], inserting: null });
                setTimeout(() => setAnimState({ swap: null, removing: [], inserting: null }), 500);
            } else {
                // Detect swap by comparing arrays
                const changed = [];
                for (let i = 0; i < prevData.length; i++) {
                    if (String(prevData[i]) !== String(data[i])) changed.push(i);
                }
                if (changed.length === 2) {
                    const [i, j] = changed;
                    if (String(prevData[i]) === String(data[j]) && String(prevData[j]) === String(data[i])) {
                        setAnimState({ swap: [i, j], removing: [], inserting: null });
                        setTimeout(() => setAnimState({ swap: null, removing: [], inserting: null }), 500);
                    }
                }
            }
        }

        if (prevData && data && data.length > prevData.length) {
            setAnimState({ swap: null, removing: [], inserting: data.length - 1 });
            setTimeout(() => setAnimState({ swap: null, removing: [], inserting: null }), 400);
        }

        if (prevData && data && data.length < prevData.length) {
            const removeAction = actions?.find(a => a.type === 'remove');
            if (removeAction?.indices) {
                setAnimState({ swap: null, removing: removeAction.indices, inserting: null });
                setTimeout(() => setAnimState({ swap: null, removing: [], inserting: null }), 500);
            }
        }

        prevDataRef.current = data ? [...data] : null;
    }, [JSON.stringify(data), JSON.stringify(actions)]);

    // Use previous data during swap animation for visual effect
    const displayData = animState.swap && prevDataRef.current ? prevDataRef.current : (data || []);

    if (!displayData || displayData.length === 0) {
        return (
            <div className={`array-entity ${className || ''}`}>
                <div className="entity-header">
                    <span className="entity-icon">📊</span>
                    <span className="entity-label">{label || 'Array'}</span>
                    <span className="entity-size">Length: 0</span>
                </div>
                <div className="entity-empty">Empty</div>
            </div>
        );
    }

    const isHighlighted = (idx) => Array.isArray(highlight) && highlight.includes(idx);
    const isSwapping = (idx) => animState.swap && animState.swap.includes(idx);
    const isRemoving = (idx) => animState.removing.includes(idx);
    const isInserting = (idx) => animState.inserting === idx;

    const getSwapTransform = (idx) => {
        if (!animState.swap || !animState.swap.includes(idx)) return '';
        const [i, j] = animState.swap;
        const distance = Math.abs(j - i) * 58;
        if (idx === i) return `translateX(${distance}px)`;
        if (idx === j) return `translateX(-${distance}px)`;
        return '';
    };

    const getPointerLabels = (idx) => {
        if (!pointers) return [];
        return Object.entries(pointers)
            .filter(([k, v]) => v === idx)
            .map(([k]) => k);
    };

    return (
        <div className={`array-entity ${className || ''}`}>
            <div className="entity-header">
                <span className="entity-icon">📊</span>
                <span className="entity-label">{label || 'Array'}</span>
                <span className="entity-size">Length: {data?.length || 0}</span>
            </div>

            {animState.swap && (
                <div className="action-banner swap">🔄 Swapping [{animState.swap[0]}] ↔ [{animState.swap[1]}]</div>
            )}
            {animState.inserting !== null && (
                <div className="action-banner insert">➕ Inserted at [{animState.inserting}]</div>
            )}

            <div className="entity-content">
                {displayData.map((val, idx) => {
                    const ptrs = getPointerLabels(idx);
                    return (
                        <div
                            key={`${idx}-${animState.swap ? 'swap' : 'normal'}`}
                            className={`array-box-wrapper
                ${isSwapping(idx) ? 'swapping' : ''}
                ${isRemoving(idx) ? 'removing' : ''}
                ${isInserting(idx) ? 'inserting' : ''}`}
                            style={{
                                transform: getSwapTransform(idx),
                                transition: animState.swap ? 'transform 0.4s ease' : 'none',
                                zIndex: isSwapping(idx) ? 10 : 1
                            }}
                        >
                            {ptrs.length > 0 && (
                                <div className="pointer-labels">
                                    {ptrs.map(p => <span key={p} className={`ptr ${p}`}>{p}</span>)}
                                </div>
                            )}
                            <div className={`array-box
                ${isHighlighted(idx) ? 'highlighted' : ''}
                ${isSwapping(idx) ? 'swap-active' : ''}`}>
                                {val === null || val === undefined ? '–' : String(val)}
                            </div>
                            <div className="box-index">{idx}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ArrayEntity;
