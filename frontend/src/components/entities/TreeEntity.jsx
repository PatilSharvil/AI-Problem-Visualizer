import React, { useMemo, useState, useEffect, useRef } from 'react';
import './TreeEntity.css';

/**
 * TreeEntity - Renders tree data structures with SVG
 * Supports: binary trees, n-ary trees, BST
 * Actions: visit, insert, remove, search
 */
function TreeEntity({ id, data, meta, actions }) {
    const { label, currentNode, highlight } = meta || {};
    const [animState, setAnimState] = useState({ visiting: null, inserting: null, removing: null, visitedNodes: [] });

    // Parse tree data - supports array format or nested object format
    const treeData = useMemo(() => parseTreeData(data), [JSON.stringify(data)]);

    // Detect animations from actions and meta
    useEffect(() => {
        const visitAction = actions?.find(a => a.type === 'visit');
        const insertAction = actions?.find(a => a.type === 'insert');
        const removeAction = actions?.find(a => a.type === 'remove');

        let visitingNode = null;
        let visitedNodes = [];

        // From meta.currentNode
        if (currentNode !== undefined && currentNode !== null) {
            visitingNode = currentNode;
        }

        // From meta.highlight array
        if (highlight && Array.isArray(highlight) && highlight.length > 0) {
            visitedNodes = highlight;
            if (!visitingNode) visitingNode = highlight[highlight.length - 1];
        }

        // From visit action
        if (visitAction) {
            visitingNode = visitAction.value;
            if (visitAction.path) visitedNodes = visitAction.path;
        }

        setAnimState(prev => ({
            ...prev,
            visiting: visitingNode,
            visitedNodes: visitedNodes,
            inserting: insertAction?.value || null,
            removing: removeAction?.value || null
        }));
    }, [JSON.stringify(actions), JSON.stringify(data), currentNode, JSON.stringify(highlight)]);

    if (!treeData || treeData.nodes.length === 0) {
        return (
            <div className="tree-entity">
                <div className="entity-header">
                    <span className="entity-icon">🌳</span>
                    <span className="entity-label">{label || 'Tree'}</span>
                </div>
                <div className="entity-empty">Empty Tree</div>
            </div>
        );
    }

    const { nodes, edges, width, height } = treeData;

    return (
        <div className="tree-entity">
            <div className="entity-header">
                <span className="entity-icon">🌳</span>
                <span className="entity-label">{label || 'Tree'}</span>
                <span className="entity-size">Nodes: {nodes.length}</span>
            </div>

            {animState.visiting !== null && (
                <div className="action-banner">● Visiting node: {animState.visiting}</div>
            )}

            <div className="tree-container">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="tree-svg"
                    style={{ width: Math.min(width, 600), height: Math.min(height, 350) }}
                >
                    {/* Draw edges */}
                    {edges.map((edge, idx) => (
                        <line
                            key={`edge-${idx}`}
                            x1={edge.x1}
                            y1={edge.y1}
                            x2={edge.x2}
                            y2={edge.y2}
                            className="tree-edge"
                        />
                    ))}

                    {/* Draw nodes */}
                    {nodes.map((node, idx) => {
                        const isVisiting = animState.visiting === node.value || animState.visitedNodes.includes(node.value);
                        const isInserting = animState.inserting === node.value;
                        const isRemoving = animState.removing === node.value;

                        return (
                            <g
                                key={`node-${idx}`}
                                className={`tree-node-group ${isVisiting ? 'visiting' : ''} ${isInserting ? 'inserting' : ''} ${isRemoving ? 'removing' : ''}`}
                            >
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={20}
                                    className={`tree-node ${node.isRoot ? 'root' : ''}`}
                                />
                                <text
                                    x={node.x}
                                    y={node.y}
                                    className="tree-node-text"
                                    dy="0.35em"
                                >
                                    {node.value}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

/**
 * Parse tree data - builds proper BST structure for visualization
 */
function parseTreeData(data) {
    if (!data || (Array.isArray(data) && data.length === 0)) return null;

    // Build BST from array of values
    if (Array.isArray(data)) {
        // Filter out nulls and build BST
        const values = data.filter(v => v !== null && v !== undefined);
        if (values.length === 0) return null;

        // Build BST structure
        const root = buildBST(values);
        if (!root) return null;

        // Assign positions using proper tree layout
        const { nodes, edges, width, height } = layoutTree(root);
        return { nodes, edges, width, height };
    }

    // Handle object format
    if (typeof data === 'object' && data.value !== undefined) {
        const { nodes, edges, width, height } = layoutTree(data);
        return { nodes, edges, width, height };
    }

    return null;
}

/**
 * Build BST from array of values
 */
function buildBST(values) {
    if (values.length === 0) return null;

    let root = null;

    for (const val of values) {
        root = insertIntoBST(root, val);
    }

    return root;
}

function insertIntoBST(node, value) {
    if (node === null) {
        return { value, left: null, right: null };
    }

    if (value < node.value) {
        node.left = insertIntoBST(node.left, value);
    } else {
        node.right = insertIntoBST(node.right, value);
    }

    return node;
}

/**
 * Layout tree with proper positioning
 */
function layoutTree(root) {
    if (!root) return { nodes: [], edges: [], width: 100, height: 100 };

    const nodes = [];
    const edges = [];

    // Calculate tree depth
    const depth = getTreeDepth(root);

    // Layout parameters
    const nodeRadius = 20;
    const levelHeight = 70;
    const padding = 40;

    // Width based on max nodes at deepest level
    const maxWidth = Math.pow(2, depth - 1);
    const baseWidth = Math.max(maxWidth * 50, 200);

    // Position nodes using recursive DFS
    function positionNode(node, level, leftBound, rightBound, parentX, parentY) {
        if (!node) return;

        const x = (leftBound + rightBound) / 2;
        const y = padding + level * levelHeight;

        nodes.push({
            value: node.value,
            x,
            y,
            isRoot: level === 0
        });

        // Add edge from parent
        if (parentX !== null && parentY !== null) {
            edges.push({
                x1: parentX,
                y1: parentY,
                x2: x,
                y2: y
            });
        }

        // Position children
        const mid = (leftBound + rightBound) / 2;
        positionNode(node.left, level + 1, leftBound, mid, x, y);
        positionNode(node.right, level + 1, mid, rightBound, x, y);
    }

    positionNode(root, 0, padding, baseWidth - padding, null, null);

    return {
        nodes,
        edges,
        width: baseWidth,
        height: padding + depth * levelHeight + padding
    };
}

function getTreeDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
}

export default TreeEntity;
