import React from 'react';
import ArrayEntity from './entities/ArrayEntity';
import TreeEntity from './entities/TreeEntity';
import LinkedListEntity from './entities/LinkedListEntity';
import StackEntity from './entities/StackEntity';
import QueueEntity from './entities/QueueEntity';
import DPTableEntity from './entities/DPTableEntity';
import MatrixEntity from './entities/MatrixEntity';
import './VisualCanvas.css';

/**
 * VisualCanvas - Renders entities from the existing backend format
 * This component bridges the new reference UI with the existing entity renderers
 */
const VisualCanvas = ({ frame }) => {
    if (!frame) return null;

    // Use frame.entities from existing backend format
    const entities = frame.entities || [];

    // If no entities but have array data directly on frame
    if (entities.length === 0 && frame.array) {
        entities.push({
            id: 'arr',
            type: 'array',
            data: frame.array,
            meta: {
                label: 'Array',
                pointers: frame.pointers,
                highlight: frame.highlight
            }
        });
    }

    return (
        <div className="visual-canvas-container">
            {/* Entities Grid - vertical layout for better space use */}
            <div className="visual-canvas-content">
                {entities.map((entity, index) => {
                    const { id, type, data, meta } = entity;
                    const actions = frame.actions || [];

                    // Determine action banner based on actions
                    let actionBanner = null;
                    if (actions && actions.length > 0) {
                        const swapAction = actions.find(a => a.type === 'swap');
                        const insertAction = actions.find(a => a.type === 'insert');
                        const removeAction = actions.find(a => a.type === 'remove');

                        if (swapAction) {
                            actionBanner = `🔄 Swapping [${swapAction.from}] ↔ [${swapAction.to}]`;
                        } else if (insertAction) {
                            actionBanner = `➕ Inserted at [${insertAction.indices?.[0] || 'end'}]`;
                        } else if (removeAction) {
                            actionBanner = `➖ Removed from [${removeAction.indices?.[0] || 'start'}]`;
                        }
                    }

                    switch (type) {
                        case 'array':
                            return (
                                <div key={id || index} className="entity-card">
                                    {actionBanner && (
                                        <div className={`action-banner ${actionBanner.includes('Swap') ? 'swap' : actionBanner.includes('Insert') ? 'insert' : 'remove'}`}>
                                            {actionBanner}
                                        </div>
                                    )}
                                    <div className="entity-card-header">
                                        <span className="entity-card-icon">📊</span>
                                        <span className="entity-card-label">{meta?.label || 'Array'}</span>
                                        <span className="entity-card-size">Length: {data?.length || 0}</span>
                                    </div>
                                    <div className="entity-card-content">
                                        <ArrayEntity
                                            id={id}
                                            data={data}
                                            meta={meta}
                                            actions={actions}
                                            className="array-entity-dark"
                                        />
                                    </div>
                                </div>
                            );
                        case 'tree':
                            return (
                                <div key={id || index} className="entity-card">
                                    <div className="entity-card-header">
                                        <span className="entity-card-icon">🌳</span>
                                        <span className="entity-card-label">{meta?.label || 'Tree'}</span>
                                        <span className="entity-card-size">Nodes: {Array.isArray(data) ? data.filter(n => n !== null && n !== undefined).length : 0}</span>
                                    </div>
                                    <div className="entity-card-content">
                                        <TreeEntity
                                            id={id}
                                            data={data}
                                            meta={meta}
                                            actions={actions}
                                            className="array-entity-dark"
                                        />
                                    </div>
                                </div>
                            );
                        case 'linked_list':
                            return (
                                <div key={id || index} className="entity-card">
                                    <div className="entity-card-header">
                                        <span className="entity-card-icon">🔗</span>
                                        <span className="entity-card-label">{meta?.label || 'Linked List'}</span>
                                        <span className="entity-card-size">Length: {Array.isArray(data) ? data.length : 0}</span>
                                    </div>
                                    <div className="entity-card-content">
                                        <LinkedListEntity
                                            id={id}
                                            data={data}
                                            meta={meta}
                                            actions={actions}
                                        />
                                    </div>
                                </div>
                            );
                        case 'stack':
                            return (
                                <div key={id || index} className="entity-card">
                                    <div className="entity-card-header">
                                        <span className="entity-card-icon">📦</span>
                                        <span className="entity-card-label">{meta?.label || 'Stack'}</span>
                                        <span className="entity-card-size">Size: {Array.isArray(data) ? data.length : 0}</span>
                                    </div>
                                    <div className="entity-card-content">
                                        <StackEntity
                                            id={id}
                                            data={data}
                                            meta={meta}
                                            actions={actions}
                                        />
                                    </div>
                                </div>
                            );
                        case 'queue':
                            return (
                                <div key={id || index} className="entity-card">
                                    <div className="entity-card-header">
                                        <span className="entity-card-icon">📥📤</span>
                                        <span className="entity-card-label">{meta?.label || 'Queue'}</span>
                                        <span className="entity-card-size">Size: {Array.isArray(data) ? data.length : 0}</span>
                                    </div>
                                    <div className="entity-card-content">
                                        <QueueEntity
                                            id={id}
                                            data={data}
                                            meta={meta}
                                            actions={actions}
                                        />
                                    </div>
                                </div>
                            );
                        case 'dp_table':
                            return (
                                <div key={id || index} className="entity-card">
                                    <div className="entity-card-header">
                                        <span className="entity-card-icon">📋</span>
                                        <span className="entity-card-label">{meta?.label || 'DP Table'}</span>
                                        <span className="entity-card-size">Size: {Array.isArray(data) ? data.length : 0}</span>
                                    </div>
                                    <div className="entity-card-content">
                                        <DPTableEntity
                                            id={id}
                                            data={data}
                                            meta={meta}
                                            actions={actions}
                                        />
                                    </div>
                                </div>
                            );
                        case 'matrix':
                            return (
                                <div key={id || index} className="entity-card">
                                    <div className="entity-card-header">
                                        <span className="entity-card-icon">🔢</span>
                                        <span className="entity-card-label">{meta?.label || 'Matrix'}</span>
                                        <span className="entity-card-size">Size: {Array.isArray(data) ? `${data.length}×${Array.isArray(data[0]) ? data[0].length : 0}` : 'N/A'}</span>
                                    </div>
                                    <div className="entity-card-content">
                                        <MatrixEntity
                                            id={id}
                                            data={data}
                                            meta={meta}
                                            actions={actions}
                                        />
                                    </div>
                                </div>
                            );
                        default:
                            console.warn(`Unknown entity type: ${type}`);
                            return null;
                    }
                })}
            </div>
        </div>
    );
};

export default VisualCanvas;
