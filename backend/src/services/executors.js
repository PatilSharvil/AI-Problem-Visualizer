/**
 * Lightweight Executor Layer
 * 
 * Pure, deterministic functions that validate and correct obvious
 * inconsistencies in LLM-generated JSON. These run AFTER LLM response
 * and BEFORE the universal normalizer.
 * 
 * Rules:
 * - No LLM calls
 * - No keyword/pattern detection
 * - No step creation or reordering
 * - Only adjust or drop invalid fields
 * - Must be pure functions (same input = same output)
 */

// Feature flag - set via environment variable or default to enabled
const ENABLE_EXECUTORS = process.env.ENABLE_EXECUTORS !== 'false';

/**
 * Main dispatcher - runs all applicable executors on LLM output
 * @param {Object} llmOutput - Raw LLM JSON response
 * @returns {Object} - Validated/corrected LLM output
 */
function runExecutors(llmOutput) {
    if (!ENABLE_EXECUTORS) {
        return llmOutput;
    }

    if (!llmOutput || typeof llmOutput !== 'object') {
        return llmOutput;
    }

    // Deep clone to avoid mutations
    let output = JSON.parse(JSON.stringify(llmOutput));

    // Validate structures
    if (Array.isArray(output.structures)) {
        output.structures = output.structures.map(structureExecutor);
    }

    // Track previous tree for BST operations
    let previousTree = null;

    // Get initial tree from structures
    const treeStructure = output.structures?.find(s => s.type === 'tree');
    if (treeStructure && Array.isArray(treeStructure.data)) {
        previousTree = [...treeStructure.data];
    }

    // Validate each step
    if (Array.isArray(output.steps)) {
        output.steps = output.steps.map((step, idx) => {
            let validatedStep = { ...step };

            // Run structure-specific executors
            validatedStep = arrayExecutor(validatedStep);
            validatedStep = stackExecutor(validatedStep);
            validatedStep = queueExecutor(validatedStep);
            validatedStep = treeExecutor(validatedStep, previousTree);
            validatedStep = pointersExecutor(validatedStep);

            // Update previousTree for next iteration
            if (Array.isArray(validatedStep.tree)) {
                previousTree = [...validatedStep.tree];
            }

            return validatedStep;
        });
    }

    return output;
}

/**
 * Structure executor - validates structure definitions
 */
function structureExecutor(structure) {
    if (!structure || typeof structure !== 'object') {
        return structure;
    }

    const validated = { ...structure };

    // Ensure data is an array if present
    if (validated.data !== undefined && !Array.isArray(validated.data)) {
        if (typeof validated.data === 'object') {
            // Keep object data (for trees in object format)
        } else {
            validated.data = [];
        }
    }

    // Ensure id exists
    if (!validated.id) {
        validated.id = `entity_${Date.now()}`;
    }

    return validated;
}

/**
 * Array executor - validates array-related fields
 */
function arrayExecutor(step) {
    if (!step) return step;

    const validated = { ...step };

    // Get array length for bounds checking
    const arrayFields = ['array', 'arr', 'nums', 'input', 'data'];
    let arrayLen = 0;

    for (const field of arrayFields) {
        if (Array.isArray(validated[field])) {
            arrayLen = Math.max(arrayLen, validated[field].length);
        }
    }

    // Validate highlight indices
    if (Array.isArray(validated.highlight) && arrayLen > 0) {
        validated.highlight = validated.highlight.filter(idx => {
            return typeof idx === 'number' && idx >= 0 && idx < arrayLen;
        });
    }

    return validated;
}

/**
 * Stack executor - validates stack state
 */
function stackExecutor(step) {
    if (!step) return step;

    const validated = { ...step };

    // Ensure stack is array
    if (validated.stack !== undefined && !Array.isArray(validated.stack)) {
        validated.stack = [];
    }

    // Ensure stack2 is array if present
    if (validated.stack2 !== undefined && !Array.isArray(validated.stack2)) {
        validated.stack2 = [];
    }

    return validated;
}

/**
 * Queue executor - validates queue state
 */
