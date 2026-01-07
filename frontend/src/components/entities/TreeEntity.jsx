import React, { useMemo, useState, useEffect } from 'react';
import './TreeEntity.css';

/**
 * TreeEntity - Renders tree data structures with SVG
 * Supports level-order array format [root, left, right, left.left, left.right, right.left, right.right, ...]
 */
function TreeEntity({ id, data, meta, actions }) {
    const { label, currentNode, highlight } = meta || {};
    const [animState, setAnimState] = useState({ visiting: null, visitedNodes: [] });

    // Parse tree data
    const treeData = useMemo(() => parseTreeData(data), [JSON.stringify(data)]);

    // Detect animations from meta
    useEffect(() => {
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

        setAnimState({ visiting: visitingNode, visitedNodes });
    }, [currentNode, JSON.stringify(highlight)]);

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
                    style={{ width: Math.min(width, 700), height: Math.min(height, 400) }}
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

                        return (
                            <g
                                key={`node-${idx}`}
                                className={`tree-node-group ${isVisiting ? 'visiting' : ''}`}
                            >
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={22}
                                    className={`tree-node ${node.isRoot ? 'root' : ''} ${isVisiting ? 'visiting' : ''}`}
                                />
                                <text
                                    x={node.x}
                                    y={node.y}
                                    className={`tree-node-text ${isVisiting ? 'highlighted' : ''}`}
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
 * Parse tree data from level-order array format
 * [4, 2, 6, 1, 3, 5, 7] represents:
 *        4
 *       / \
 *      2   6
 *     / \ / \
 *    1  3 5  7
 */
function parseTreeData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    // Build tree structure from level-order array
    const root = buildTreeFromLevelOrder(data);
    if (!root) return null;

    // Calculate layout
    return layoutTree(root);
}

/**
 * Build tree from level-order array (like LeetCode format)
 * Index 0 = root
 * For node at index i: left child at 2i+1, right child at 2i+2
 */
function buildTreeFromLevelOrder(arr) {
    if (!arr || arr.length === 0 || arr[0] === null) return null;

    const nodes = arr.map((val, idx) =>
        val !== null && val !== undefined
            ? { value: val, left: null, right: null, index: idx }
            : null
    );

    // Link parent-child relationships
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i] === null) continue;

        const leftIdx = 2 * i + 1;
        const rightIdx = 2 * i + 2;

        if (leftIdx < nodes.length && nodes[leftIdx]) {
            nodes[i].left = nodes[leftIdx];
        }
        if (rightIdx < nodes.length && nodes[rightIdx]) {
            nodes[i].right = nodes[rightIdx];
        }
    }

    return nodes[0];
}

/**
 * Layout tree with proper positioning
 */
function layoutTree(root) {
    if (!root) return { nodes: [], edges: [], width: 100, height: 100 };

    const nodes = [];
    const edges = [];

    // Calculate tree dimensions
    const depth = getTreeDepth(root);

    // Layout parameters
    const levelHeight = 80;
    const padding = 50;
    const minSeparation = 60; // Minimum horizontal distance between nodes

    // Width based on nodes at deepest level
    const maxNodesAtBottom = Math.pow(2, depth - 1);
    const baseWidth = Math.max(maxNodesAtBottom * minSeparation + padding * 2, 400);

    // Position nodes level by level
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
            edges.push({ x1: parentX, y1: parentY, x2: x, y2: y });
        }

        // Position children with proper separation
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
