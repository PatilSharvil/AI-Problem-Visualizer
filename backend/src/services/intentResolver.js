/**
 * Intent Resolver - Centralized Intent Resolution System
 * 
 * This module resolves and locks algorithmic intent from LLM output.
 * Once intent is resolved from LLM, it cannot be changed by executors.
 * 
 * Core Principle:
 * - LLM decides WHAT algorithm is being demonstrated
 * - Backend decides HOW to keep it correct
 * - Frontend decides HOW to visualize it
 */

/**
 * Intent Schema:
 * {
 *   domain: 'array' | 'tree' | 'stack' | 'queue' | 'graph' | 'unknown',
 *   algorithm: string,        // e.g., 'binary_search', 'inorder_traversal'
 *   operations: string[],     // e.g., ['insert', 'remove']
 *   source: 'llm' | 'fallback',
 *   locked: boolean           // Once resolved from LLM, cannot be changed
 * }
 */

/**
 * Resolve intent from LLM output and user query
 * Priority: LLM output > Query inference (only as fallback)
 * 
 * @param {Object} llmOutput - The LLM's response
 * @param {string} query - Original user query
 * @returns {Object} - Resolved intent object
 */
function resolveIntent(llmOutput, query = '') {
    // Default intent - unlocked, can be overridden
    const intent = {
        domain: 'unknown',
        algorithm: null,
        operations: [],
        source: 'fallback',
        locked: false
    };

    // PHASE 1: Try to resolve from LLM output (highest priority)
    if (llmOutput && typeof llmOutput === 'object') {
        const llmIntent = resolveFromLLM(llmOutput);

        if (llmIntent.domain !== 'unknown' || llmIntent.algorithm) {
            // LLM provided valid intent - lock it
            return {
                ...llmIntent,
                source: 'llm',
                locked: true
            };
        }
    }

    // PHASE 2: Fallback - Infer from query (only if LLM didn't provide intent)
    // This is a FALLBACK, not an override
    if (query) {
        const queryIntent = resolveFromQuery(query);
        return {
            ...queryIntent,
            source: 'fallback',
            locked: false  // Fallback intent is not locked
        };
    }

    return intent;
}

/**
 * Resolve intent from LLM output
 * Extracts domain, algorithm, and operations from LLM response
 */
function resolveFromLLM(llmOutput) {
    const intent = {
        domain: 'unknown',
        algorithm: null,
        operations: []
    };

    // Check for explicit pattern field
    if (llmOutput.pattern) {
        intent.algorithm = llmOutput.pattern.toLowerCase().replace(/\s+/g, '_');
        intent.domain = inferDomainFromAlgorithm(intent.algorithm);
    }

    // Check for problem_type field
    if (llmOutput.problem_type) {
        const problemType = llmOutput.problem_type.toLowerCase();
        intent.algorithm = intent.algorithm || problemType.replace(/\s+/g, '_');
        intent.domain = intent.domain === 'unknown' ? inferDomainFromAlgorithm(problemType) : intent.domain;
    }

    // Infer from structures
    if (Array.isArray(llmOutput.structures)) {
        for (const struct of llmOutput.structures) {
            const type = (struct.type || '').toLowerCase();
            if (type === 'tree' || type === 'bst' || type === 'binary_tree') {
                intent.domain = 'tree';
                break;
            } else if (type === 'stack') {
                intent.domain = 'stack';
                break;
            } else if (type === 'queue') {
                intent.domain = 'queue';
                break;
            } else if (type === 'array') {
                intent.domain = intent.domain === 'unknown' ? 'array' : intent.domain;
            }
        }
    }

    // Infer operations from step titles
    if (Array.isArray(llmOutput.steps)) {
        const ops = new Set();
        for (const step of llmOutput.steps) {
            const title = (step.title || '').toLowerCase();
            const desc = (step.description || '').toLowerCase();
            const text = title + ' ' + desc;

            if (text.includes('insert')) ops.add('insert');
            if (text.includes('remove') || text.includes('delete')) ops.add('remove');
            if (text.includes('search') || text.includes('find')) ops.add('search');
            if (text.includes('traverse') || text.includes('visit')) ops.add('traverse');
            if (text.includes('push')) ops.add('push');
            if (text.includes('pop')) ops.add('pop');
            if (text.includes('enqueue')) ops.add('enqueue');
            if (text.includes('dequeue')) ops.add('dequeue');
            if (text.includes('swap')) ops.add('swap');
            if (text.includes('compare')) ops.add('compare');
        }
        intent.operations = Array.from(ops);
    }

    return intent;
}