function queueExecutor(step) {
    if (!step) return step;

    const validated = { ...step };

    // Ensure queue is array
    if (validated.queue !== undefined && !Array.isArray(validated.queue)) {
        validated.queue = [];
    }

    // Ensure queue2 is array if present
    if (validated.queue2 !== undefined && !Array.isArray(validated.queue2)) {
        validated.queue2 = [];
    }

    return validated;
}

/**
 * Tree executor - validates tree state and fixes BST operations
 * - Detects insert/remove from step title
 * - Recomputes correct BST structure using deterministic algorithms
 * - Removes duplicates and validates structure
 */
function treeExecutor(step, previousTree) {
    if (!step) return step;

    const validated = { ...step };

    // Ensure tree is array
    if (validated.tree !== undefined) {
        if (!Array.isArray(validated.tree)) {
            if (typeof validated.tree === 'object') {
                // Keep object format
            } else {
                validated.tree = [];
            }
        } else {
            // Check if this is an insert/remove operation
            // LLM may use "Visit X" in title but "Insert X" in description
            const title = (validated.title || '').toLowerCase();
            const description = (validated.description || '').toLowerCase();
            const fullText = title + ' ' + description;

            // Detect insert operation - check title AND description
            const insertMatch = fullText.match(/insert[:\s]+(\d+)/i) ||
                title.match(/visit\s+(\d+)/i) && description.includes('insert');

            if (previousTree && Array.isArray(previousTree)) {
                const treeValues = previousTree.filter(v => v !== null && v !== undefined);

                // Check for insert
                const insertDirectMatch = fullText.match(/insert[:\s]+(\d+)/i);
                if (insertDirectMatch) {
                    const valueToInsert = parseInt(insertDirectMatch[1]);
                    console.log(`[BST Executor] Detected INSERT ${valueToInsert}, previousTree has ${treeValues.length} nodes`);

                    if (!treeValues.includes(valueToInsert)) {
                        const correctTree = bstInsertHelper(previousTree, valueToInsert);
                        console.log(`[BST Executor] After INSERT ${valueToInsert}:`, correctTree.slice(0, 10));
                        validated.tree = correctTree;
                    }
                }

                // Check for remove
                const removeDirectMatch = fullText.match(/remove[:\s]+(\d+)/i);
                if (removeDirectMatch) {
                    const valueToRemove = parseInt(removeDirectMatch[1]);
                    console.log(`[BST Executor] Detected REMOVE ${valueToRemove}, previousTree has ${treeValues.length} nodes`);

                    if (treeValues.includes(valueToRemove)) {
                        const correctTree = bstRemoveHelper(previousTree, valueToRemove);
                        console.log(`[BST Executor] After REMOVE ${valueToRemove}:`, correctTree.slice(0, 10));
                        validated.tree = correctTree;
                    } else {
                        console.log(`[BST Executor] Value ${valueToRemove} not in tree, skipping remove`);
                    }
                }
            }

            // Remove duplicates
            validated.tree = removeDuplicatesFromTree(validated.tree);
            // Trim trailing nulls
            validated.tree = trimTrailingNulls(validated.tree);
        }
    }

    // Clean up result array
    if (Array.isArray(validated.result) && Array.isArray(validated.tree)) {
        const treeValues = new Set(validated.tree.filter(v => v !== null && v !== undefined));
        validated.result = validated.result.filter(v => treeValues.has(v));
        validated.result = [...new Set(validated.result)];
    }

    return validated;
}

// Helper wrappers that use the BST functions defined later
function bstInsertHelper(arr, value) {
    // Will be replaced by actual function reference
    return bstInsert(arr, value);
}

function bstRemoveHelper(arr, value) {
    // Will be replaced by actual function reference
    return bstRemove(arr, value);
}

/**
 * Remove duplicate values from tree array, keeping structural position
 */
function removeDuplicatesFromTree(arr) {
    if (!Array.isArray(arr)) return arr;

    const seen = new Set();
    return arr.map(val => {
        if (val === null || val === undefined) {
            return val; // Keep nulls for structure
        }
        if (seen.has(val)) {
            return null; // Replace duplicate with null
        }
        seen.add(val);
        return val;
    });
}

/**
 * Remove trailing nulls from array
 */
