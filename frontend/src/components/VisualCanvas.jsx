import React from 'react';
import ArrayEntity from './entities/ArrayEntity';
import TreeEntity from './entities/TreeEntity';
import LinkedListEntity from './entities/LinkedListEntity';
import StackEntity from './entities/StackEntity';
import QueueEntity from './entities/QueueEntity';
import DPTableEntity from './entities/DPTableEntity';
import MatrixEntity from './entities/MatrixEntity';

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
        <div className="relative w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface via-background to-background p-6 overflow-auto">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Entities Grid */}
            <div className="relative z-10 flex flex-wrap gap-6 justify-center items-start">
                {entities.map((entity, index) => {
                    const { id, type, data, meta } = entity;
                    const actions = frame.actions || [];

                    switch (type) {
                        case 'array':
                            return (
                                <div key={id || index} className="bg-surface/50 backdrop-blur border border-white/10 rounded-xl p-4 shadow-xl">
                                    <ArrayEntity
                                        id={id}
                                        data={data}
                                        meta={meta}
                                        actions={actions}
                                    />
                                </div>
                            );
                        case 'tree':
                            return (
                                <div key={id || index} className="bg-surface/50 backdrop-blur border border-white/10 rounded-xl p-4 shadow-xl min-w-[400px]">
                                    <TreeEntity
                                        id={id}
                                        data={data}
                                        meta={meta}
                                        actions={actions}
                                    />
                                </div>
                            );
                        case 'linked_list':
                            return (
                                <div key={id || index} className="bg-surface/50 backdrop-blur border border-white/10 rounded-xl p-4 shadow-xl">
                                    <LinkedListEntity
                                        id={id}
                                        data={data}
                                        meta={meta}
                                        actions={actions}
                                    />
                                </div>
                            );
                        case 'stack':
                            return (
                                <div key={id || index} className="bg-surface/50 backdrop-blur border border-white/10 rounded-xl p-4 shadow-xl">
                                    <StackEntity
                                        id={id}
                                        data={data}
                                        meta={meta}
                                        actions={actions}
                                    />
                                </div>
                            );
                        case 'queue':
                            return (
                                <div key={id || index} className="bg-surface/50 backdrop-blur border border-white/10 rounded-xl p-4 shadow-xl">
                                    <QueueEntity
                                        id={id}
                                        data={data}
                                        meta={meta}
                                        actions={actions}
                                    />
                                </div>
                            );
                        case 'dp_table':
                            return (
                                <div key={id || index} className="bg-surface/50 backdrop-blur border border-white/10 rounded-xl p-4 shadow-xl">
                                    <DPTableEntity
                                        id={id}
                                        data={data}
                                        meta={meta}
                                        actions={actions}
                                    />
                                </div>
                            );
                        case 'matrix':
                            return (
                                <div key={id || index} className="bg-surface/50 backdrop-blur border border-white/10 rounded-xl p-4 shadow-xl">
                                    <MatrixEntity
                                        id={id}
                                        data={data}
                                        meta={meta}
                                        actions={actions}
                                    />
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
