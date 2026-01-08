import React, { useMemo, useState, useEffect, useRef } from 'react';
import './TreeEntity.css';

/**
 * TreeEntity - Complete Tree Visualization Component
 *
 * Implements smooth, clean animations similar to VisuAlgo
 * - Subtle highlighting for current operations
 * - Smooth transitions between states
 * - Clean, educational-focused visualization
 * - Animated path highlighting from root to target node
 *
 * Supports all tree visualization primitives:
 * - nodes: Display tree nodes with values
 * - edges: Connect parent-child nodes
 * - currentNode: Highlight currently processing node
 * - visitedNodes: Track visited nodes with color
 * - path: Highlight path from root to target (for search)
 * - highlightedEdges: Highlight specific edges
 * - level: Show level indicators for BFS
 * - subtreeRoot: Highlight entire subtree
 *
 * Operations: visit, insert, remove, search, traverse
 */
function TreeEntity({ id, data, meta, actions, className }) {
    const {
        label,
        currentNode,
        highlight,
        path,              // NEW: path from root to target
        highlightedEdges,  // NEW: specific edges to highlight
        subtreeRoot,       // NEW: highlight subtree from this node
        showLevels         // NEW: show level numbers
    } = meta || {};

    const [animState, setAnimState] = useState({
        visiting: null,
        inserting: null,
        removing: null,
        visitedNodes: [],
        pathNodes: [],      // NEW: nodes on the path
        foundNode: null,    // NEW: final found node in search
        pathProgress: 0     // NEW: progress of path animation (0 to 1)
    });

    const pathAnimationRef = useRef(null);
    const prevPathNodesRef = useRef([]);

    // Parse tree data
    const treeData = useMemo(() => parseTreeData(data), [JSON.stringify(data)]);

    // Detect animations from actions and meta
    useEffect(() => {
        const visitAction = actions?.find(a => a.type === 'visit');
        const insertAction = actions?.find(a => a.type === 'insert');
        const removeAction = actions?.find(a => a.type === 'remove');
        const searchAction = actions?.find(a => a.type === 'search');
        const foundAction = actions?.find(a => a.type === 'found');

        let visitingNode = null;
        let visitedNodes = [];
        let pathNodes = [];
        let foundNode = null;

        // From meta.currentNode
        if (currentNode !== undefined && currentNode !== null) {
            visitingNode = currentNode;
        }

        // From meta.highlight array
        if (highlight && Array.isArray(highlight) && highlight.length > 0) {
            visitedNodes = highlight;
            if (!visitingNode) visitingNode = highlight[highlight.length - 1];
        }

        // From meta.path (for search operations)
        if (path && Array.isArray(path)) {
            pathNodes = path;
            if (!visitingNode && path.length > 0) {
                visitingNode = path[path.length - 1];
            }
        }

        // From actions
        if (visitAction) {
            visitingNode = visitAction.value;
            if (visitAction.path) pathNodes = visitAction.path;
        }

        if (searchAction) {
            if (searchAction.path) pathNodes = searchAction.path;
        }

        if (foundAction) {
            foundNode = foundAction.value;
        }

        // Reset path animation when path changes
        if (JSON.stringify(prevPathNodesRef.current) !== JSON.stringify(pathNodes)) {
            prevPathNodesRef.current = pathNodes;
            setAnimState(prev => ({
                ...prev,
                visiting: visitingNode,
                visitedNodes: visitedNodes,
                pathNodes: pathNodes,
                inserting: insertAction?.value || null,
                removing: removeAction?.value || null,
                foundNode: foundNode,
                pathProgress: 0  // Reset animation progress
            }));

            // Start path animation
            if (pathNodes.length > 0) {
                if (pathAnimationRef.current) {
                    clearTimeout(pathAnimationRef.current);
                }

                // Animate path progress with VisuAlgo-like speed (slower and more educational)
                const totalDuration = pathNodes.length * 600; // 600ms per node for clear visualization
                const steps = pathNodes.length * 6; // More steps for smoother animation (6 per node)
                const stepDuration = totalDuration / steps;

                let step = 0;
                const animateStep = () => {
                    step++;
                    const progress = Math.min(step / steps, 1);
                    setAnimState(prev => ({
                        ...prev,
                        pathProgress: progress
                    }));

                    if (step < steps) {
                        pathAnimationRef.current = setTimeout(animateStep, stepDuration);
                    }
                };

                pathAnimationRef.current = setTimeout(animateStep, stepDuration);
            }
        } else {
            // Just update other states without resetting path
            setAnimState(prev => ({
                ...prev,
                visiting: visitingNode,
                visitedNodes: visitedNodes,
                inserting: insertAction?.value || null,
                removing: removeAction?.value || null,
                foundNode: foundNode
            }));
        }

        // Cleanup on unmount
        return () => {
            if (pathAnimationRef.current) {
                clearTimeout(pathAnimationRef.current);
            }
        };
    }, [JSON.stringify(actions), JSON.stringify(data), currentNode, JSON.stringify(highlight), JSON.stringify(path)]);

    if (!treeData || treeData.nodes.length === 0) {
        return (
            <div className={`tree-entity ${className || ''}`}>
                <div className="entity-header">
                    <span className="entity-icon">🌳</span>
                    <span className="entity-label">{label || 'Tree'}</span>
                </div>
                <div className="entity-empty">Empty Tree</div>
            </div>
        );
    }

    const { nodes, edges, width, height, levels } = treeData;

    // Check if an edge is on the path
    const isEdgeOnPath = (edge) => {
        const pathNodes = animState.pathNodes;
        if (!pathNodes || pathNodes.length < 2) return false;

        for (let i = 0; i < pathNodes.length - 1; i++) {
            if ((edge.fromValue === pathNodes[i] && edge.toValue === pathNodes[i + 1]) ||
                (edge.fromValue === pathNodes[i + 1] && edge.toValue === pathNodes[i])) {
                return true;
            }
        }
        return false;
    };

    // Check if an edge should be highlighted based on animation progress
    const isEdgeHighlighted = (edge) => {
        if (highlightedEdges) {
            return highlightedEdges.some(([from, to]) =>
                (edge.fromValue === from && edge.toValue === to) ||
                (edge.fromValue === to && edge.toValue === from)
            );
        }

        // Check if this edge is on the animated path
        const pathNodes = animState.pathNodes;
        if (!pathNodes || pathNodes.length < 2) return false;

        // Find the position of this edge in the path
        for (let i = 0; i < pathNodes.length - 1; i++) {
            if ((edge.fromValue === pathNodes[i] && edge.toValue === pathNodes[i + 1]) ||
                (edge.fromValue === pathNodes[i + 1] && edge.toValue === pathNodes[i])) {

                // Calculate what portion of the path should be highlighted based on progress
                const edgeIndex = i;
                const totalEdges = pathNodes.length - 1;
                const edgeProgressThreshold = edgeIndex / totalEdges;

                return animState.pathProgress >= edgeProgressThreshold;
            }
        }

        return false;
    };

    // Get node state class
    const getNodeClass = (node) => {
        const classes = ['tree-node'];

        if (node.isRoot) classes.push('root');

        // Current visiting node (highest priority for color)
        if (animState.visiting === node.value) {
            classes.push('visiting');
        }
        // On the search path (highlighted based on animation progress)
        else if (animState.pathNodes.includes(node.value)) {
            // Calculate if this node should be highlighted based on progress
            const nodeIndexInPath = animState.pathNodes.indexOf(node.value);
            if (nodeIndexInPath >= 0) {
                const totalNodes = animState.pathNodes.length;
                const nodeProgressThreshold = nodeIndexInPath / totalNodes;

                if (animState.pathProgress >= nodeProgressThreshold) {
                    classes.push('in-path');
                }
            }
        }
        // Already visited
        else if (animState.visitedNodes.includes(node.value)) {
            classes.push('visited');
        }

        // Special states
        if (animState.inserting === node.value) classes.push('inserting');
        if (animState.removing === node.value) classes.push('removing');
        if (animState.foundNode === node.value) classes.push('found');

        // Part of highlighted subtree
        if (subtreeRoot && isInSubtree(node, subtreeRoot, nodes)) {
            classes.push('in-subtree');
        }

        return classes.join(' ');
    };

    return (
        <div className={`tree-entity ${className || ''}`}>
            <div className="entity-header">
                <span className="entity-icon">🌳</span>
                <span className="entity-label">{label || 'Tree'}</span>
                <span className="entity-size">Nodes: {nodes.length}</span>
            </div>

            {/* Status Banner */}
            {animState.visiting !== null && (
                <div className={`action-banner ${animState.foundNode ? 'found' : ''}`}>
                    {animState.foundNode
                        ? `✓ Found node: ${animState.foundNode}`
                        : `● Visiting node: ${animState.visiting}`
                    }
                </div>
            )}

            {animState.inserting && (
                <div className="action-banner insert">● Inserting: {animState.inserting}</div>
            )}

            {animState.removing && (
                <div className="action-banner remove">● Removing: {animState.removing}</div>
            )}

            {/* Path Display */}
            {animState.pathNodes.length > 0 && (
                <div className="path-display">
                    Path: {animState.pathNodes.join(' → ')}
                </div>
            )}

            <div className="tree-container">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="tree-svg"
                    style={{ width: Math.min(width, 700), height: Math.min(height, 450) }}
                >
                    {/* Level indicators (for BFS) */}
                    {showLevels && levels && levels.map((level, idx) => (
                        <g key={`level-${idx}`}>
                            <text
                                x={15}
                                y={level.y}
                                className="level-label"
                            >
                                L{idx}
                            </text>
                            <line
                                x1={35}
                                y1={level.y}
                                x2={width - 20}
                                y2={level.y}
                                className="level-line"
                            />
                        </g>
                    ))}

                    {/* Draw edges first (behind nodes) */}
                    {edges.map((edge, idx) => {
                        const highlighted = isEdgeHighlighted(edge);
                        return (
                            <line
                                key={`edge-${idx}`}
                                x1={edge.x1}
                                y1={edge.y1}
                                x2={edge.x2}
                                y2={edge.y2}
                                className={`tree-edge ${highlighted ? 'highlighted' : ''}`}
                            />
                        );
                    })}

                    {/* Draw nodes */}
                    {nodes.map((node, idx) => {
                        const nodeClass = getNodeClass(node);
                        const isActive = animState.visiting === node.value ||
                            animState.inserting === node.value ||
                            animState.removing === node.value ||
                            animState.foundNode === node.value;

                        return (
                            <g key={`node-${idx}`} className="tree-node-group">
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={22}
                                    className={nodeClass}
                                />
                                <text
                                    x={node.x}
                                    y={node.y}
                                    className={`tree-node-text ${isActive ? 'highlighted' : ''}`}
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
 * Check if a node is in the subtree of subtreeRoot
 */
function isInSubtree(node, subtreeRootValue, allNodes) {
    // Simple check - in a full implementation, we'd traverse the tree
    return false; // TODO: Implement subtree detection
}

/**
 * Parse tree data - supports level-order and insertion-order formats
 */
function parseTreeData(data) {
    if (!data || (Array.isArray(data) && data.length === 0)) return null;

    if (Array.isArray(data)) {
        const values = data.filter(v => v !== null && v !== undefined);
        if (values.length === 0) return null;

        let root;
        if (isLevelOrderFormat(data)) {
            root = buildFromLevelOrder(data);
        } else {
            root = buildBST(values);
        }

        if (!root) return null;
        return layoutTree(root);
    }

    if (typeof data === 'object' && data.value !== undefined) {
        return layoutTree(data);
    }

    return null;
}

/**
 * Detect if array is level-order format (heap-style indexing)
 * Arrays with null values are ALWAYS level-order format
 */
function isLevelOrderFormat(arr) {
    if (arr.length <= 2) return false;

    // If array contains null, it's definitely level-order format
    if (arr.some(v => v === null)) return true;

    const validElements = arr.filter(v => v !== null && v !== undefined).length;
    const perfectSizes = [1, 3, 7, 15, 31];
    if (perfectSizes.includes(validElements)) return true;

    const root = arr[0];
    const sorted = [...arr].filter(v => v !== null).sort((a, b) => a - b);
    const minVal = sorted[0];
    const maxVal = sorted[sorted.length - 1];

    // If root is not min/max, it's likely level-order (root is middle value)
    if (root !== minVal && root !== maxVal) return true;

    return false;
}

/**
 * Build tree from level-order array
 */
function buildFromLevelOrder(arr) {
    if (!arr || arr.length === 0 || arr[0] === null) return null;

    function buildNode(index) {
        if (index >= arr.length || arr[index] === null || arr[index] === undefined) {
            return null;
        }
        return {
            value: arr[index],
            left: buildNode(2 * index + 1),
            right: buildNode(2 * index + 2)
        };
    }

    return buildNode(0);
}

/**
 * Build BST by inserting values
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
 * Layout tree with positions - optimized for clear visualization like VisuAlgo
 */
function layoutTree(root) {
    if (!root) return { nodes: [], edges: [], width: 100, height: 100, levels: [] };

    const nodes = [];
    const edges = [];
    const levels = [];

    const depth = getTreeDepth(root);
    const levelHeight = 80;
    const horizontalSpacing = 60; // Reduced for cleaner look
    const padding = 40; // Reduced padding
    const maxWidth = Math.pow(2, depth - 1);
    const baseWidth = Math.max(maxWidth * horizontalSpacing, 300);

    // Track levels for BFS visualization
    for (let i = 0; i < depth; i++) {
        levels.push({ y: padding + i * levelHeight });
    }

    // Calculate horizontal positions more precisely to avoid overlapping
    function calculatePositions(node, level, x, y, parentX, parentY) {
        if (!node) return;

        nodes.push({
            value: node.value,
            x,
            y,
            level,
            isRoot: level === 0
        });

        if (parentX !== null && parentY !== null) {
            edges.push({
                x1: parentX,
                y1: parentY,
                x2: x,
                y2: y,
                fromValue: nodes.find(n => n.x === parentX && n.y === parentY)?.value,
                toValue: node.value
            });
        }

        // Calculate child positions based on tree structure
        if (node.left || node.right) {
            const childY = y + levelHeight;
            const childSpacing = Math.max(horizontalSpacing / Math.pow(2, level), 30); // Minimum spacing

            if (node.left) {
                const leftX = x - childSpacing;
                calculatePositions(node.left, level + 1, leftX, childY, x, y);
            }

            if (node.right) {
                const rightX = x + childSpacing;
                calculatePositions(node.right, level + 1, rightX, childY, x, y);
            }
        }
    }

    calculatePositions(root, 0, baseWidth / 2, padding, null, null);

    return {
        nodes,
        edges,
        width: baseWidth,
        height: padding + depth * levelHeight + padding,
        levels
    };
}

function getTreeDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
}

export default TreeEntity;