function trimTrailingNulls(arr) {
    if (!Array.isArray(arr)) return arr;

    let lastValidIndex = -1;
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i] !== null && arr[i] !== undefined) {
            lastValidIndex = i;
            break;
        }
    }

    return lastValidIndex >= 0 ? arr.slice(0, lastValidIndex + 1) : [];
}

/**
 * Pointers executor - validates and clamps pointer values
 */
function pointersExecutor(step) {
    if (!step || !step.pointers || typeof step.pointers !== 'object') {
        return step;
    }

    const validated = { ...step };

    // Get array length for bounds checking
    const arrayFields = ['array', 'arr', 'nums', 'input', 'data'];
    let arrayLen = 0;

    for (const field of arrayFields) {
        if (Array.isArray(validated[field])) {
            arrayLen = Math.max(arrayLen, validated[field].length);
        }
    }

    // Clamp pointer values to valid range
    if (arrayLen > 0) {
        const clampedPointers = {};

        for (const [key, value] of Object.entries(validated.pointers)) {
            if (typeof value === 'number') {
                // Clamp to [0, arrayLen - 1]
                clampedPointers[key] = Math.max(0, Math.min(value, arrayLen - 1));
            } else {
                clampedPointers[key] = value;
            }
        }

        validated.pointers = clampedPointers;
    }

    // Ensure left <= right for two-pointer patterns
    if (typeof validated.pointers.left === 'number' &&
        typeof validated.pointers.right === 'number') {
        if (validated.pointers.left > validated.pointers.right) {
            // Swap if invalid
            [validated.pointers.left, validated.pointers.right] =
                [validated.pointers.right, validated.pointers.left];
        }
    }

    return validated;
}

/**
 * Check if executors are enabled
 */
function isExecutorsEnabled() {
    return ENABLE_EXECUTORS;
}

// ========== BST OPERATION HELPERS ==========

/**
 * Build BST from level-order array
 */
function levelOrderToTree(arr) {
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
 * Convert BST to level-order array
 */
function treeToLevelOrder(root) {
    if (!root) return [];

    const result = [];
    const queue = [{ node: root, index: 0 }];

    while (queue.length > 0) {
        const { node, index } = queue.shift();

        while (result.length <= index) {
            result.push(null);
        }

        result[index] = node.value;

        if (node.left) {
            queue.push({ node: node.left, index: 2 * index + 1 });
        }
        if (node.right) {
            queue.push({ node: node.right, index: 2 * index + 2 });
        }
    }

    return trimTrailingNulls(result);
}

/**
 * Insert value into BST (returns new level-order array)
 */
function bstInsert(arr, value) {
    const root = levelOrderToTree(arr);
    const newRoot = insertIntoBSTNode(root, value);
    return treeToLevelOrder(newRoot);
}

function insertIntoBSTNode(node, value) {
    if (node === null) {
        return { value, left: null, right: null };
    }
    if (value < node.value) {
        node.left = insertIntoBSTNode(node.left, value);
    } else if (value > node.value) {
        node.right = insertIntoBSTNode(node.right, value);
    }
    return node;
}

/**
 * Remove value from BST (returns new level-order array)
 */
function bstRemove(arr, value) {
    const root = levelOrderToTree(arr);
    const newRoot = removeFromBSTNode(root, value);
    return treeToLevelOrder(newRoot);
}

function removeFromBSTNode(node, value) {
    if (node === null) return null;

    if (value < node.value) {
        node.left = removeFromBSTNode(node.left, value);
    } else if (value > node.value) {
        node.right = removeFromBSTNode(node.right, value);
    } else {
        if (node.left === null) return node.right;
        if (node.right === null) return node.left;

        let successor = node.right;
        while (successor.left !== null) {
            successor = successor.left;
        }
        node.value = successor.value;
        node.right = removeFromBSTNode(node.right, successor.value);
    }

    return node;
}

module.exports = {
    runExecutors,
    isExecutorsEnabled,
    // Individual executors
    arrayExecutor,
    stackExecutor,
    queueExecutor,
    treeExecutor,
    pointersExecutor,
    structureExecutor,
    // BST helpers (for use in normalizer/controller)
    bstInsert,
    bstRemove,
    levelOrderToTree,
    treeToLevelOrder
};