/**
 * Infer domain from algorithm name
 */
function inferDomainFromAlgorithm(algorithm) {
    if (!algorithm) return 'unknown';

    const algo = algorithm.toLowerCase();

    // Tree algorithms
    if (algo.includes('tree') || algo.includes('bst') ||
        algo.includes('inorder') || algo.includes('preorder') ||
        algo.includes('postorder') || algo.includes('levelorder') ||
        algo.includes('level_order')) {
        return 'tree';
    }

    // Stack algorithms
    if (algo.includes('stack') || algo.includes('parenthes') ||
        algo.includes('bracket') || algo.includes('balanced')) {
        return 'stack';
    }

    // Queue algorithms
    if (algo.includes('queue') || algo.includes('bfs') ||
        algo.includes('breadth')) {
        return 'queue';
    }

    // Graph algorithms
    if (algo.includes('graph') || algo.includes('dijkstra') ||
        algo.includes('bellman') || algo.includes('topological')) {
        return 'graph';
    }

    // Array algorithms (default for most search/sort)
    if (algo.includes('sort') || algo.includes('search') ||
        algo.includes('two_pointer') || algo.includes('sliding') ||
        algo.includes('subarray') || algo.includes('sum')) {
        return 'array';
    }

    return 'unknown';
}

/**
 * Resolve intent from query (FALLBACK ONLY)
 * This only activates when LLM output is missing or invalid
 */
function resolveFromQuery(query) {
    const intent = {
        domain: 'unknown',
        algorithm: null,
        operations: []
    };

    if (!query) return intent;

    const q = query.toLowerCase();

    // Detect domain
    if (q.includes('tree') || q.includes('bst') || q.includes('binary tree') ||
        q.includes('inorder') || q.includes('preorder') || q.includes('postorder')) {
        intent.domain = 'tree';
    } else if (q.includes('stack') || q.includes('parenthes') || q.includes('bracket')) {
        intent.domain = 'stack';
    } else if (q.includes('queue') || q.includes('fifo')) {
        intent.domain = 'queue';
    } else if (q.includes('graph') || q.includes('vertex') || q.includes('edge')) {
        intent.domain = 'graph';
    } else {
        // Default to array for most operations
        intent.domain = 'array';
    }

    // Detect algorithm
    if (q.includes('binary search')) intent.algorithm = 'binary_search';
    else if (q.includes('linear search')) intent.algorithm = 'linear_search';
    else if (q.includes('bubble sort')) intent.algorithm = 'bubble_sort';
    else if (q.includes('selection sort')) intent.algorithm = 'selection_sort';
    else if (q.includes('insertion sort')) intent.algorithm = 'insertion_sort';
    else if (q.includes('quick sort')) intent.algorithm = 'quick_sort';
    else if (q.includes('merge sort')) intent.algorithm = 'merge_sort';
    else if (q.includes('sliding window')) intent.algorithm = 'sliding_window';
    else if (q.includes('two pointer')) intent.algorithm = 'two_pointers';
    else if (q.includes('inorder')) intent.algorithm = 'inorder_traversal';
    else if (q.includes('preorder')) intent.algorithm = 'preorder_traversal';
    else if (q.includes('postorder')) intent.algorithm = 'postorder_traversal';
    else if (q.includes('valid parenthes') || q.includes('balanced bracket')) intent.algorithm = 'valid_parentheses';
    else if (q.includes('two sum') || q.includes('2sum')) intent.algorithm = 'two_sum';
    else if (q.includes('three sum') || q.includes('3sum')) intent.algorithm = 'three_sum';

    // Detect operations
    const ops = [];
    if (q.includes('insert')) ops.push('insert');
    if (q.includes('remove') || q.includes('delete')) ops.push('remove');
    if (q.includes('search') || q.includes('find')) ops.push('search');
    if (q.includes('traverse') || q.includes('traversal')) ops.push('traverse');
    if (q.includes('sort')) ops.push('sort');
    if (q.includes('push')) ops.push('push');
    if (q.includes('pop')) ops.push('pop');
    intent.operations = ops;

    return intent;
}

