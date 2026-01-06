import React, { Component } from 'react';
import ArrayEntity from './entities/ArrayEntity';
import LinkedListEntity from './entities/LinkedListEntity';
import DPTableEntity from './entities/DPTableEntity';
import StackEntity from './entities/StackEntity';
import QueueEntity from './entities/QueueEntity';
import MatrixEntity from './entities/MatrixEntity';
import TreeEntity from './entities/TreeEntity';
import './EntityRenderer.css';

/**
 * Error boundary to prevent white screen crashes
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('EntityRenderer error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="entity-error">
                    <span>⚠️ Failed to render: {this.props.entityType || 'entity'}</span>
                </div>
            );
        }
        return this.props.children;
    }
}

/**
 * Universal entity renderer - maps entity types to components
 */
function EntityRenderer({ entity, actions }) {
    if (!entity) return null;

    // Filter actions for this entity
    const entityActions = actions?.filter(a => a.target === entity.id) || [];

    const props = {
        id: entity.id,
        data: entity.data || [],
        meta: entity.meta || {},
        actions: entityActions
    };

    const renderEntity = () => {
        switch (entity.type) {
            case 'array':
                return <ArrayEntity {...props} />;
            case 'linked_list':
                return <LinkedListEntity {...props} />;
            case 'dp_table':
                return <DPTableEntity {...props} />;
            case 'stack':
                return <StackEntity {...props} />;
            case 'queue':
                return <QueueEntity {...props} />;
            case 'matrix':
                return <MatrixEntity {...props} />;
            case 'tree':
                return <TreeEntity {...props} />;
            default:
                return <ArrayEntity {...props} />;
        }
    };

    return (
        <ErrorBoundary entityType={entity.type}>
            <div className="entity-wrapper">
                {renderEntity()}
            </div>
        </ErrorBoundary>
    );
}

export default EntityRenderer;
