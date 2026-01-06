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
    const prevDataRef = useRef(null);

    // Parse tree data - supports array format [root, left, right] or nested object format
    const treeData = useMemo(() => parseTreeData(data), [JSON.stringify(data)]);

    // Detect animations from actions and meta
    useEffect(() => {
        const visitAction = actions?.find(a => a.type === 'visit');
        const insertAction = actions?.find(a => a.type === 'insert');
        const removeAction = actions?.find(a => a.type === 'remove');
        const highlightAction = actions?.find(a => a.type === 'highlight');

        // Get visited node from multiple sources
        let visitingNode = null;
        let visitedNodes = [];

        // 1. From meta.currentNode (direct from step data)
        if (currentNode !== undefined && currentNode !== null) {
            visitingNode = currentNode;
        }

        // 2. From meta.highlight array
        if (highlight && Array.isArray(highlight) && highlight.length > 0) {
            visitedNodes = highlight;
            if (!visitingNode) visitingNode = highlight[highlight.length - 1];
        }

        // 3. From visit action
        if (visitAction) {
            visitingNode = visitAction.value;
            if (visitAction.path) visitedNodes = visitAction.path;
        }

        // 4. From highlight action
        if (highlightAction && highlightAction.indices) {
            visitedNodes = highlightAction.indices;
        }

        setAnimState(prev => ({
            ...prev,
            visiting: visitingNode,
            visitedNodes: visitedNodes
        }));

        if (insertAction) {
            setAnimState(prev => ({ ...prev, inserting: insertAction.value }));
            setTimeout(() => setAnimState(prev => ({ ...prev, inserting: null })), 500);
        }

        if (removeAction) {
            setAnimState(prev => ({ ...prev, removing: removeAction.value }));
            setTimeout(() => setAnimState(prev => ({ ...prev, removing: null })), 500);
        }

        prevDataRef.current = data;
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
                <div className="action-banner visit">👁️ Visiting node: {animState.visiting}</div>
            )}
            {animState.inserting !== null && (
                <div className="action-banner insert">➕ Inserting: {animState.inserting}</div>
            )}
            {animState.removing !== null && (
                <div className="action-banner remove">❌ Removing: {animState.removing}</div>
            )}

            <div className="tree-container">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="tree-svg"
                    style={{ width: Math.min(width, 700), height: Math.min(height, 400) }}
                >
                    {/* Draw edges first (behind nodes) */}
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
                        const isRoot = idx === 0;

                        return (
                            <g
                                key={`node-${idx}`}
                                className={`tree-node-group 
                  ${isVisiting ? 'visiting' : ''} 
                  ${isInserting ? 'inserting' : ''} 
                  ${isRemoving ? 'removing' : ''}`}
                            >
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={22}
                                    className={`tree-node ${isRoot ? 'root' : ''} ${isVisiting ? 'visiting' : ''} ${isInserting ? 'inserting' : ''} ${isRemoving ? 'removing' : ''}`}
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
 * Parse various tree data formats into nodes and edges
 * Supports:
 * - Array format: [1, 2, 3, 4, 5, null, 6] (level-order)
 * - Object format: { value: 1, children: [{value: 2}, {value: 3}] }
 */
function parseTreeData(data) {
    if (!data) return null;

    let nodes = [];
    let edges = [];

    if (Array.isArray(data)) {
        // Level-order array format (like LeetCode)
        nodes = buildNodesFromArray(data);
        edges = buildEdgesFromArray(data, nodes);
    } else if (typeof data === 'object' && data.value !== undefined) {
        // Nested object format
        const result = buildFromObject(data, 0, 0);
        nodes = result.nodes;
        edges = result.edges;
    }

    if (nodes.length === 0) return null;

    // Calculate layout
    const layout = calculateLayout(nodes.length);
    nodes = assignPositions(nodes, layout);

    return {
        nodes,
        edges: buildEdgesWithPositions(edges, nodes),
        width: layout.width,
        height: layout.height
    };
}

function buildNodesFromArray(arr) {
    return arr
        .map((val, idx) => ({ value: val, index: idx }))
        .filter(n => n.value !== null && n.value !== undefined);
}

function buildEdgesFromArray(arr, nodes) {
    const edges = [];
    const nodeMap = new Map(nodes.map(n => [n.index, n]));

    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === null || arr[i] === undefined) continue;

        const leftIdx = 2 * i + 1;
        const rightIdx = 2 * i + 2;

        if (leftIdx < arr.length && arr[leftIdx] !== null && arr[leftIdx] !== undefined) {
            edges.push({ from: i, to: leftIdx });
        }
        if (rightIdx < arr.length && arr[rightIdx] !== null && arr[rightIdx] !== undefined) {
            edges.push({ from: i, to: rightIdx });
        }
    }

    return edges;
}

function buildFromObject(node, depth, index) {
    if (!node) return { nodes: [], edges: [] };

    const nodes = [{ value: node.value, depth, index }];
    const edges = [];

    if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child, i) => {
            if (child) {
                const childResult = buildFromObject(child, depth + 1, nodes.length);
                edges.push({ from: 0, to: nodes.length });
                nodes.push(...childResult.nodes);
                edges.push(...childResult.edges);
            }
        });
    }

    if (node.left) {
        const leftResult = buildFromObject(node.left, depth + 1, nodes.length);
        edges.push({ from: 0, to: nodes.length });
        nodes.push(...leftResult.nodes);
        edges.push(...leftResult.edges);
    }

    if (node.right) {
        const rightResult = buildFromObject(node.right, depth + 1, nodes.length);
        edges.push({ from: 0, to: nodes.length });
        nodes.push(...rightResult.nodes);
        edges.push(...rightResult.edges);
    }

    return { nodes, edges };
}

function calculateLayout(nodeCount) {
    // Calculate tree dimensions based on node count
    const depth = Math.ceil(Math.log2(nodeCount + 1));
    const maxWidth = Math.pow(2, depth - 1);

    const nodeSpacingX = 60;
    const nodeSpacingY = 70;
    const padding = 50;

    return {
        depth,
        maxWidth,
        width: maxWidth * nodeSpacingX + padding * 2,
        height: depth * nodeSpacingY + padding * 2,
        nodeSpacingX,
        nodeSpacingY,
        padding
    };
}

function assignPositions(nodes, layout) {
    const { width, nodeSpacingY, padding } = layout;

    return nodes.map((node, idx) => {
        // Calculate level and position within level
        const level = Math.floor(Math.log2(idx + 1));
        const posInLevel = idx - (Math.pow(2, level) - 1);
        const nodesInLevel = Math.pow(2, level);

        // Calculate x position (centered)
        const levelWidth = width - padding * 2;
        const spacing = levelWidth / (nodesInLevel + 1);
        const x = padding + spacing * (posInLevel + 1);

        // Calculate y position
        const y = padding + level * nodeSpacingY;

        return { ...node, x, y, level };
    });
}

function buildEdgesWithPositions(edges, nodes) {
    const nodeMap = new Map(nodes.map((n, i) => [n.index !== undefined ? n.index : i, n]));

    return edges.map(edge => {
        const fromNode = nodeMap.get(edge.from) || nodes[edge.from];
        const toNode = nodeMap.get(edge.to) || nodes[edge.to];

        if (!fromNode || !toNode) return null;

        return {
            x1: fromNode.x,
            y1: fromNode.y,
            x2: toNode.x,
            y2: toNode.y
        };
    }).filter(Boolean);
}

export default TreeEntity;