/**
 * Check if LLM output is structurally valid (has required fields)
 * This determines whether we use LLM output or fallback
 * 
 * Handles two formats:
 * 1. Object format: { structures: [...], steps: [...] }
 * 2. Array format: [{ step: 1, array: [...] }, ...] - direct step array
 */
function isLLMOutputValid(llmOutput) {
    if (!llmOutput) {
        return false;
    }

    // Handle array format (direct step array from LLM)
    if (Array.isArray(llmOutput)) {
        // Array must have at least one step with data
        if (llmOutput.length === 0) return false;

        const hasDataInSteps = llmOutput.some(step => {
            return step.array || step.tree || step.stack || step.queue ||
                step.list || step.matrix || step.dp || step.data;
        });

        console.log('[Intent] LLM output is array format, hasData:', hasDataInSteps);
        return hasDataInSteps;
    }

    // Handle object format
    if (typeof llmOutput !== 'object') {
        return false;
    }

    // Must have either structures or steps with meaningful content
    const hasStructures = Array.isArray(llmOutput.structures) && llmOutput.structures.length > 0;
    const hasSteps = Array.isArray(llmOutput.steps) && llmOutput.steps.length > 0;

    if (!hasStructures && !hasSteps) {
        return false;
    }

    // Steps must have at least one with data
    if (hasSteps) {
        const hasDataInSteps = llmOutput.steps.some(step => {
            return step.array || step.tree || step.stack || step.queue ||
                step.list || step.matrix || step.dp;
        });
        if (!hasDataInSteps) {
            return false;
        }
    }

    return true;
}

/**
 * Check if intent explicitly requires traversal
 * Only returns true if traversal is explicitly requested
 */
function requiresTraversal(intent, query = '') {
    // Check if algorithm is a traversal
    if (intent.algorithm && intent.algorithm.includes('traversal')) {
        return true;
    }

    // Check if operations include traverse
    if (intent.operations.includes('traverse')) {
        return true;
    }

    // Check query for explicit traversal request
    const q = (query || '').toLowerCase();
    if (q.includes('traversal') || q.includes('traverse') ||
        (q.includes('inorder') && !q.includes('insert')) ||
        (q.includes('preorder') && !q.includes('insert')) ||
        (q.includes('postorder') && !q.includes('insert')) ||
        q.includes('level order') || q.includes('level-order')) {
        return true;
    }

    return false;
}

/**
 * Validate that executor changes respect locked intent
 * Returns true if changes are allowed, false if they violate intent
 */
function validateIntentCompliance(intent, proposedChanges) {
    if (!intent.locked) {
        return true; // Unlocked intent can be modified
    }

    // Check if proposed changes try to change the algorithm type
    if (proposedChanges.algorithm && proposedChanges.algorithm !== intent.algorithm) {
        console.log(`[Intent] BLOCKED: Attempted to change algorithm from ${intent.algorithm} to ${proposedChanges.algorithm}`);
        return false;
    }

    // Check if proposed changes try to change the domain
    if (proposedChanges.domain && proposedChanges.domain !== intent.domain) {
        console.log(`[Intent] BLOCKED: Attempted to change domain from ${intent.domain} to ${proposedChanges.domain}`);
        return false;
    }

    return true;
}

module.exports = {
    resolveIntent,
    resolveFromLLM,
    resolveFromQuery,
    isLLMOutputValid,
    requiresTraversal,
    validateIntentCompliance,
    inferDomainFromAlgorithm
};
