/**
 * Intent-Respecting Executor Layer
 * 
 * ARCHITECTURE PRINCIPLES:
 * 1. LLM decides WHAT algorithm is being demonstrated
 * 2. Backend (this layer) decides HOW to keep it correct
 * 3. Frontend decides HOW to visualize it
 * 
 * THREE-PHASE EXECUTION:
 * Phase 1: INTENT RESOLUTION - Extract and lock intent from LLM output
 * Phase 2: CORRECTION - Fix illegal states (out-of-bounds, invalid BST, etc.)
 * Phase 3: FALLBACK - Generate deterministic output ONLY if LLM completely fails
 * 
 * CRITICAL RULES:
 * - NEVER override valid LLM output with deterministic algorithms
 * - NEVER change algorithm type based on keywords alone
 * - NEVER generate traversals unless explicitly requested
 * - Deterministic fallbacks ONLY activate when LLM is null/undefined/malformed
 */

const {
    resolveIntent,
    isLLMOutputValid,
    requiresTraversal
} = require('./intentResolver');

// Feature flag - set via environment variable or default to enabled
const ENABLE_EXECUTORS = process.env.ENABLE_EXECUTORS !== 'false';

/**
 * Main dispatcher - runs executors with intent-respecting architecture
 * @param {Object} llmOutput - Raw LLM JSON response
 * @param {string} originalProblem - Original user query (optional)
 * @param {Object} providedIntent - Optional pre-resolved intent
 * @returns {Object} - Validated/corrected LLM output
 */
function runExecutors(llmOutput, originalProblem = '', providedIntent = null) {
    if (!ENABLE_EXECUTORS) {
        return llmOutput;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 1: INTENT RESOLUTION
    // Resolve intent from LLM output first. Once locked, cannot be changed.
    // ═══════════════════════════════════════════════════════════════════════════
    const intent = providedIntent || resolveIntent(llmOutput, originalProblem);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('[Executor] INTENT RESOLUTION');
    console.log(`  Domain: ${intent.domain}`);
    console.log(`  Algorithm: ${intent.algorithm || 'not specified'}`);
    console.log(`  Operations: [${intent.operations.join(', ')}]`);
    console.log(`  Source: ${intent.source}`);
    console.log(`  Locked: ${intent.locked}`);
    console.log('═══════════════════════════════════════════════════════════════');

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 2: LLM OUTPUT VALIDATION
    // Check if LLM output is structurally valid before deciding correction vs fallback
    // ═══════════════════════════════════════════════════════════════════════════
    const llmIsValid = isLLMOutputValid(llmOutput);

    if (llmIsValid && intent.locked) {
        // LLM output is valid and intent is from LLM - apply CORRECTIONS ONLY
        console.log('[Executor] LLM output valid with locked intent - CORRECTION MODE');
        return applyCorrectionsOnly(llmOutput, intent, originalProblem);
    }

    if (llmIsValid && !intent.locked) {
        // LLM output is valid but intent was inferred - still prefer LLM output
        console.log('[Executor] LLM output valid with inferred intent - CORRECTION MODE');
        return applyCorrectionsOnly(llmOutput, intent, originalProblem);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 3: FALLBACK MODE
    // LLM output is missing or invalid - use deterministic algorithms
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('[Executor] LLM output invalid/missing - FALLBACK MODE');

    const fallbackResult = generateDeterministicFallback(originalProblem, intent);
    if (fallbackResult) {
        console.log('[Executor] Deterministic fallback generated successfully');
        return fallbackResult;
    }

    // Absolute last resort - return whatever we have or a basic fallback
    if (llmOutput && typeof llmOutput === 'object') {
        console.log('[Executor] No fallback available, returning raw LLM output');
        return llmOutput;
    }

    // Nothing worked - generate minimal array display if possible
    const arrayMatch = originalProblem.match(/\[([0-9,\s\-]+)\]/);
    if (arrayMatch) {
        console.log('[Executor] MINIMAL FALLBACK - Showing detected array');
        const arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (arr.length > 0) {
            return {
                structures: [{ id: "arr", type: "array", label: "Array", data: arr }],
                steps: [{
                    title: "Input Data",
                    description: "Displaying detected input data.",
                    array: [...arr]
                }]
            };
        }
    }

    console.log('[Executor] No output could be generated');
    return null;
}

/**
 * Apply corrections to valid LLM output WITHOUT changing algorithm intent
 * This only fixes illegal states (out-of-bounds, invalid BST, etc.)
 */
function applyCorrectionsOnly(llmOutput, intent, originalProblem) {
    // Transform array-format LLM output into object format
    let normalizedOutput = llmOutput;

    if (Array.isArray(llmOutput)) {
        console.log('[Executor] Transforming array-format LLM output to object format');

        // Extract array/tree data from first step for structures
        const firstStep = llmOutput[0] || {};
        const structureData = firstStep.array || firstStep.tree || firstStep.data || [];

        // Determine structure type from intent
        const structureType = intent.domain === 'tree' ? 'tree' :
            intent.domain === 'stack' ? 'stack' :
                intent.domain === 'queue' ? 'queue' : 'array';
        const structureId = structureType === 'array' ? 'arr' : structureType;

        // Create structures from the data
        const structures = [{
            id: structureId,
            type: structureType,
            label: structureType.toUpperCase(),
            data: structureData
        }];

        // Transform each step to include title/description
        const steps = llmOutput.map((step, idx) => ({
            title: step.action || step.comparison || step.title || `Step ${step.step || idx + 1}`,
            description: step.action || step.comparison || step.description || `Processing step ${idx + 1}`,
            array: step.array || step.data,
            tree: step.tree,
            pointers: step.low !== undefined ? { low: step.low, high: step.high, mid: step.mid } : undefined,
            highlight: step.highlight || (step.mid !== undefined ? [step.mid] : []),
            variables: {
                target: step.target,
                mid_value: step.mid_value,
                found: step.found
            },
            result: step.result
        }));

        normalizedOutput = { structures, steps };
    }

    // Deep clone to avoid mutations
    let output = JSON.parse(JSON.stringify(normalizedOutput));

    // Validate structures (basic validation only)
    if (Array.isArray(output.structures)) {
        output.structures = output.structures.map(structureExecutor);
    }

    // Parse initial tree from structures if present
    let previousTree = null;
    const treeStructure = output.structures?.find(s =>
        s.type === 'tree' || s.type === 'bst' || s.id === 'tree'
    );
    if (treeStructure && Array.isArray(treeStructure.data)) {
        previousTree = [...treeStructure.data];
    }

    // Parse operations from query for reference (NOT to override intent)
    const queryOperations = parseOperationsFromQuery(originalProblem);

    // Validate each step - fix illegal states only
    if (Array.isArray(output.steps)) {
        output.steps = output.steps.map((step, idx) => {
            let validatedStep = { ...step };

            // Apply structure-specific CORRECTION executors (not algorithmic overrides)
            validatedStep = arrayExecutor(validatedStep);
            validatedStep = stackExecutor(validatedStep);
            validatedStep = queueExecutor(validatedStep);
            validatedStep = pointersExecutor(validatedStep);

            // Tree executor - only apply BST corrections, not traversal generation
            // Check if traversal is explicitly required before any traversal-related corrections
            const traversalRequired = requiresTraversal(intent, originalProblem);
            validatedStep = treeExecutorCorrectionOnly(validatedStep, previousTree, queryOperations, traversalRequired);

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
 * Generate deterministic fallback ONLY when LLM output is missing/invalid
 * This is the only place where query-based algorithm detection is allowed
 */
function generateDeterministicFallback(query, intent) {
    if (!query) return null;

    console.log('[Fallback] Attempting deterministic generation...');

    // Use intent to guide fallback selection
    // IMPORTANT: This is fallback mode - LLM failed, so we must generate something

    // Tree-related fallbacks
    if (intent.domain === 'tree') {
        const treeResult = deterministicTreeFallback(query, intent);
        if (treeResult) return treeResult;
    }

    // Stack-related fallbacks
    if (intent.domain === 'stack') {
        // Valid parentheses
        const validParenResult = deterministicValidParentheses(query);
        if (validParenResult) return validParenResult;

        // Reverse string
        const reverseResult = deterministicReverseString(query);
        if (reverseResult) return reverseResult;

        // Generic stack operations
        const stackOpsResult = deterministicStackOperations(query);
        if (stackOpsResult) return stackOpsResult;
    }

    // Queue-related fallbacks
    if (intent.domain === 'queue') {
        const queueResult = deterministicQueueOperations(query);
        if (queueResult) return queueResult;
    }

    // Array-related fallbacks (only if intent is array or unknown)
    if (intent.domain === 'array' || intent.domain === 'unknown') {
        // Match specific algorithms by intent.algorithm
        if (intent.algorithm === 'binary_search') {
            const result = deterministicBinarySearch(query);
            if (result) return result;
        }
        if (intent.algorithm === 'linear_search') {
            const result = deterministicLinearSearch(query);
            if (result) return result;
        }
        if (intent.algorithm === 'sliding_window') {
            const result = deterministicSlidingWindow(query);
            if (result) return result;
        }
        if (intent.algorithm === 'bubble_sort') {
            const result = deterministicBubbleSort(query);
            if (result) return result;
        }
        if (intent.algorithm === 'selection_sort') {
            const result = deterministicSelectionSort(query);
            if (result) return result;
        }
        if (intent.algorithm === 'insertion_sort') {
            const result = deterministicInsertionSort(query);
            if (result) return result;
        }
        if (intent.algorithm === 'quick_sort') {
            const result = deterministicQuickSort(query);
            if (result) return result;
        }
        if (intent.algorithm === 'merge_sort') {
            const result = deterministicMergeSort(query);
            if (result) return result;
        }
        if (intent.algorithm === 'two_sum') {
            const result = deterministicTwoSum(query);
            if (result) return result;
        }
        if (intent.algorithm === 'three_sum') {
            const result = deterministicThreeSum(query);
            if (result) return result;
        }

        // If no specific algorithm but we have array operations
        if (!intent.algorithm && intent.operations.includes('sort')) {
            const result = deterministicGenericSort(query);
            if (result) return result;
        }

        if (!intent.algorithm && intent.operations.includes('search')) {
            // Default to linear search if no specific type
            const result = deterministicLinearSearch(query);
            if (result) return result;
        }
    }

    return null;
}

/**
 * Deterministic tree fallback - for when LLM fails on tree problems
 */
function deterministicTreeFallback(query, intent) {
    // Parse tree array from query
    const treeArray = parseTreeFromQuery(query);
    if (!treeArray || treeArray.length === 0) return null;

    // Create tree structure
    const steps = [];

    // Only generate traversal if explicitly required
    if (requiresTraversal(intent, query)) {
        // Generate the appropriate traversal
        const traversalType = detectTraversalType(query);
        return generateTraversalSteps(treeArray, traversalType);
    }

    // Otherwise, just show the tree with any insert/remove operations
    const operations = parseOperationsFromQuery(query);

    if (operations.length > 0) {
        // Generate steps for each operation
        let currentTree = [...treeArray];

        steps.push({
            title: "Initial BST",
            description: `Starting with BST: [${currentTree.filter(v => v !== null).join(', ')}]`,
            tree: [...currentTree]
        });

        for (const op of operations) {
            if (op.type === 'insert') {
                currentTree = bstInsertHelper(currentTree, op.value);
                steps.push({
                    title: `Insert ${op.value}`,
                    description: `Inserting ${op.value} into BST`,
                    tree: [...currentTree],
                    highlight: [op.value]
                });
            } else if (op.type === 'remove') {
                currentTree = bstRemoveHelper(currentTree, op.value);
                steps.push({
                    title: `Remove ${op.value}`,
                    description: `Removing ${op.value} from BST`,
                    tree: [...currentTree]
                });
            }
        }

        return {
            structures: [{ id: "tree", type: "tree", label: "BST", data: treeArray }],
            steps
        };
    }

    // No operations, just display the tree
    return {
        structures: [{ id: "tree", type: "tree", label: "BST", data: treeArray }],
        steps: [{
            title: "BST",
            description: `Binary Search Tree with values: [${treeArray.filter(v => v !== null).join(', ')}]`,
            tree: [...treeArray]
        }]
    };
}

/**
 * Tree executor - CORRECTION ONLY mode
 * Only fixes BST violations, does NOT generate traversals or change algorithm
 */
function treeExecutorCorrectionOnly(step, previousTree, queryOperations, traversalRequired) {
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
        } else if (previousTree && Array.isArray(previousTree)) {
            // Apply BST corrections (insert/remove) based on step title
            const title = (validated.title || '').toLowerCase();
            const description = (validated.description || '').toLowerCase();
            const fullText = title + ' ' + description;

            const treeValues = previousTree.filter(v => v !== null && v !== undefined);

            // Check for insert
            const insertMatch = fullText.match(/insert[:\s]+(\d+)/i) ||
                fullText.match(/inserting[:\s]+(\d+)/i) ||
                fullText.match(/add[:\s]+(\d+)/i);
            if (insertMatch) {
                const valueToInsert = parseInt(insertMatch[1]);
                if (!treeValues.includes(valueToInsert)) {
                    const correctTree = bstInsertHelper(previousTree, valueToInsert);
                    validated.tree = correctTree;
                }
            }

            // Check for remove
            const removeMatch = fullText.match(/remove[:\s]+(\d+)/i) ||
                fullText.match(/removing[:\s]+(\d+)/i) ||
                fullText.match(/delete[:\s]+(\d+)/i) ||
                fullText.match(/deleting[:\s]+(\d+)/i);
            if (removeMatch) {
                const valueToRemove = parseInt(removeMatch[1]);
                if (treeValues.includes(valueToRemove)) {
                    const correctTree = bstRemoveHelper(previousTree, valueToRemove);
                    validated.tree = correctTree;
                }
            }
        }

        // Always apply basic validation
        if (Array.isArray(validated.tree)) {
            validated.tree = removeDuplicatesFromTree(validated.tree);
            validated.tree = trimTrailingNulls(validated.tree);
            validated.tree = validateAndFixBSTStructure(validated.tree);
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

/**
 * Detect traversal type from query
 */
function detectTraversalType(query) {
    const q = (query || '').toLowerCase();
    if (q.includes('preorder') || q.includes('pre-order')) return 'preorder';
    if (q.includes('postorder') || q.includes('post-order')) return 'postorder';
    if (q.includes('level') || q.includes('bfs')) return 'levelorder';
    if (q.includes('inorder') || q.includes('in-order')) return 'inorder';
    return 'inorder'; // Default only if traversal is explicitly requested
}

/**
 * Generate traversal steps - ONLY called when traversal is explicitly required
 */
function generateTraversalSteps(treeArray, traversalType) {
    const steps = [];
    const result = [];

    // Build tree and perform traversal
    // (Implementation would go here - calling existing traversal helpers)

    steps.push({
        title: `${traversalType.charAt(0).toUpperCase() + traversalType.slice(1)} Traversal`,
        description: `Performing ${traversalType} traversal on the BST`,
        tree: [...treeArray],
        result: []
    });

    // For now, return basic structure - existing traversal logic will be used
    return {
        structures: [{ id: "tree", type: "tree", label: "BST", data: treeArray }],
        steps
    };
}

/**
 * Deterministic Binary Search - replaces LLM output entirely
 * @param {string} query - User query like "Binary search for 5 in [1,2,3,4,5,6,7]"
 * @returns {Object|null} - Complete visualization output or null if not binary search
 */
function deterministicBinarySearch(query) {
    if (!query) return null;

    const queryLower = query.toLowerCase();
    if (!queryLower.includes('binary search')) return null;

    // Parse target and array from query
    const targetMatch = query.match(/(?:for|find)\s+(\d+)/i);
    const arrayMatch = query.match(/\[([0-9,\s]+)\]/);

    if (!targetMatch || !arrayMatch) return null;

    const target = parseInt(targetMatch[1]);
    const arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

    if (arr.length === 0) return null;

    console.log(`[Binary Search Executor] Target: ${target}, Array: [${arr.join(',')}]`);

    // Generate binary search steps
    const steps = [];
    let left = 0;
    let right = arr.length - 1;
    let found = false;
    let foundIndex = -1;

    // Initial step
    steps.push({
        title: "Initialize",
        description: `left=0, right=${right}, searching for ${target}`,
        array: [...arr],
        pointers: { left: 0, right: right },
        highlight: [0, right]
    });

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midVal = arr[mid];

        if (midVal === target) {
            steps.push({
                title: `Found at index ${mid}`,
                description: `arr[${mid}] = ${midVal} = ${target}. Found!`,
                array: [...arr],
                pointers: { left, mid, right },
                highlight: [mid],
                result: [mid]
            });
            found = true;
            foundIndex = mid;
            break;
        } else if (midVal < target) {
            steps.push({
                title: `Check mid=${mid}`,
                description: `arr[${mid}] = ${midVal} < ${target}, search right half`,
                array: [...arr],
                pointers: { left, mid, right },
                highlight: [mid]
            });
            left = mid + 1;
        } else {
            steps.push({
                title: `Check mid=${mid}`,
                description: `arr[${mid}] = ${midVal} > ${target}, search left half`,
                array: [...arr],
                pointers: { left, mid, right },
                highlight: [mid]
            });
            right = mid - 1;
        }
    }

    if (!found) {
        steps.push({
            title: "Not Found",
            description: `${target} is not in the array`,
            array: [...arr],
            result: [-1]
        });
    }

    return {
        structures: [
            { id: "arr", type: "array", label: "Array", data: arr }
        ],
        steps: steps
    };
}

/**
 * Deterministic Linear Search - replaces LLM output entirely
 */
function deterministicLinearSearch(query) {
    if (!query) return null;

    const queryLower = query.toLowerCase();
    if (!queryLower.includes('linear search') && !queryLower.includes('linear') && !queryLower.includes('sequential search')) {
        return null;
    }

    const targetMatch = query.match(/(?:for|find)\s+(\d+)/i);
    const arrayMatch = query.match(/\[([0-9,\s]+)\]/);

    if (!targetMatch || !arrayMatch) return null;

    const target = parseInt(targetMatch[1]);
    const arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

    if (arr.length === 0) return null;

    console.log(`[Linear Search Executor] Target: ${target}, Array: [${arr.join(',')}]`);

    const steps = [];
    let found = false;

    steps.push({
        title: "Start Search",
        description: `Looking for ${target}`,
        array: [...arr],
        pointers: { curr: 0 },
        highlight: [0]
    });

    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            steps.push({
                title: `Found at index ${i}`,
                description: `arr[${i}] = ${arr[i]} = ${target}. Found!`,
                array: [...arr],
                pointers: { curr: i },
                highlight: [i],
                result: [i]
            });
            found = true;
            break;
        } else {
            steps.push({
                title: `Check index ${i}`,
                description: `arr[${i}] = ${arr[i]} ≠ ${target}`,
                array: [...arr],
                pointers: { curr: i },
                highlight: [i]
            });
        }
    }

    if (!found) {
        steps.push({
            title: "Not Found",
            description: `${target} is not in the array`,
            array: [...arr],
            result: [-1]
        });
    }

    return {
        structures: [{ id: "arr", type: "array", label: "Array", data: arr }],
        steps: steps
    };
}

/**
 * Deterministic Sliding Window - Max Sum of Size K
 */
function deterministicSlidingWindow(query) {
    if (!query) return null;

    const queryLower = query.toLowerCase();
    if (!queryLower.includes('sliding window') && !queryLower.includes('max sum') &&
        !queryLower.includes('maximum sum') && !queryLower.includes('subarray') &&
        !queryLower.includes('window') && !queryLower.includes('consecutive')) {
        return null;
    }

    // Parse window size - support: size 3, k=2, k = 2, of 3, 2 consecutive
    const sizeMatch = query.match(/(?:size|k\s*=|of)\s*(\d+)/i) || query.match(/(\d+)\s*consecutive/i);
    const arrayMatch = query.match(/\[([0-9,\s\-]+)\]/);

    if (!sizeMatch || !arrayMatch) return null;

    const k = parseInt(sizeMatch[1]);
    const arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

    if (arr.length === 0 || k > arr.length || k <= 0) return null;

    console.log(`[Sliding Window Executor] K: ${k}, Array: [${arr.join(',')}]`);

    const steps = [];
    let windowSum = 0;
    let maxSum = 0;
    let maxStart = 0;

    // Calculate initial window
    for (let i = 0; i < k; i++) {
        windowSum += arr[i];
    }
    maxSum = windowSum;

    // Create highlight for first window
    const firstHighlight = [];
    for (let i = 0; i < k; i++) firstHighlight.push(i);

    steps.push({
        title: `Window [0-${k - 1}]`,
        description: `Initial window sum = ${windowSum}`,
        array: [...arr],
        pointers: { start: 0, end: k - 1 },
        highlight: firstHighlight,
        variables: { windowSum, maxSum }
    });

    // Slide the window
    for (let i = k; i < arr.length; i++) {
        const remove = arr[i - k];
        const add = arr[i];
        windowSum = windowSum - remove + add;

        if (windowSum > maxSum) {
            maxSum = windowSum;
            maxStart = i - k + 1;
        }

        const windowHighlight = [];
        for (let j = i - k + 1; j <= i; j++) windowHighlight.push(j);

        steps.push({
            title: `Window [${i - k + 1}-${i}]`,
            description: `Remove ${remove}, add ${add}. Sum = ${windowSum}`,
            array: [...arr],
            pointers: { start: i - k + 1, end: i },
            highlight: windowHighlight,
            variables: { windowSum, maxSum }
        });
    }

    // Result step
    const resultHighlight = [];
    for (let i = maxStart; i < maxStart + k; i++) resultHighlight.push(i);

    steps.push({
        title: "Result",
        description: `Max sum = ${maxSum} at window [${maxStart}-${maxStart + k - 1}]`,
        array: [...arr],
        highlight: resultHighlight,
        result: [maxSum]
    });

    return {
        structures: [{ id: "arr", type: "array", label: "Array", data: arr }],
        steps: steps
    };
}

/**
 * Deterministic Valid Parentheses - handles bracket validation using stack
 * Catches: "valid parentheses", "balanced brackets", "check brackets", etc.
 */
function deterministicValidParentheses(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();

    // Check if it's a parentheses/bracket validation problem
    const isParenthesesProblem =
        queryLower.includes('valid parenthes') ||
        queryLower.includes('balanced') ||
        queryLower.includes('bracket') ||
        queryLower.includes('parenthes') ||
        (queryLower.includes('check') && (queryLower.includes('(') || queryLower.includes('['))) ||
        (queryLower.includes('stack') && (queryLower.includes('(') || queryLower.includes('{')));

    if (!isParenthesesProblem) return null;

    // Extract the bracket string from the query
    // Look for quoted strings or bracket sequences
    let bracketString = '';

    // Try to find quoted string first
    const quotedMatch = query.match(/['"]([\[\](){}<>]+)['"]/);
    if (quotedMatch) {
        bracketString = quotedMatch[1];
    } else {
        // Look for bracket sequence directly
        const bracketMatch = query.match(/([\[\](){}<>]+)/);
        if (bracketMatch) {
            bracketString = bracketMatch[1];
        }
    }

    // If no brackets found, use a default example
    if (!bracketString || bracketString.length === 0) {
        bracketString = '()[]{}';
    }

    console.log(`[Valid Parentheses Executor] Checking: "${bracketString}"`);

    const steps = [];
    const stack = [];
    const matchingBrackets = { ')': '(', ']': '[', '}': '{', '>': '<' };
    const openingBrackets = new Set(['(', '[', '{', '<']);
    let isValid = true;
    let errorIndex = -1;

    // Initial step
    steps.push({
        title: "Start",
        description: `Input: "${bracketString}"`,
        stack: [],
        input: bracketString,
        currentIndex: -1
    });

    for (let i = 0; i < bracketString.length; i++) {
        const char = bracketString[i];

        if (openingBrackets.has(char)) {
            // Push opening bracket
            stack.push(char);
            steps.push({
                title: `Push '${char}'`,
                description: `Opening bracket at index ${i}. Push to stack.`,
                stack: [...stack],
                input: bracketString,
                currentIndex: i,
                action: 'push'
            });
        } else if (matchingBrackets[char]) {
            // Check for matching opening bracket
            if (stack.length === 0) {
                isValid = false;
                errorIndex = i;
                steps.push({
                    title: `Error: '${char}'`,
                    description: `Closing bracket at index ${i} but stack is empty!`,
                    stack: [...stack],
                    input: bracketString,
                    currentIndex: i,
                    action: 'error'
                });
                break;
            }

            const top = stack[stack.length - 1];
            if (top === matchingBrackets[char]) {
                stack.pop();
                steps.push({
                    title: `Match: '${top}' & '${char}'`,
                    description: `Closing '${char}' matches opening '${top}'. Pop from stack.`,
                    stack: [...stack],
                    input: bracketString,
                    currentIndex: i,
                    action: 'pop'
                });
            } else {
                isValid = false;
                errorIndex = i;
                steps.push({
                    title: `Mismatch!`,
                    description: `Expected '${matchingBrackets[char]}' but found '${top}' at top of stack.`,
                    stack: [...stack],
                    input: bracketString,
                    currentIndex: i,
                    action: 'error'
                });
                break;
            }
        }
    }

    // Final check
    if (isValid && stack.length > 0) {
        isValid = false;
        steps.push({
            title: "Unmatched Brackets",
            description: `Stack not empty. Remaining: [${stack.join(', ')}]`,
            stack: [...stack],
            input: bracketString,
            currentIndex: bracketString.length,
            action: 'error'
        });
    }

    // Result step
    steps.push({
        title: isValid ? "Valid! ✓" : "Invalid! ✗",
        description: isValid
            ? "All brackets properly matched and closed."
            : `Brackets are not balanced.`,
        stack: [...stack],
        input: bracketString,
        result: isValid
    });

    return {
        structures: [
            { id: "stack", type: "stack", label: "Stack", data: [] },
            { id: "input", type: "array", label: "Input", data: bracketString.split('') }
        ],
        steps
    };
}

/**
 * Deterministic Reverse String using Stack
 * Catches: "reverse string", "reverse using stack", etc.
 */
function deterministicReverseString(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();

    const isReverseWithStack =
        (queryLower.includes('reverse') && queryLower.includes('stack')) ||
        (queryLower.includes('reverse') && queryLower.includes('string'));

    if (!isReverseWithStack) return null;

    // Extract string from query
    let inputString = '';
    const quotedMatch = query.match(/['"]([\w\s]+)['"]/);
    if (quotedMatch) {
        inputString = quotedMatch[1];
    } else {
        // Look for word after "reverse"
        const wordMatch = query.match(/reverse\s+(?:string\s+)?['""]?(\w+)['""]?/i);
        if (wordMatch && wordMatch[1] !== 'string' && wordMatch[1] !== 'using') {
            inputString = wordMatch[1];
        }
    }

    if (!inputString) inputString = 'hello';

    console.log(`[Reverse String Executor] Reversing: "${inputString}"`);

    const steps = [];
    const stack = [];
    const chars = inputString.split('');

    steps.push({
        title: "Start",
        description: `Input: "${inputString}"`,
        stack: [],
        array: chars,
        phase: 'init'
    });

    // Push phase
    for (let i = 0; i < chars.length; i++) {
        stack.push(chars[i]);
        steps.push({
            title: `Push '${chars[i]}'`,
            description: `Push char at index ${i} onto stack`,
            stack: [...stack],
            array: chars,
            highlight: [i],
            phase: 'push'
        });
    }

    steps.push({
        title: "All Pushed",
        description: `Stack: [${stack.join(', ')}]`,
        stack: [...stack],
        array: chars,
        phase: 'transition'
    });

    // Pop phase
    const result = [];
    for (let i = 0; i < chars.length; i++) {
        const popped = stack.pop();
        result.push(popped);
        steps.push({
            title: `Pop '${popped}'`,
            description: `Pop and add to result`,
            stack: [...stack],
            result: [...result],
            phase: 'pop'
        });
    }

    steps.push({
        title: "Reversed!",
        description: `Result: "${result.join('')}"`,
        stack: [],
        result: result,
        phase: 'complete'
    });

    return {
        structures: [
            { id: "stack", type: "stack", label: "Stack", data: [] },
            { id: "arr", type: "array", label: "Input", data: chars }
        ],
        steps
    };
}

/**
 * Deterministic Stack Operations Demo
 * Catches: "stack push pop", "stack operations", "demonstrate stack", etc.
 */
function deterministicStackOperations(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();

    const isStackOperation =
        (queryLower.includes('stack') && (queryLower.includes('push') || queryLower.includes('pop'))) ||
        (queryLower.includes('stack') && queryLower.includes('operation')) ||
        (queryLower.includes('demonstrate') && queryLower.includes('stack')) ||
        (queryLower.includes('lifo') || queryLower.includes('last in first out'));

    if (!isStackOperation) return null;

    // Extract array from query
    const arrayMatch = query.match(/\[([0-9,\s\-]+)\]/);
    let arr = [1, 2, 3, 4, 5]; // default
    if (arrayMatch) {
        arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }

    console.log(`[Stack Operations Executor] Demo with: [${arr.join(',')}]`);

    const steps = [];
    const stack = [];

    steps.push({
        title: "Empty Stack",
        description: "Initialize empty stack",
        stack: [],
        array: arr
    });

    // Push all elements
    for (let i = 0; i < arr.length; i++) {
        stack.push(arr[i]);
        steps.push({
            title: `Push ${arr[i]}`,
            description: `Push element ${arr[i]} onto stack`,
            stack: [...stack],
            array: arr,
            highlight: [i]
        });
    }

    steps.push({
        title: "Stack Full",
        description: `All elements pushed. Top = ${stack[stack.length - 1]}`,
        stack: [...stack],
        array: arr
    });

    // Pop all elements
    const popped = [];
    while (stack.length > 0) {
        const val = stack.pop();
        popped.push(val);
        steps.push({
            title: `Pop ${val}`,
            description: `Pop top element: ${val}`,
            stack: [...stack],
            result: [...popped]
        });
    }

    steps.push({
        title: "LIFO Complete",
        description: `Pop order: [${popped.join(', ')}] - Last In First Out!`,
        stack: [],
        result: popped
    });

    return {
        structures: [
            { id: "stack", type: "stack", label: "Stack", data: [] },
            { id: "arr", type: "array", label: "Input", data: arr }
        ],
        steps
    };
}

/**
 * Universal Stack Executor - Handles any stack-related query
 * 1. Detects if query is stack-related
 * 2. Validates and corrects LLM output
 * 3. Provides deterministic fallback if LLM output is invalid
 */
function universalStackExecutor(llmOutput, query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();

    // Check if this is a stack-related query
    const isStackQuery =
        queryLower.includes('stack') ||
        queryLower.includes('lifo') ||
        queryLower.includes('push') && queryLower.includes('pop') ||
        queryLower.includes('undo') ||
        queryLower.includes('backtrack');

    if (!isStackQuery) return null;

    console.log(`[Universal Stack Executor] Processing stack query: "${query.substring(0, 50)}..."`);

    // If we have LLM output, validate and correct it only if it appears to be invalid
    if (llmOutput && llmOutput.steps && Array.isArray(llmOutput.steps) && llmOutput.steps.length > 0) {
        // Check if the LLM output already looks valid for stack operations
        const llmOutputLooksValid = checkIfLlmOutputIsValidForQuery(llmOutput, query);

        if (!llmOutputLooksValid) {
            const correctedOutput = validateAndCorrectStackOutput(llmOutput, query);
            if (correctedOutput) {
                return correctedOutput;
            }
        } else {
            // LLM output looks valid, return as is but still apply minimal corrections
            return llmOutput;
        }
    }

    // Fallback: Generate deterministic stack demonstration
    return generateStackFallback(query);
}

/**
 * Validates and corrects LLM output for stack problems
 */
function validateAndCorrectStackOutput(llmOutput, query) {
    try {
        const output = JSON.parse(JSON.stringify(llmOutput));

        // Ensure structures include stack
        if (!output.structures) {
            output.structures = [];
        }

        const hasStack = output.structures.some(s => s.type === 'stack' || s.id === 'stack');
        if (!hasStack) {
            output.structures.push({
                id: 'stack',
                type: 'stack',
                label: 'Stack',
                data: []
            });
        }

        // Validate each step has proper stack data
        let isValid = true;
        const simulatedStack = [];

        for (let i = 0; i < output.steps.length; i++) {
            const step = output.steps[i];

            // Ensure step has title and description
            if (!step.title) step.title = `Step ${i + 1}`;
            if (!step.description) step.description = '';

            // Detect push/pop from title and simulate stack
            const titleLower = (step.title || '').toLowerCase();
            const descLower = (step.description || '').toLowerCase();

            if (titleLower.includes('push') || descLower.includes('push')) {
                // Extract value being pushed
                const valueMatch = step.title.match(/push\s+['\"]?(\w+)['\"]?/i) ||
                    step.description.match(/push\s+['\"]?(\w+)['\"]?/i);
                if (valueMatch) {
                    const val = isNaN(valueMatch[1]) ? valueMatch[1] : parseInt(valueMatch[1]);
                    simulatedStack.push(val);
                }
            } else if (titleLower.includes('pop') || descLower.includes('pop')) {
                if (simulatedStack.length > 0) {
                    simulatedStack.pop();
                }
            }

            // Ensure step has stack field - use simulated if missing
            if (!step.stack || !Array.isArray(step.stack)) {
                step.stack = [...simulatedStack];
            }

            // Validate stack consistency (length should only change by 1)
            if (i > 0 && step.stack && output.steps[i - 1].stack) {
                const prevLen = output.steps[i - 1].stack.length;
                const currLen = step.stack.length;
                if (Math.abs(currLen - prevLen) > 1) {
                    // Stack changed too much - use simulated
                    step.stack = [...simulatedStack];
                }
            }
        }

        // Ensure at least one step has stack data
        const hasStackData = output.steps.some(s => s.stack && s.stack.length > 0);
        if (!hasStackData && output.steps.length > 1) {
            isValid = false;
        }

        if (isValid) {
            console.log('[Universal Stack] Validated and corrected LLM output');
            return output;
        }

        return null;
    } catch (e) {
        console.error('[Universal Stack] Validation error:', e.message);
        return null;
    }
}

/**
 * Generates a deterministic stack fallback based on query
 */
function generateStackFallback(query) {
    console.log('[Universal Stack] Generating fallback visualization');

    // Extract data from query if present
    const arrayMatch = query.match(/\[([^\]]+)\]/);
    let data = [];

    if (arrayMatch) {
        const items = arrayMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
        data = items.filter(s => s.length > 0);
        // Convert to numbers if all are numeric
        if (data.every(s => !isNaN(s))) {
            data = data.map(s => parseInt(s));
        }
    }

    if (data.length === 0) {
        data = ['A', 'B', 'C', 'D', 'E'];
    }

    const steps = [];
    const stack = [];

    steps.push({
        title: 'Initialize Stack',
        description: 'Start with empty stack',
        stack: [],
        array: data
    });

    // Push phase
    for (let i = 0; i < data.length; i++) {
        stack.push(data[i]);
        steps.push({
            title: `Push ${data[i]}`,
            description: `Push element onto stack. Top is now ${data[i]}`,
            stack: [...stack],
            array: data,
            highlight: [i]
        });
    }

    steps.push({
        title: 'Stack Filled',
        description: `All elements pushed. Stack size: ${stack.length}`,
        stack: [...stack],
        array: data
    });

    // Pop phase
    const result = [];
    while (stack.length > 0) {
        const val = stack.pop();
        result.push(val);
        steps.push({
            title: `Pop ${val}`,
            description: `Removed ${val} from top of stack`,
            stack: [...stack],
            result: [...result]
        });
    }

    steps.push({
        title: 'Complete',
        description: `LIFO order: [${result.join(', ')}]`,
        stack: [],
        result: result
    });

    return {
        structures: [
            { id: 'stack', type: 'stack', label: 'Stack', data: [] },
            { id: 'arr', type: 'array', label: 'Input', data: data }
        ],
        steps
    };
}

/**
     * Deterministic Queue Operations Demo
     * Catches: "queue enqueue dequeue", "queue operations", "fifo", etc.
     */
function deterministicQueueOperations(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();

    const isQueueOperation =
        (queryLower.includes('queue') && (queryLower.includes('enqueue') || queryLower.includes('dequeue'))) ||
        (queryLower.includes('queue') && queryLower.includes('operation')) ||
        (queryLower.includes('demonstrate') && queryLower.includes('queue')) ||
        (queryLower.includes('fifo') || queryLower.includes('first in first out'));

    if (!isQueueOperation) return null;

    // Extract array from query
    const arrayMatch = query.match(/\[([0-9,\s\-]+)\]/);
    let arr = [1, 2, 3, 4, 5];
    if (arrayMatch) {
        arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }

    console.log(`[Queue Operations Executor] Demo with: [${arr.join(',')}]`);

    const steps = [];
    const queue = [];

    steps.push({
        title: "Empty Queue",
        description: "Initialize empty queue",
        queue: [],
        array: arr
    });

    // Enqueue all elements
    for (let i = 0; i < arr.length; i++) {
        queue.push(arr[i]);
        steps.push({
            title: `Enqueue ${arr[i]}`,
            description: `Add ${arr[i]} to back of queue`,
            queue: [...queue],
            array: arr,
            highlight: [i]
        });
    }

    steps.push({
        title: "Queue Filled",
        description: `All elements enqueued. Front = ${queue[0]}, Back = ${queue[queue.length - 1]}`,
        queue: [...queue],
        array: arr
    });

    // Dequeue all elements
    const dequeued = [];
    while (queue.length > 0) {
        const val = queue.shift();
        dequeued.push(val);
        steps.push({
            title: `Dequeue ${val}`,
            description: `Remove front element: ${val}`,
            queue: [...queue],
            result: [...dequeued]
        });
    }

    steps.push({
        title: "FIFO Complete",
        description: `Dequeue order: [${dequeued.join(', ')}] - First In First Out!`,
        queue: [],
        result: dequeued
    });

    return {
        structures: [
            { id: "queue", type: "queue", label: "Queue", data: [] },
            { id: "arr", type: "array", label: "Input", data: arr }
        ],
        steps
    };
}

/**
 * Universal Queue Executor - Handles any queue-related query
 */
function universalQueueExecutor(llmOutput, query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();

    const isQueueQuery =
        queryLower.includes('queue') ||
        queryLower.includes('fifo') ||
        queryLower.includes('bfs') ||
        queryLower.includes('breadth') ||
        (queryLower.includes('enqueue') || queryLower.includes('dequeue'));

    if (!isQueueQuery) return null;

    console.log(`[Universal Queue Executor] Processing: "${query.substring(0, 50)}..."`);

    // If we have LLM output, validate and correct it only if it appears to be invalid
    if (llmOutput && llmOutput.steps && Array.isArray(llmOutput.steps) && llmOutput.steps.length > 0) {
        // Check if the LLM output already looks valid for queue operations
        const llmOutputLooksValid = checkIfLlmOutputIsValidForQuery(llmOutput, query);

        if (!llmOutputLooksValid) {
            const correctedOutput = validateAndCorrectQueueOutput(llmOutput, query);
            if (correctedOutput) {
                return correctedOutput;
            }
        } else {
            // LLM output looks valid, return as is but still apply minimal corrections
            return llmOutput;
        }
    }

    // Fallback
    return generateQueueFallback(query);
}

/**
 * Validates and corrects LLM output for queue problems
 */
function validateAndCorrectQueueOutput(llmOutput, query) {
    try {
        const output = JSON.parse(JSON.stringify(llmOutput));

        if (!output.structures) output.structures = [];

        const hasQueue = output.structures.some(s => s.type === 'queue' || s.id === 'queue');
        if (!hasQueue) {
            output.structures.push({ id: 'queue', type: 'queue', label: 'Queue', data: [] });
        }

        const simulatedQueue = [];

        for (let i = 0; i < output.steps.length; i++) {
            const step = output.steps[i];

            if (!step.title) step.title = `Step ${i + 1}`;
            if (!step.description) step.description = '';

            const titleLower = (step.title || '').toLowerCase();
            const descLower = (step.description || '').toLowerCase();

            if (titleLower.includes('enqueue') || descLower.includes('enqueue') || titleLower.includes('add')) {
                const valueMatch = step.title.match(/(?:enqueue|add)\s+['\"]?(\w+)['\"]?/i) ||
                    step.description.match(/(?:enqueue|add)\s+['\"]?(\w+)['\"]?/i);
                if (valueMatch) {
                    const val = isNaN(valueMatch[1]) ? valueMatch[1] : parseInt(valueMatch[1]);
                    simulatedQueue.push(val);
                }
            } else if (titleLower.includes('dequeue') || descLower.includes('dequeue') || titleLower.includes('remove')) {
                if (simulatedQueue.length > 0) simulatedQueue.shift();
            }

            if (!step.queue || !Array.isArray(step.queue)) {
                step.queue = [...simulatedQueue];
            }
        }

        const hasQueueData = output.steps.some(s => s.queue && s.queue.length > 0);
        if (hasQueueData || output.steps.length > 0) {
            console.log('[Universal Queue] Validated LLM output');
            return output;
        }

        return null;
    } catch (e) {
        console.error('[Universal Queue] Validation error:', e.message);
        return null;
    }
}

/**
 * Generates deterministic queue fallback
 */
function generateQueueFallback(query) {
    console.log('[Universal Queue] Generating fallback');

    const arrayMatch = query.match(/\[([^\]]+)\]/);
    let data = [];

    if (arrayMatch) {
        const items = arrayMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
        data = items.filter(s => s.length > 0);
        if (data.every(s => !isNaN(s))) data = data.map(s => parseInt(s));
    }

    if (data.length === 0) data = ['A', 'B', 'C', 'D', 'E'];

    const steps = [];
    const queue = [];

    steps.push({ title: 'Initialize Queue', description: 'Start with empty queue', queue: [], array: data });

    for (let i = 0; i < data.length; i++) {
        queue.push(data[i]);
        steps.push({
            title: `Enqueue ${data[i]}`,
            description: `Add to back. Front: ${queue[0]}`,
            queue: [...queue],
            array: data,
            highlight: [i]
        });
    }

    steps.push({ title: 'Queue Filled', description: `Size: ${queue.length}`, queue: [...queue], array: data });

    const result = [];
    while (queue.length > 0) {
        const val = queue.shift();
        result.push(val);
        steps.push({
            title: `Dequeue ${val}`,
            description: `Removed from front`,
            queue: [...queue],
            result: [...result]
        });
    }

    steps.push({ title: 'Complete', description: `FIFO: [${result.join(', ')}]`, queue: [], result });

    return {
        structures: [
            { id: 'queue', type: 'queue', label: 'Queue', data: [] },
            { id: 'arr', type: 'array', label: 'Input', data }
        ],
        steps
    };
}

/**
 * Universal Array Executor - Handles any array-related query
 * 1. Detects if query is array-related
 * 2. Validates and corrects LLM output
 * 3. Provides deterministic fallback if LLM output is invalid
 */
function universalArrayExecutor(llmOutput, query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();

    // Check if this is an array-related query
    // But exclude tree-related queries to avoid conflicts
    const isTreeRelated = checkIfTreeQuery(queryLower);
    if (isTreeRelated) {
        return null; // Let tree executor handle it
    }

    const isArrayQuery =
        queryLower.includes('array') ||
        queryLower.includes('subarray') ||
        queryLower.includes('subarrays') ||
        queryLower.includes('element') ||
        queryLower.includes('index') ||
        queryLower.includes('traverse') &&
        !(queryLower.includes('tree') || queryLower.includes('bst')) || // Exclude tree traversals
        queryLower.includes('find') &&
        !(queryLower.includes('tree') || queryLower.includes('bst')) || // Exclude tree searches
        queryLower.includes('sum') ||
        queryLower.includes('max') ||
        queryLower.includes('min') ||
        queryLower.includes('target') ||
        queryLower.includes('pair') ||
        queryLower.includes('sort') &&
        !(queryLower.includes('tree') || queryLower.includes('bst')) || // Exclude tree sorts
        /\[[0-9,\s\-]+\]/.test(query) && // Has array literal
        !(queryLower.includes('tree') || queryLower.includes('bst') || queryLower.includes('binary')); // Exclude tree arrays

    if (!isArrayQuery) return null;

    console.log(`[Universal Array Executor] Processing: "${query.substring(0, 50)}..."`);

    // If we have LLM output, validate and correct it only if it appears to be invalid
    if (llmOutput && llmOutput.steps && Array.isArray(llmOutput.steps) && llmOutput.steps.length > 0) {
        // Check if the LLM output already looks valid for array operations
        const llmOutputLooksValid = checkIfLlmOutputIsValidForQuery(llmOutput, query);

        if (!llmOutputLooksValid) {
            const correctedOutput = validateAndCorrectArrayOutput(llmOutput, query);
            if (correctedOutput) {
                return correctedOutput;
            }
        } else {
            // LLM output looks valid, return as is but still apply minimal corrections
            return llmOutput;
        }
    }

    // Fallback: Generate deterministic array traversal
    return generateArrayFallback(query);
}

/**
 * Validates and corrects LLM output for array problems
 */
function validateAndCorrectArrayOutput(llmOutput, query) {
    try {
        const output = JSON.parse(JSON.stringify(llmOutput));

        // Ensure structures include array
        if (!output.structures) output.structures = [];

        const hasArray = output.structures.some(s => s.type === 'array' || s.id === 'arr');
        if (!hasArray) {
            // Extract array from query
            const arrayMatch = query.match(/\[([0-9,\s\-]+)\]/);
            let data = [1, 2, 3, 4, 5];
            if (arrayMatch) {
                data = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            }
            output.structures.unshift({ id: 'arr', type: 'array', label: 'Array', data });
        }

        // Validate each step
        for (let i = 0; i < output.steps.length; i++) {
            const step = output.steps[i];

            if (!step.title) step.title = `Step ${i + 1}`;
            if (!step.description) step.description = '';

            // Ensure step has array data
            if (!step.array && output.structures.length > 0) {
                const arrStruct = output.structures.find(s => s.type === 'array');
                if (arrStruct) step.array = arrStruct.data;
            }

            // Validate pointers are within bounds
            if (step.pointers && step.array) {
                for (const [key, val] of Object.entries(step.pointers)) {
                    if (typeof val === 'number' && (val < 0 || val >= step.array.length)) {
                        step.pointers[key] = Math.max(0, Math.min(val, step.array.length - 1));
                    }
                }
            }

            // Validate highlight indices
            if (step.highlight && step.array) {
                step.highlight = step.highlight.filter(idx => idx >= 0 && idx < step.array.length);
            }
        }

        // Ensure at least one step has array data
        const hasArrayData = output.steps.some(s => s.array && s.array.length > 0);
        if (hasArrayData) {
            console.log('[Universal Array] Validated LLM output');
            return output;
        }

        return null;
    } catch (e) {
        console.error('[Universal Array] Validation error:', e.message);
        return null;
    }
}

/**
 * Generates deterministic array traversal fallback
 */
function generateArrayFallback(query) {
    console.log('[Universal Array] Generating fallback');

    const arrayMatch = query.match(/\[([0-9,\s\-]+)\]/);
    let data = [];

    if (arrayMatch) {
        data = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }

    if (data.length === 0) data = [5, 2, 8, 1, 9, 3, 7, 4, 6];

    const steps = [];

    steps.push({
        title: 'Initial Array',
        description: `Array: [${data.join(', ')}]`,
        array: data
    });

    // Simple traversal with highlights
    for (let i = 0; i < data.length; i++) {
        steps.push({
            title: `Visit Index ${i}`,
            description: `Value at [${i}] = ${data[i]}`,
            array: data,
            pointers: { i },
            highlight: [i]
        });
    }

    // Find max and min
    const max = Math.max(...data);
    const min = Math.min(...data);
    const maxIdx = data.indexOf(max);
    const minIdx = data.indexOf(min);

    steps.push({
        title: 'Analysis Complete',
        description: `Max: ${max} at [${maxIdx}], Min: ${min} at [${minIdx}]`,
        array: data,
        highlight: [maxIdx, minIdx],
        result: { max, min, maxIdx, minIdx }
    });

    return {
        structures: [{ id: 'arr', type: 'array', label: 'Array', data }],
        steps
    };
}

/**
 * Deterministic Generic Sort - catches "sort the array", "sort this", etc.
 * Defaults to bubble sort when no specific algorithm is mentioned
 */
function deterministicGenericSort(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();

    // Check if it's a generic sort request (has "sort" but no specific algorithm)
    const hasSort = queryLower.includes('sort');
    const hasSpecificSort = queryLower.includes('bubble') ||
        queryLower.includes('selection') ||
        queryLower.includes('insertion') ||
        queryLower.includes('quick') ||
        queryLower.includes('merge') ||
        queryLower.includes('heap');

    // Only handle generic sort requests
    if (!hasSort || hasSpecificSort) return null;

    const arrayMatch = query.match(/\[([0-9,\s\-]+)\]/);
    if (!arrayMatch) return null;

    let arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (arr.length === 0) return null;

    console.log(`[Generic Sort Executor] Using Bubble Sort for: [${arr.join(',')}]`);

    const steps = [];
    const original = [...arr];

    steps.push({
        title: "Initial Array",
        description: `Array to sort: [${arr.join(', ')}]`,
        array: [...arr]
    });

    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                steps.push({
                    title: `Compare [${j}] & [${j + 1}]`,
                    description: `${arr[j]} > ${arr[j + 1]}, swap`,
                    array: [...arr],
                    highlight: [j, j + 1]
                });
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                steps.push({
                    title: "Swapped",
                    description: `Now: [${arr.join(', ')}]`,
                    array: [...arr],
                    highlight: [j, j + 1]
                });
            }
        }
    }

    steps.push({
        title: "Sorted!",
        description: `Final: [${arr.join(', ')}]`,
        array: [...arr],
        result: [...arr]
    });

    return { structures: [{ id: "arr", type: "array", label: "Array", data: original }], steps };
}

/**
 * Deterministic Bubble Sort
 */
function deterministicBubbleSort(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();
    if (!queryLower.includes('bubble sort') && !queryLower.includes('bubble')) return null;

    const arrayMatch = query.match(/\[([0-9,\s\-]+)\]/);
    if (!arrayMatch) return null;

    let arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (arr.length === 0) return null;

    console.log(`[Bubble Sort Executor] Array: [${arr.join(',')}]`);

    const steps = [];
    const original = [...arr];

    steps.push({
        title: "Initial Array",
        description: `Array to sort: [${arr.join(', ')}]`,
        array: [...arr]
    });

    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                steps.push({
                    title: `Compare [${j}] & [${j + 1}]`,
                    description: `${arr[j]} > ${arr[j + 1]}, swap`,
                    array: [...arr],
                    highlight: [j, j + 1]
                });
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                steps.push({
                    title: "Swapped",
                    description: `Now: [${arr.join(', ')}]`,
                    array: [...arr],
                    highlight: [j, j + 1]
                });
            } else {
                steps.push({
                    title: `Compare [${j}] & [${j + 1}]`,
                    description: `${arr[j]} ≤ ${arr[j + 1]}, no swap`,
                    array: [...arr],
                    highlight: [j, j + 1]
                });
            }
        }
        steps.push({
            title: `Pass ${i + 1} Done`,
            description: `${arr[arr.length - 1 - i]} in position`,
            array: [...arr],
            highlight: [arr.length - 1 - i]
        });
    }

    steps.push({
        title: "Sorted!",
        description: `Final: [${arr.join(', ')}]`,
        array: [...arr],
        result: [...arr]
    });

    return { structures: [{ id: "arr", type: "array", label: "Array", data: original }], steps };
}

/**
 * Deterministic Selection Sort
 */
function deterministicSelectionSort(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();
    if (!queryLower.includes('selection sort') && !queryLower.includes('selection')) return null;

    const arrayMatch = query.match(/\[([0-9,\s\-]+)\]/);
    if (!arrayMatch) return null;

    let arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (arr.length === 0) return null;

    console.log(`[Selection Sort Executor] Array: [${arr.join(',')}]`);

    const steps = [];
    const original = [...arr];

    steps.push({
        title: "Initial Array",
        description: `Array to sort: [${arr.join(', ')}]`,
        array: [...arr]
    });

    for (let i = 0; i < arr.length - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }

        steps.push({
            title: `Find min in [${i}..${arr.length - 1}]`,
            description: `Min = ${arr[minIdx]} at index ${minIdx}`,
            array: [...arr],
            pointers: { i, min: minIdx },
            highlight: [i, minIdx]
        });

        if (minIdx !== i) {
            [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
            steps.push({
                title: `Swap [${i}] ↔ [${minIdx}]`,
                description: `Swapped ${arr[minIdx]} and ${arr[i]}`,
                array: [...arr],
                highlight: [i, minIdx]
            });
        }
    }

    steps.push({
        title: "Sorted!",
        description: `Final: [${arr.join(', ')}]`,
        array: [...arr],
        result: [...arr]
    });

    return { structures: [{ id: "arr", type: "array", label: "Array", data: original }], steps };
}

/**
 * Deterministic Insertion Sort
 */
function deterministicInsertionSort(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();
    if (!queryLower.includes('insertion sort') && !queryLower.includes('insertion')) return null;

    const arrayMatch = query.match(/\[([0-9,\s\-]+)\]/);
    if (!arrayMatch) return null;

    let arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (arr.length === 0) return null;

    console.log(`[Insertion Sort Executor] Array: [${arr.join(',')}]`);

    const steps = [];
    const original = [...arr];

    steps.push({
        title: "Initial Array",
        description: `Array to sort: [${arr.join(', ')}]`,
        array: [...arr]
    });

    for (let i = 1; i < arr.length; i++) {
        const key = arr[i];
        let j = i - 1;

        steps.push({
            title: `Insert ${key}`,
            description: `Key = ${key}, find position in sorted portion`,
            array: [...arr],
            pointers: { key: i },
            highlight: [i]
        });

        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;

        steps.push({
            title: `Placed at [${j + 1}]`,
            description: `${key} inserted, sorted portion: [0..${i}]`,
            array: [...arr],
            highlight: [j + 1]
        });
    }

    steps.push({
        title: "Sorted!",
        description: `Final: [${arr.join(', ')}]`,
        array: [...arr],
        result: [...arr]
    });

    return { structures: [{ id: "arr", type: "array", label: "Array", data: original }], steps };
}

/**
 * Deterministic Quick Sort
 */
function deterministicQuickSort(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();
    if (!queryLower.includes('quick sort') && !queryLower.includes('quicksort')) return null;

    const arrayMatch = query.match(/\[([0-9,\s\-]+)\]/);
    if (!arrayMatch) return null;

    let arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (arr.length === 0) return null;

    console.log(`[Quick Sort Executor] Array: [${arr.join(',')}]`);

    const steps = [];
    const original = [...arr];

    function quickSort(low, high) {
        if (low < high) {
            steps.push({
                title: `Partition [${low}..${high}]`,
                description: `Pivot = ${arr[high]}`,
                array: [...arr],
                pointers: { low, high, pivot: high },
                highlight: [high]
            });

            const pivotValue = arr[high];
            let i = low - 1;

            for (let j = low; j < high; j++) {
                if (arr[j] < pivotValue) {
                    i++;
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
            }
            [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
            const pi = i + 1;

            steps.push({
                title: `Pivot placed at [${pi}]`,
                description: `${pivotValue} now in correct position`,
                array: [...arr],
                highlight: [pi]
            });

            quickSort(low, pi - 1);
            quickSort(pi + 1, high);
        }
    }

    steps.push({
        title: "Initial Array",
        description: `Array to sort: [${arr.join(', ')}]`,
        array: [...arr]
    });

    quickSort(0, arr.length - 1);

    steps.push({
        title: "Sorted!",
        description: `Final: [${arr.join(', ')}]`,
        array: [...arr],
        result: [...arr]
    });

    return { structures: [{ id: "arr", type: "array", label: "Array", data: original }], steps };
}

/**
 * Deterministic Merge Sort
 */
function deterministicMergeSort(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();
    if (!queryLower.includes('merge sort') && !queryLower.includes('mergesort')) return null;

    const arrayMatch = query.match(/\[([0-9,\s\-]+)\]/);
    if (!arrayMatch) return null;

    let arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (arr.length === 0) return null;

    console.log(`[Merge Sort Executor] Array: [${arr.join(',')}]`);

    const steps = [];
    const original = [...arr];

    function merge(left, mid, right) {
        const leftArr = arr.slice(left, mid + 1);
        const rightArr = arr.slice(mid + 1, right + 1);

        steps.push({
            title: `Merge [${left}..${mid}] + [${mid + 1}..${right}]`,
            description: `[${leftArr.join(',')}] + [${rightArr.join(',')}]`,
            array: [...arr],
            highlight: Array.from({ length: right - left + 1 }, (_, i) => left + i)
        });

        let i = 0, j = 0, k = left;
        while (i < leftArr.length && j < rightArr.length) {
            if (leftArr[i] <= rightArr[j]) {
                arr[k++] = leftArr[i++];
            } else {
                arr[k++] = rightArr[j++];
            }
        }
        while (i < leftArr.length) arr[k++] = leftArr[i++];
        while (j < rightArr.length) arr[k++] = rightArr[j++];

        steps.push({
            title: `Merged`,
            description: `Result: [${arr.slice(left, right + 1).join(',')}]`,
            array: [...arr],
            highlight: Array.from({ length: right - left + 1 }, (_, i) => left + i)
        });
    }

    function mergeSort(left, right) {
        if (left < right) {
            const mid = Math.floor((left + right) / 2);
            mergeSort(left, mid);
            mergeSort(mid + 1, right);
            merge(left, mid, right);
        }
    }

    steps.push({
        title: "Initial Array",
        description: `Array to sort: [${arr.join(', ')}]`,
        array: [...arr]
    });

    mergeSort(0, arr.length - 1);

    steps.push({
        title: "Sorted!",
        description: `Final: [${arr.join(', ')}]`,
        array: [...arr],
        result: [...arr]
    });

    return { structures: [{ id: "arr", type: "array", label: "Array", data: original }], steps };
}

/**
 * Deterministic 3Sum - finds triplets that sum to zero
 */
function deterministicThreeSum(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();

    // Check if it's a 3Sum problem
    const isThreeSum =
        queryLower.includes('3sum') ||
        queryLower.includes('triplets') ||
        queryLower.includes('three sum') ||
        (queryLower.includes('three') && queryLower.includes('sum') && queryLower.includes('zero')) ||
        (queryLower.includes('return') && queryLower.includes('triplets') && queryLower.includes('sum')) ||
        (queryLower.includes('array') && queryLower.includes('three') && queryLower.includes('equal') && queryLower.includes('0'));

    if (!isThreeSum) return null;

    // Extract array from query
    const arrayMatch = query.match(/\[([-\d,\s]+)\]/);
    if (!arrayMatch) return null;

    let arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (arr.length < 3) return null;

    console.log(`[3Sum Executor] Array: [${arr.join(',')}]`);

    const steps = [];
    const original = [...arr];
    const results = [];

    // Sort the array first (common 3Sum approach)
    const sortedArr = [...arr].sort((a, b) => a - b);

    steps.push({
        title: "Initial Array",
        description: `Input array: [${arr.join(', ')}]. Sort for 3Sum algorithm.`,
        array: [...arr],
        result: []
    });

    steps.push({
        title: "Sorted Array",
        description: `Sort array: [${sortedArr.join(', ')}]`,
        array: [...sortedArr],
        result: []
    });

    // 3Sum algorithm with three pointers
    for (let i = 0; i < sortedArr.length - 2; i++) {
        // Skip duplicates for first element
        if (i > 0 && sortedArr[i] === sortedArr[i - 1]) continue;

        let left = i + 1;
        let right = sortedArr.length - 1;

        steps.push({
            title: `Fix element ${sortedArr[i]} at index ${i}`,
            description: `Set left=${left} (${sortedArr[left]}), right=${right} (${sortedArr[right]})`,
            array: [...sortedArr],
            pointers: { i, left, right },
            highlight: [i, left, right]
        });

        while (left < right) {
            const sum = sortedArr[i] + sortedArr[left] + sortedArr[right];

            if (sum === 0) {
                const triplet = [sortedArr[i], sortedArr[left], sortedArr[right]];
                results.push(triplet);

                steps.push({
                    title: `Triplet found: [${triplet.join(', ')}]`,
                    description: `${sortedArr[i]} + ${sortedArr[left]} + ${sortedArr[right]} = 0`,
                    array: [...sortedArr],
                    pointers: { i, left, right },
                    highlight: [i, left, right],
                    result: [...results]
                });

                // Skip duplicates
                while (left < right && sortedArr[left] === sortedArr[left + 1]) left++;
                while (left < right && sortedArr[right] === sortedArr[right - 1]) right--;

                left++;
                right--;
            } else if (sum < 0) {
                steps.push({
                    title: `Sum ${sum} < 0`,
                    description: `Move left pointer right to increase sum`,
                    array: [...sortedArr],
                    pointers: { i, left, right },
                    highlight: [i, left, right]
                });
                left++;
            } else {
                steps.push({
                    title: `Sum ${sum} > 0`,
                    description: `Move right pointer left to decrease sum`,
                    array: [...sortedArr],
                    pointers: { i, left, right },
                    highlight: [i, left, right]
                });
                right--;
            }
        }
    }

    steps.push({
        title: "All triplets found",
        description: `Triplets that sum to zero: ${results.length > 0 ? JSON.stringify(results) : 'None'}`,
        array: [...sortedArr],
        result: results
    });

    return {
        structures: [{ id: "arr", type: "array", label: "Array", data: original }],
        steps
    };
}

/**
 * Deterministic Two Sum - finds two numbers that sum to target
 */
function deterministicTwoSum(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();

    // Check if it's a Two Sum problem
    const isTwoSum =
        queryLower.includes('two sum') ||
        (queryLower.includes('two') && queryLower.includes('sum') && queryLower.includes('target')) ||
        (queryLower.includes('find') && queryLower.includes('two') && queryLower.includes('numbers') && queryLower.includes('sum')) ||
        (queryLower.includes('array') && queryLower.includes('target') && queryLower.includes('indices'));

    if (!isTwoSum) return null;

    // Extract array and target from query
    const arrayMatch = query.match(/\[([-\d,\s]+)\]/g);
    if (!arrayMatch || arrayMatch.length < 1) return null;

    let arr = arrayMatch[0].replace(/[\[\]]/g, '').split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (arr.length < 2) return null;

    // Try to find target
    const targetMatch = query.match(/target[^0-9]*([-\d]+)/i) || query.match(/equals?\s+([-\d]+)/i);
    let target = 0;
    if (targetMatch) {
        target = parseInt(targetMatch[1]);
    } else {
        // If no explicit target, look for a number near the context of sum
        const numbers = query.match(/[-\d]+/g);
        if (numbers && numbers.length > arr.length) {
            // Take the last number as target if it's not part of the array
            target = parseInt(numbers[numbers.length - 1]);
        }
    }

    console.log(`[TwoSum Executor] Array: [${arr.join(',')}] Target: ${target}`);

    const steps = [];
    const original = [...arr];
    const seen = new Map();

    steps.push({
        title: "Initial Array",
        description: `Input array: [${arr.join(', ')}], target: ${target}`,
        array: [...arr],
        variables: { target }
    });

    for (let i = 0; i < arr.length; i++) {
        const complement = target - arr[i];

        steps.push({
            title: `Check index ${i}`,
            description: `Value: ${arr[i]}, looking for complement: ${complement}`,
            array: [...arr],
            pointers: { i },
            highlight: [i],
            variables: { target, complement }
        });

        if (seen.has(complement)) {
            const j = seen.get(complement);
            steps.push({
                title: `Found pair: [${j}, ${i}]`,
                description: `${arr[j]} + ${arr[i]} = ${arr[j] + arr[i]} = ${target}`,
                array: [...arr],
                pointers: { i, j },
                highlight: [j, i],
                result: [j, i]
            });
            return {
                structures: [{ id: "arr", type: "array", label: "Array", data: original }],
                steps
            };
        }

        seen.set(arr[i], i);
    }

    steps.push({
        title: "No pair found",
        description: `No two numbers sum to ${target}`,
        array: [...arr],
        result: []
    });

    return {
        structures: [{ id: "arr", type: "array", label: "Array", data: original }],
        steps
    };
}

/**
 * Deterministic Container With Most Water
 */
function deterministicContainerWithMostWater(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();

    // Check if it's a Container With Most Water problem
    const isContainer =
        queryLower.includes('container') && queryLower.includes('water') ||
        queryLower.includes('most water') ||
        queryLower.includes('maximiz') && queryLower.includes('area') ||
        (queryLower.includes('array') && queryLower.includes('area') && queryLower.includes('vertical'));

    if (!isContainer) return null;

    // Extract array from query
    const arrayMatch = query.match(/\[([-\d,\s]+)\]/);
    if (!arrayMatch) return null;

    let arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (arr.length < 2) return null;

    console.log(`[ContainerWater Executor] Array: [${arr.join(',')}]`);

    const steps = [];
    const original = [...arr];

    steps.push({
        title: "Initial Heights",
        description: `Heights: [${arr.join(', ')}]`,
        array: [...arr],
        result: []
    });

    let left = 0;
    let right = arr.length - 1;
    let maxArea = 0;
    let bestPair = [0, 0];

    steps.push({
        title: "Start Two Pointers",
        description: `Left at ${left} (height ${arr[left]}), Right at ${right} (height ${arr[right]})`,
        array: [...arr],
        pointers: { left, right },
        highlight: [left, right]
    });

    while (left < right) {
        const width = right - left;
        const height = Math.min(arr[left], arr[right]);
        const area = width * height;

        steps.push({
            title: `Calculate Area`,
            description: `Width: ${width}, Height: ${height}, Area: ${area}`,
            array: [...arr],
            pointers: { left, right },
            highlight: [left, right],
            variables: { width, height, area }
        });

        if (area > maxArea) {
            maxArea = area;
            bestPair = [left, right];
            steps.push({
                title: `New Max Area: ${area}`,
                description: `Between indices [${left}, ${right}]`,
                array: [...arr],
                pointers: { left, right },
                highlight: [left, right],
                variables: { maxArea }
            });
        }

        if (arr[left] < arr[right]) {
            steps.push({
                title: `Move Left Pointer`,
                description: `Left height ${arr[left]} < Right height ${arr[right]}`,
                array: [...arr],
                pointers: { left, right },
                highlight: [left]
            });
            left++;
        } else {
            steps.push({
                title: `Move Right Pointer`,
                description: `Right height ${arr[right]} <= Left height ${arr[left]}`,
                array: [...arr],
                pointers: { left, right },
                highlight: [right]
            });
            right--;
        }
    }

    steps.push({
        title: "Maximum Area Found",
        description: `Max area: ${maxArea} between indices [${bestPair[0]}, ${bestPair[1]}]`,
        array: [...arr],
        highlight: bestPair,
        result: [maxArea]
    });

    return {
        structures: [{ id: "arr", type: "array", label: "Heights", data: original }],
        steps
    };
}

/**
 * Deterministic Best Time to Buy and Sell Stock
 */
function deterministicBuySellStock(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();

    // Check if it's a Buy/Sell Stock problem
    const isStock =
        queryLower.includes('buy') && queryLower.includes('sell') ||
        queryLower.includes('stock') && queryLower.includes('profit') ||
        queryLower.includes('maximiz') && queryLower.includes('profit') ||
        (queryLower.includes('array') && queryLower.includes('profit') && queryLower.includes('buy'));

    if (!isStock) return null;

    // Extract array from query
    const arrayMatch = query.match(/\[([-\d,\s]+)\]/);
    if (!arrayMatch) return null;

    let arr = arrayMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (arr.length < 2) return null;

    console.log(`[BuySellStock Executor] Array: [${arr.join(',')}]`);

    const steps = [];
    const original = [...arr];

    steps.push({
        title: "Initial Prices",
        description: `Prices: [${arr.join(', ')}]`,
        array: [...arr],
        result: []
    });

    let minPrice = arr[0];
    let maxProfit = 0;
    let buyDay = 0;
    let sellDay = 0;
    let currentBestBuy = 0;

    steps.push({
        title: "Initialize",
        description: `Min price: ${minPrice} at day 0, Max profit: ${maxProfit}`,
        array: [...arr],
        pointers: { min: 0 },
        highlight: [0],
        variables: { minPrice, maxProfit }
    });

    for (let i = 1; i < arr.length; i++) {
        steps.push({
            title: `Day ${i}: Price ${arr[i]}`,
            description: `Current price: ${arr[i]}`,
            array: [...arr],
            pointers: { i, min: currentBestBuy },
            highlight: [i],
            variables: { minPrice, maxProfit }
        });

        if (arr[i] < minPrice) {
            minPrice = arr[i];
            currentBestBuy = i;
            steps.push({
                title: `Update Min Price`,
                description: `New minimum: ${minPrice} at day ${i}`,
                array: [...arr],
                pointers: { i, min: i },
                highlight: [i],
                variables: { minPrice }
            });
        } else {
            const profit = arr[i] - minPrice;
            steps.push({
                title: `Calculate Profit`,
                description: `Sell at ${arr[i]} - Buy at ${minPrice} = ${profit}`,
                array: [...arr],
                pointers: { i, min: currentBestBuy },
                highlight: [currentBestBuy, i],
                variables: { profit }
            });

            if (profit > maxProfit) {
                maxProfit = profit;
                buyDay = currentBestBuy;
                sellDay = i;
                steps.push({
                    title: `New Max Profit: ${maxProfit}`,
                    description: `Buy at day ${buyDay} (${arr[buyDay]}), Sell at day ${sellDay} (${arr[sellDay]})`,
                    array: [...arr],
                    pointers: { buy: buyDay, sell: sellDay },
                    highlight: [buyDay, sellDay],
                    variables: { maxProfit }
                });
            }
        }
    }

    steps.push({
        title: "Maximum Profit Found",
        description: `Max profit: ${maxProfit} (Buy at ${arr[buyDay]} on day ${buyDay}, Sell at ${arr[sellDay]} on day ${sellDay})`,
        array: [...arr],
        highlight: [buyDay, sellDay],
        result: [maxProfit]
    });

    return {
        structures: [{ id: "arr", type: "array", label: "Prices", data: original }],
        steps
    };
}

/**
 * Parse tree array from user query like "BST [4,2,6,1,3,5,7]"
 */
function parseTreeFromQuery(query) {
    if (!query) return null;

    // Match patterns like [4,2,6,1,3,5,7] or [4, 2, 6, 1, 3, 5, 7]
    const treeMatch = query.match(/\[([0-9,\s]+)\]/);
    if (treeMatch) {
        try {
            const values = treeMatch[1].split(',').map(s => {
                const trimmed = s.trim();
                return trimmed === 'null' ? null : parseInt(trimmed);
            }).filter(v => !isNaN(v) || v === null);
            return values;
        } catch (e) {
            return null;
        }
    }
    return null;
}

/**
 * Parse operations from user query like "insert 0 then remove 4 then insert 8"
 */
function parseOperationsFromQuery(query) {
    if (!query) return [];

    const queryLower = query.toLowerCase();
    const operations = [];

    // Match "insert X" patterns
    const insertMatches = queryLower.matchAll(/insert\s+(\d+)/gi);
    for (const match of insertMatches) {
        operations.push({ type: 'insert', value: parseInt(match[1]) });
    }

    // Match "remove X" or "delete X" patterns
    const removeMatches = queryLower.matchAll(/(?:remove|delete)\s+(\d+)/gi);
    for (const match of removeMatches) {
        operations.push({ type: 'remove', value: parseInt(match[1]) });
    }

    return operations;
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
 * - Enforces BST rules for all operations
 */
function treeExecutor(step, previousTree, queryOperations = []) {
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
            // Only perform algorithmic corrections if previousTree is provided (full validation mode)
            // If previousTree is null, only do basic validation (minimal mode)
            if (previousTree && Array.isArray(previousTree)) {
                // Check if this is an insert/remove operation
                // LLM may use "Visit X" in title but "Insert X" in description
                const title = (validated.title || '').toLowerCase();
                const description = (validated.description || '').toLowerCase();
                const fullText = title + ' ' + description;

                // Detect insert operation - check title AND description with improved patterns
                const insertMatch = fullText.match(/insert[:\s]+(\d+)/i) ||
                    fullText.match(/inserting[:\s]+(\d+)/i) ||
                    fullText.match(/add[:\s]+(\d+)/i) ||
                    title.match(/visit\s+(\d+)/i) && description.includes('insert');

                if (previousTree && Array.isArray(previousTree)) {
                    const treeValues = previousTree.filter(v => v !== null && v !== undefined);

                    // Check for insert with improved pattern matching
                    const insertDirectMatch = fullText.match(/insert[:\s]+(\d+)/i) ||
                        fullText.match(/inserting[:\s]+(\d+)/i) ||
                        fullText.match(/add[:\s]+(\d+)/i);
                    if (insertDirectMatch) {
                        const valueToInsert = parseInt(insertDirectMatch[1]);
                        console.log(`[BST Executor] Detected INSERT ${valueToInsert}, previousTree has ${treeValues.length} nodes`);

                        if (!treeValues.includes(valueToInsert)) {
                            const correctTree = bstInsertHelper(previousTree, valueToInsert);
                            console.log(`[BST Executor] After INSERT ${valueToInsert}:`, correctTree.filter(v => v !== null));
                            validated.tree = correctTree;
                        }
                    }

                    // Check for remove with improved pattern matching
                    const removeDirectMatch = fullText.match(/remove[:\s]+(\d+)/i) ||
                        fullText.match(/removing[:\s]+(\d+)/i) ||
                        fullText.match(/delete[:\s]+(\d+)/i) ||
                        fullText.match(/deleting[:\s]+(\d+)/i);
                    if (removeDirectMatch) {
                        const valueToRemove = parseInt(removeDirectMatch[1]);
                        console.log(`[BST Executor] Detected REMOVE ${valueToRemove}, previousTree has ${treeValues.length} nodes`);

                        if (treeValues.includes(valueToRemove)) {
                            const correctTree = bstRemoveHelper(previousTree, valueToRemove);
                            console.log(`[BST Executor] After REMOVE ${valueToRemove}:`, correctTree.filter(v => v !== null));
                            validated.tree = correctTree;
                        } else {
                            console.log(`[BST Executor] Value ${valueToRemove} not in tree, skipping remove`);
                        }
                    }
                }
            }

            // Always perform basic validation (remove duplicates, trim nulls, validate BST structure)
            // Remove duplicates
            validated.tree = removeDuplicatesFromTree(validated.tree);
            // Trim trailing nulls
            validated.tree = trimTrailingNulls(validated.tree);

            // Validate BST properties and fix if needed
            validated.tree = validateAndFixBSTStructure(validated.tree);
        }
    }

    // Clean up result array to ensure consistency with tree structure
    if (Array.isArray(validated.result) && Array.isArray(validated.tree)) {
        const treeValues = new Set(validated.tree.filter(v => v !== null && v !== undefined));
        validated.result = validated.result.filter(v => treeValues.has(v));
        validated.result = [...new Set(validated.result)];
    }

    // For tree operations, generate path information for visualization
    // Only do this in full validation mode (when previousTree is provided)
    if (previousTree && Array.isArray(validated.tree) && validated.tree.length > 0) {
        const title = (validated.title || '').toLowerCase();
        const description = (validated.description || '').toLowerCase();

        // Check if this is a search, insert, or remove operation that needs path highlighting
        const isSearchOperation = title.includes('search') || title.includes('find') || description.includes('search') || description.includes('find');
        const isInsertOperation = title.includes('insert') || title.includes('inserting') || description.includes('insert') || description.includes('inserting');
        const isRemoveOperation = title.includes('remove') || title.includes('delete') || description.includes('remove') || description.includes('delete');
        const isTraversalOperation = title.includes('traversal') ||
            title.includes('visit') ||
            description.includes('traversal') ||
            description.includes('visit') ||
            title.includes('inorder') ||
            title.includes('preorder') ||
            title.includes('postorder');

        // Generate path for search operations
        if (isSearchOperation) {
            const searchMatch = title.match(/search[:\s]+(\d+)/i) || description.match(/search[:\s]+(\d+)/i) ||
                title.match(/find[:\s]+(\d+)/i) || description.match(/find[:\s]+(\d+)/i);
            if (searchMatch) {
                const searchValue = parseInt(searchMatch[1]);
                const treeRoot = levelOrderToTree(validated.tree);
                if (treeRoot) {
                    const path = findPathToNode(treeRoot, searchValue);
                    if (path && path.length > 0) {
                        // Add path to meta if not already present
                        if (!validated.path) {
                            validated.path = path;
                        }
                    }
                }
            }
        }

        // Generate path for insert operations (path to where the node would be inserted)
        if (isInsertOperation) {
            const insertMatch = title.match(/insert[:\s]+(\d+)/i) || description.match(/insert[:\s]+(\d+)/i) ||
                title.match(/inserting[:\s]+(\d+)/i) || description.match(/inserting[:\s]+(\d+)/i);
            if (insertMatch) {
                const insertValue = parseInt(insertMatch[1]);
                const treeRoot = levelOrderToTree(validated.tree);
                if (treeRoot) {
                    const path = findPathToInsert(treeRoot, insertValue);
                    if (path && path.length > 0) {
                        // Add path to meta if not already present
                        if (!validated.path) {
                            validated.path = path;
                        }
                    }
                }
            }
        }

        // Generate path for remove operations
        if (isRemoveOperation) {
            const removeMatch = title.match(/remove[:\s]+(\d+)/i) || description.match(/remove[:\s]+(\d+)/i) ||
                title.match(/delete[:\s]+(\d+)/i) || description.match(/delete[:\s]+(\d+)/i) ||
                title.match(/removing[:\s]+(\d+)/i) || description.match(/deleting[:\s]+(\d+)/i);
            if (removeMatch) {
                const removeValue = parseInt(removeMatch[1]);
                const treeRoot = levelOrderToTree(validated.tree);
                if (treeRoot) {
                    const path = findPathToNode(treeRoot, removeValue);
                    if (path && path.length > 0) {
                        // Add path to meta if not already present
                        if (!validated.path) {
                            validated.path = path;
                        }
                    }
                }
            }
        }

        // Handle traversal operations
        if (isTraversalOperation) {
            // Get the actual inorder/preorder/postorder from the current tree
            const actualTreeRoot = levelOrderToTree(validated.tree);
            if (actualTreeRoot) {
                let expectedTraversal = [];

                // Determine traversal type based on title
                if (title.includes('inorder') || description.includes('inorder')) {
                    expectedTraversal = getInorderTraversal(actualTreeRoot);
                } else if (title.includes('preorder') || description.includes('preorder')) {
                    expectedTraversal = getPreorderTraversal(actualTreeRoot);
                } else if (title.includes('postorder') || description.includes('postorder')) {
                    expectedTraversal = getPostorderTraversal(actualTreeRoot);
                } else {
                    // Default to inorder for general traversals
                    expectedTraversal = getInorderTraversal(actualTreeRoot);
                }

                // If the result is empty or doesn't match expected traversal length, use the expected one
                if (validated.result.length === 0 ||
                    (validated.result.length !== expectedTraversal.length &&
                        expectedTraversal.length <= validated.result.length)) {
                    validated.result = expectedTraversal;
                } else {
                    // Otherwise, filter the result to only include values that exist in the tree
                    const treeValues = new Set(validated.tree.filter(v => v !== null && v !== undefined));
                    validated.result = validated.result.filter(v => treeValues.has(v));
                    validated.result = [...new Set(validated.result)];
                }
            }
        }
    }

    return validated;
}

/**
 * Find path from root to a specific node value
 */
function findPathToNode(root, targetValue) {
    const path = [];

    function dfs(node, currentPath) {
        if (!node) return false;

        currentPath.push(node.value);

        if (node.value === targetValue) {
            path.push(...currentPath);
            return true;
        }

        if (dfs(node.left, currentPath) || dfs(node.right, currentPath)) {
            return true;
        }

        currentPath.pop();
        return false;
    }

    dfs(root, []);
    return path;
}

/**
 * Find path where a new value would be inserted
 */
function findPathToInsert(root, insertValue) {
    const path = [];

    function dfs(node, currentPath) {
        if (!node) {
            // If we reach a null node, this is where we'd insert
            return true;
        }

        currentPath.push(node.value);

        if (insertValue === node.value) {
            // Value already exists, return path to this node
            path.push(...currentPath);
            return true;
        } else if (insertValue < node.value) {
            if (dfs(node.left, currentPath)) {
                if (path.length === 0) path.push(...currentPath);
                return true;
            }
        } else {
            if (dfs(node.right, currentPath)) {
                if (path.length === 0) path.push(...currentPath);
                return true;
            }
        }

        currentPath.pop();
        return false;
    }

    dfs(root, []);
    return path;
}

/**
 * Get inorder traversal of a tree
 */
function getInorderTraversal(root) {
    const result = [];
    function inorder(node) {
        if (!node) return;
        inorder(node.left);
        result.push(node.value);
        inorder(node.right);
    }
    inorder(root);
    return result;
}

/**
 * Get preorder traversal of a tree
 */
function getPreorderTraversal(root) {
    const result = [];
    function preorder(node) {
        if (!node) return;
        result.push(node.value);
        preorder(node.left);
        preorder(node.right);
    }
    preorder(root);
    return result;
}

/**
 * Get postorder traversal of a tree
 */
function getPostorderTraversal(root) {
    const result = [];
    function postorder(node) {
        if (!node) return;
        postorder(node.left);
        postorder(node.right);
        result.push(node.value);
    }
    postorder(root);
    return result;
}

/**
 * Validates and fixes BST structure to ensure BST properties are maintained
 * - Ensures left < parent < right for all nodes
 * - Removes duplicates
 * - Rebuilds tree if BST properties are violated
 */
function validateAndFixBSTStructure(tree) {
    if (!Array.isArray(tree) || tree.length === 0) return tree;

    // Extract valid values from the tree
    const validValues = tree.filter(v => v !== null && v !== undefined && !isNaN(v));

    if (validValues.length === 0) return tree;

    // Check if the tree structure is valid BST by converting to BST and back
    try {
        // Build a proper BST from the values
        const root = buildBSTFromValues(validValues);
        const fixedTree = treeToLevelOrder(root);

        // Compare if the original tree was already a valid BST
        const originalRoot = levelOrderToTree(tree);
        if (originalRoot && isValidBST(originalRoot)) {
            // Original tree was valid, return as is
            return tree;
        } else {
            // Original tree was invalid, return the fixed version
            console.log(`[BST Validator] Fixed invalid BST structure. Original: [${tree.filter(v => v !== null).slice(0, 10)}], Fixed: [${fixedTree.filter(v => v !== null).slice(0, 10)}]`);
            return fixedTree;
        }
    } catch (e) {
        console.warn(`[BST Validator] Error validating BST: ${e.message}`);
        return tree; // Return original if validation fails
    }
}

/**
 * Build a valid BST from an array of values
 */
function buildBSTFromValues(values) {
    if (!values || values.length === 0) return null;

    let root = null;
    for (const val of values) {
        if (typeof val === 'number' && !isNaN(val)) {
            root = insertIntoBST(root, val);
        }
    }
    return root;
}

/**
 * Insert value into BST (maintains BST properties)
 */
function insertIntoBST(node, value) {
    if (node === null) {
        return { value, left: null, right: null };
    }
    if (value < node.value) {
        node.left = insertIntoBST(node.left, value);
    } else if (value > node.value) {
        node.right = insertIntoBST(node.right, value);
    }
    // If value === node.value, we skip to avoid duplicates
    return node;
}

/**
 * Check if a tree is a valid BST
 */
function isValidBST(node, min = -Infinity, max = Infinity) {
    if (node === null) return true;

    if (node.value <= min || node.value >= max) return false;

    return isValidBST(node.left, min, node.value) &&
        isValidBST(node.right, node.value, max);
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

/**
 * Universal Tree Executor - Handles any tree-related query
 * 1. Detects if query is tree-related
 * 2. Validates and corrects LLM output
 * 3. Provides deterministic fallback if LLM output is invalid
 */
function universalTreeExecutor(llmOutput, query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();

    // Check if this is a tree-related query with more specific detection
    const isTreeQuery = checkIfTreeQuery(queryLower);

    if (!isTreeQuery) return null;

    console.log(`[Universal Tree Executor] Processing: "${query.substring(0, 50)}..."`);

    // If we have LLM output, validate and correct it only if it appears to be invalid
    if (llmOutput && llmOutput.steps && Array.isArray(llmOutput.steps) && llmOutput.steps.length > 0) {
        // Check if the LLM output already looks valid for tree operations
        const llmOutputLooksValid = checkIfLlmOutputIsValidForQuery(llmOutput, query);

        if (!llmOutputLooksValid) {
            const correctedOutput = validateAndCorrectTreeOutput(llmOutput, query);
            if (correctedOutput) {
                return correctedOutput;
            }
        } else {
            // LLM output looks valid, return as is but still apply minimal corrections
            return llmOutput;
        }
    }

    // Fallback: Generate deterministic tree visualization
    return generateTreeFallback(query);
}

/**
 * Improved tree query detection with better prioritization
 */
function checkIfTreeQuery(queryLower) {
    // Strong tree indicators - these should take priority over array detection
    const strongTreeIndicators = [
        'bst', 'binary search tree', 'binary tree', 'tree',
        'inorder', 'preorder', 'postorder', 'traversal',
        'insert.*into.*tree', 'remove.*from.*tree', 'delete.*from.*tree',
        'search.*in.*tree', 'find.*in.*tree', 'traverse.*tree',
        'root.*left.*right', 'node.*tree', 'leaf.*tree',
        'construct.*tree', 'build.*tree', 'create.*tree'
    ];

    // Check for strong tree indicators
    for (const indicator of strongTreeIndicators) {
        if (new RegExp(indicator, 'i').test(queryLower)) {
            return true;
        }
    }

    // Check for tree operations with numbers (like "insert 4 2 6 1 3 5 7")
    const treeOperationPattern = /(insert|remove|delete|search|find).*\d.*\d/;
    if (treeOperationPattern.test(queryLower) &&
        (queryLower.includes('tree') || queryLower.includes('bst') || queryLower.includes('binary'))) {
        return true;
    }

    // Check for specific tree operation sequences - this is the key improvement
    // For cases like "insert 4 2 6 1 3 5 7 then remove 1 insert 0 remove 4 insert 9 and then traverse"
    const multiTreeOperationPattern = /insert.*\d+.*\d+.*\d+|insert.*\d+.*and.*remove|insert.*\d+.*then.*remove|remove.*\d+.*then.*insert|perform.*operations.*on.*tree|create.*tree.*with.*insert|traverse.*tree.*using.*inorder/;
    if (multiTreeOperationPattern.test(queryLower)) {
        return true;
    }

    // Check for specific tree operation sequences
    const multiOperationPattern = /insert.*and.*remove|remove.*and.*insert|insert.*then.*remove|remove.*then.*insert|perform.*operations/;
    if (multiOperationPattern.test(queryLower) &&
        (/\[([0-9,\s]+)\]/.test(queryLower) || queryLower.includes('tree'))) {
        return true;
    }

    // Additional check for BST operations patterns
    const bstPattern = /bst.*insert|insert.*into.*bst|binary.*search.*tree.*insert|create.*empty.*tree.*then.*insert/;
    if (bstPattern.test(queryLower)) {
        return true;
    }

    return false;
}

/**
 * Check if LLM output appears valid for the given query
 * This prevents executors from overriding correct LLM responses
 */
function checkIfLlmOutputIsValidForQuery(llmOutput, query) {
    if (!llmOutput || !Array.isArray(llmOutput.steps) || llmOutput.steps.length === 0) {
        return false;
    }

    const queryLower = query.toLowerCase();

    // Check if the steps seem to match the query intent
    const stepTitles = llmOutput.steps.map(step => (step.title || '').toLowerCase());
    const stepDescriptions = llmOutput.steps.map(step => (step.description || '').toLowerCase());
    const allText = (stepTitles.join(' ') + ' ' + stepDescriptions.join(' ')).toLowerCase();

    // For binary search queries - very specific matching
    if (queryLower.includes('binary search')) {
        return allText.includes('binary') && allText.includes('search') ||
            allText.includes('mid') && (allText.includes('left') || allText.includes('right')) ||
            allText.includes('found') && allText.includes('target');
    }

    // For tree traversal queries
    if (queryLower.includes('inorder') || queryLower.includes('preorder') || queryLower.includes('postorder')) {
        return allText.includes('visit') && (allText.includes('left') || allText.includes('right')) ||
            allText.includes('travers') ||
            allText.includes('inorder') || allText.includes('preorder') || allText.includes('postorder');
    }

    // For insert/remove operations
    if (queryLower.includes('insert') || queryLower.includes('remove') || queryLower.includes('delete')) {
        return allText.includes('insert') || allText.includes('remove') ||
            allText.includes('delete') || allText.includes('add');
    }

    // For sorting operations
    if (queryLower.includes('sort')) {
        return allText.includes('sort') && (allText.includes('compare') || allText.includes('swap'));
    }

    // For linear search
    if (queryLower.includes('linear search')) {
        return allText.includes('linear') && allText.includes('search') ||
            allText.includes('check') && allText.includes('index');
    }

    // For two pointer problems
    if (queryLower.includes('two pointer') || queryLower.includes('two pointer')) {
        return allText.includes('left') && allText.includes('right') ||
            allText.includes('pointer') && (allText.includes('left') || allText.includes('right'));
    }

    // For sliding window
    if (queryLower.includes('sliding window') || queryLower.includes('window')) {
        return allText.includes('window') || allText.includes('slide') ||
            allText.includes('left') && allText.includes('right') && allText.includes('sum');
    }

    // For specific array operations like max/min finding
    if (queryLower.includes('find') && (queryLower.includes('max') || queryLower.includes('min'))) {
        return allText.includes('max') || allText.includes('min') ||
            allText.includes('largest') || allText.includes('smallest');
    }

    // For Two Sum problems
    if (queryLower.includes('two sum') || (queryLower.includes('two') && queryLower.includes('sum'))) {
        return allText.includes('two') && allText.includes('sum') ||
            allText.includes('target') || allText.includes('pair');
    }

    // For 3Sum problems
    if (queryLower.includes('3sum') || (queryLower.includes('three') && queryLower.includes('sum'))) {
        return allText.includes('three') && allText.includes('sum') ||
            allText.includes('triplet') || allText.includes('zero');
    }

    // For container with most water
    if (queryLower.includes('container') && queryLower.includes('water')) {
        return allText.includes('area') && (allText.includes('left') || allText.includes('right')) ||
            allText.includes('water') || allText.includes('maximize');
    }

    // For stock buy/sell problems
    if (queryLower.includes('buy') && queryLower.includes('sell') || queryLower.includes('stock')) {
        return allText.includes('buy') && allText.includes('sell') ||
            allText.includes('price') && allText.includes('profit');
    }

    // If we can't determine the intent clearly, be conservative and let validation run
    return false;
}

/**
 * Validates and corrects LLM output for tree problems
 */
function validateAndCorrectTreeOutput(llmOutput, query) {
    try {
        const output = JSON.parse(JSON.stringify(llmOutput));

        // Ensure structures include tree
        if (!output.structures) output.structures = [];

        const hasTree = output.structures.some(s => s.type === 'tree' || s.id === 'tree');
        if (!hasTree) {
            // Extract tree from query if possible
            const treeData = parseTreeFromQuery(query);
            output.structures.push({
                id: 'tree',
                type: 'tree',
                label: 'BST',
                data: treeData || [4, 2, 6, 1, 3, 5, 7] // default tree
            });
        }

        // Validate each step has proper tree data
        let isValid = true;
        const treeStructure = output.structures.find(s => s.type === 'tree' || s.id === 'tree');
        let currentTree = treeStructure ? [...treeStructure.data] : [];

        // Check if the query contains multiple operations to better handle sequence
        const queryLower = query.toLowerCase();
        const hasMultiOps = hasMultipleTreeOperations(queryLower);

        for (let i = 0; i < output.steps.length; i++) {
            const step = output.steps[i];

            // Ensure step has title and description
            if (!step.title) step.title = `Step ${i + 1}`;
            if (!step.description) step.description = '';

            // Detect tree operations from title and description
            const titleLower = (step.title || '').toLowerCase();
            const descLower = (step.description || '').toLowerCase();
            const fullText = titleLower + ' ' + descLower;

            // Check for insert operation - improved pattern matching
            const insertMatch = fullText.match(/insert[:\s]+(\d+)/i) ||
                fullText.match(/inserting[:\s]+(\d+)/i) ||
                fullText.match(/add[:\s]+(\d+)/i);
            if (insertMatch) {
                const valueToInsert = parseInt(insertMatch[1]);
                if (!isNaN(valueToInsert)) {
                    currentTree = bstInsert(currentTree, valueToInsert);
                    console.log(`[BST Validator] Inserting ${valueToInsert}, new tree:`, currentTree.filter(v => v !== null));
                }
            }

            // Check for remove operation - improved pattern matching
            const removeMatch = fullText.match(/remove[:\s]+(\d+)/i) ||
                fullText.match(/removing[:\s]+(\d+)/i) ||
                fullText.match(/delete[:\s]+(\d+)/i) ||
                fullText.match(/deleting[:\s]+(\d+)/i);
            if (removeMatch) {
                const valueToRemove = parseInt(removeMatch[1]);
                if (!isNaN(valueToRemove)) {
                    currentTree = bstRemove(currentTree, valueToRemove);
                    console.log(`[BST Validator] Removing ${valueToRemove}, new tree:`, currentTree.filter(v => v !== null));
                }
            }

            // For multi-operation sequences, ensure tree consistency across steps
            if (hasMultiOps) {
                // If the step has a tree that differs significantly from our calculated currentTree,
                // use the step's tree as the basis for the next operation
                if (step.tree && Array.isArray(step.tree)) {
                    currentTree = [...step.tree];
                }
            }

            // Ensure step has tree field - use current tree if missing
            if (!step.tree || !Array.isArray(step.tree)) {
                step.tree = [...currentTree];
            } else {
                // If tree exists in the step, update currentTree to match for consistency
                currentTree = [...step.tree];
            }

            // Validate tree consistency
            if (i > 0 && step.tree && output.steps[i - 1].tree) {
                const prevTree = output.steps[i - 1].tree;
                // Basic validation - tree shouldn't change drastically without reason
                const prevCount = prevTree.filter(v => v !== null && v !== undefined).length;
                const currCount = step.tree.filter(v => v !== null && v !== undefined).length;

                // If counts differ significantly without insert/remove indication, might be invalid
                if (Math.abs(currCount - prevCount) > 1) {
                    // Use current tree instead
                    step.tree = [...currentTree];
                }
            }
        }

        // Ensure at least one step has tree data
        const hasTreeData = output.steps.some(s => s.tree && Array.isArray(s.tree) && s.tree.length > 0);
        if (hasTreeData) {
            console.log('[Universal Tree] Validated and corrected LLM output');
            return output;
        }

        return null;
    } catch (e) {
        console.error('[Universal Tree] Validation error:', e.message);
        return null;
    }
}

/**
 * Generates deterministic tree fallback based on query
 */
function generateTreeFallback(query) {
    console.log('[Universal Tree] Generating fallback visualization');

    // Extract tree data from query if present
    const treeData = parseTreeFromQuery(query);
    let tree = treeData || [4, 2, 6, 1, 3, 5, 7]; // default tree

    // Detect operation type from query with improved parsing
    const queryLower = query.toLowerCase();

    // Check for multiple operations in sequence first
    if (hasMultipleTreeOperations(queryLower)) {
        return generateMultiOperationSequence(tree, query, queryLower);
    }

    if (queryLower.includes('inorder')) {
        return generateInorderTraversal(tree, query);
    } else if (queryLower.includes('preorder')) {
        return generatePreorderTraversal(tree, query);
    } else if (queryLower.includes('postorder')) {
        return generatePostorderTraversal(tree, query);
    } else if (queryLower.includes('insert')) {
        return generateInsertOperation(tree, query);
    } else if (queryLower.includes('remove') || queryLower.includes('delete')) {
        return generateRemoveOperation(tree, query);
    } else if (queryLower.includes('search') || queryLower.includes('find')) {
        return generateSearchOperation(tree, query);
    } else {
        // Default: simple traversal
        return generateInorderTraversal(tree, query);
    }
}

/**
 * Check if query contains multiple tree operations
 */
function hasMultipleTreeOperations(queryLower) {
    // Check for patterns like "insert X then remove Y" or "perform operations"
    const multiOpPatterns = [
        /insert.*then.*remove/,
        /remove.*then.*insert/,
        /insert.*and.*remove/,
        /remove.*and.*insert/,
        /perform.*operations/,
        /operations.*on.*tree/,
        /create.*tree.*with.*insert/,
        /first.*insert.*then.*remove/,
        /after.*insert.*remove/,
        /followed.*by.*remove/,
        /and.*then.*traverse/,
        /insert.*\d+.*\d+.*\d+/,  // Multiple numbers after insert
        /remove.*\d+.*\d+/        // Multiple numbers after remove
    ];

    return multiOpPatterns.some(pattern => pattern.test(queryLower));
}

/**
 * Generate sequence of multiple operations
 */
function generateMultiOperationSequence(tree, query, queryLower) {
    console.log('[Tree] Generating multi-operation sequence');

    const steps = [];
    let currentTree = [...tree];

    // Add initial state
    steps.push({
        title: 'Initial Tree',
        description: `Starting with tree: [${currentTree.filter(v => v !== null && v !== undefined).join(', ')}]`,
        tree: [...currentTree],
        result: []
    });

    // Parse operations from the query
    const operations = parseTreeOperationsFromQuery(query);

    if (operations.length > 0) {
        for (const op of operations) {
            if (op.type === 'insert') {
                const newTree = bstInsert(currentTree, op.value);
                steps.push({
                    title: `Insert ${op.value}`,
                    description: `Inserting ${op.value} into the tree`,
                    tree: [...newTree],
                    result: [op.value]
                });
                currentTree = [...newTree];
            } else if (op.type === 'remove' || op.type === 'delete') {
                const newTree = bstRemove(currentTree, op.value);
                steps.push({
                    title: `Remove ${op.value}`,
                    description: `Removing ${op.value} from the tree`,
                    tree: [...newTree],
                    result: [op.value]
                });
                currentTree = [...newTree];
            } else if (op.type === 'traverse') {
                // Perform traversal based on type
                const root = levelOrderToTree(currentTree);
                let traversalResult = [];

                if (op.traverseType === 'inorder') {
                    traversalResult = getInorderTraversal(root);
                } else if (op.traverseType === 'preorder') {
                    traversalResult = getPreorderTraversal(root);
                } else if (op.traverseType === 'postorder') {
                    traversalResult = getPostorderTraversal(root);
                }

                steps.push({
                    title: `${op.traverseType.charAt(0).toUpperCase() + op.traverseType.slice(1)} Traversal`,
                    description: `Traversing the tree: [${traversalResult.join(', ')}]`,
                    tree: [...currentTree],
                    result: [...traversalResult]
                });
            }
        }
    } else {
        // If we couldn't parse specific operations, try to extract them from text
        const insertMatches = queryLower.match(/insert\s+(\d+(?:\s+\d+)*)/g);
        if (insertMatches) {
            for (const match of insertMatches) {
                const numbers = match.replace('insert', '').trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
                for (const num of numbers) {
                    const newTree = bstInsert(currentTree, num);
                    steps.push({
                        title: `Insert ${num}`,
                        description: `Inserting ${num} into the tree`,
                        tree: [...newTree],
                        result: [num]
                    });
                    currentTree = [...newTree];
                }
            }
        }

        const removeMatches = queryLower.match(/remove\s+(\d+(?:\s+\d+)*)/g) || queryLower.match(/delete\s+(\d+(?:\s+\d+)*)/g);
        if (removeMatches) {
            for (const match of removeMatches) {
                const numbers = match.replace(/remove|delete/, '').trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
                for (const num of numbers) {
                    const newTree = bstRemove(currentTree, num);
                    steps.push({
                        title: `Remove ${num}`,
                        description: `Removing ${num} from the tree`,
                        tree: [...newTree],
                        result: [num]
                    });
                    currentTree = [...newTree];
                }
            }
        }

        // Check for traversal at the end
        if (queryLower.includes('traverse') || queryLower.includes('inorder') || queryLower.includes('preorder') || queryLower.includes('postorder')) {
            const root = levelOrderToTree(currentTree);
            let traversalType = 'inorder'; // default
            if (queryLower.includes('preorder')) traversalType = 'preorder';
            if (queryLower.includes('postorder')) traversalType = 'postorder';

            let traversalResult = [];
            if (traversalType === 'inorder') {
                traversalResult = getInorderTraversal(root);
            } else if (traversalType === 'preorder') {
                traversalResult = getPreorderTraversal(root);
            } else if (traversalType === 'postorder') {
                traversalResult = getPostorderTraversal(root);
            }

            steps.push({
                title: `${traversalType.charAt(0).toUpperCase() + traversalType.slice(1)} Traversal`,
                description: `Traversing the tree: [${traversalResult.join(', ')}]`,
                tree: [...currentTree],
                result: [...traversalResult]
            });
        }
    }

    return {
        structures: [{ id: 'tree', type: 'tree', label: 'BST', data: tree }],
        steps
    };
}

/**
 * Parse tree operations from query text
 */
function parseTreeOperationsFromQuery(query) {
    const operations = [];
    const queryLower = query.toLowerCase();

    // Extract insert operations
    const insertRegex = /insert\s+(\d+(?:\s*,?\s*\d+)*)|add\s+(\d+(?:\s*,?\s*\d+)*)/g;
    let match;
    while ((match = insertRegex.exec(queryLower)) !== null) {
        const numbersStr = match[1] || match[2];
        if (numbersStr) {
            const numbers = numbersStr.replace(/,/g, ' ').split(/\s+/).map(Number).filter(n => !isNaN(n));
            for (const num of numbers) {
                operations.push({ type: 'insert', value: num });
            }
        }
    }

    // Extract remove/delete operations
    const removeRegex = /(remove|delete)\s+(\d+(?:\s*,?\s*\d+)*)/g;
    while ((match = removeRegex.exec(queryLower)) !== null) {
        const numbersStr = match[2];
        if (numbersStr) {
            const numbers = numbersStr.replace(/,/g, ' ').split(/\s+/).map(Number).filter(n => !isNaN(n));
            for (const num of numbers) {
                operations.push({ type: match[1], value: num });
            }
        }
    }

    // Extract traversal operations
    if (queryLower.includes('traverse') || queryLower.includes('inorder') || queryLower.includes('preorder') || queryLower.includes('postorder')) {
        let traverseType = 'inorder';
        if (queryLower.includes('preorder')) traverseType = 'preorder';
        if (queryLower.includes('postorder')) traverseType = 'postorder';
        operations.push({ type: 'traverse', traverseType });
    }

    return operations;
}

/**
 * Generate inorder traversal visualization
 */
function generateInorderTraversal(tree, query) {
    console.log('[Tree] Generating inorder traversal');

    const steps = [];
    const root = levelOrderToTree(tree);
    const inorderResult = [];

    // Simulate inorder traversal step by step
    function inorderSimulate(node, path = []) {
        if (!node) return;

        // Visit left subtree
        if (node.left) {
            steps.push({
                title: `Visit Left Subtree of ${node.value}`,
                description: `Going to left child of ${node.value}`,
                tree: [...tree],
                path: [...path, node.value],
                result: [...inorderResult]
            });
            inorderSimulate(node.left, [...path, node.value]);
        }

        // Visit current node
        inorderResult.push(node.value);
        steps.push({
            title: `Visit ${node.value}`,
            description: `Processing node ${node.value}`,
            tree: [...tree],
            path: [...path, node.value],
            result: [...inorderResult]
        });

        // Visit right subtree
        if (node.right) {
            steps.push({
                title: `Visit Right Subtree of ${node.value}`,
                description: `Going to right child of ${node.value}`,
                tree: [...tree],
                path: [...path, node.value],
                result: [...inorderResult]
            });
            inorderSimulate(node.right, [...path, node.value]);
        }
    }

    // Add initial step
    steps.push({
        title: 'Start Inorder Traversal',
        description: 'Begin inorder traversal (Left, Root, Right)',
        tree: [...tree],
        path: [],
        result: []
    });

    // Perform traversal
    inorderSimulate(root);

    // Add completion step
    steps.push({
        title: 'Traversal Complete',
        description: `Inorder result: [${inorderResult.join(', ')}]`,
        tree: [...tree],
        result: [...inorderResult]
    });

    return {
        structures: [{ id: 'tree', type: 'tree', label: 'BST', data: tree }],
        steps
    };
}

/**
 * Generate preorder traversal visualization
 */
function generatePreorderTraversal(tree, query) {
    console.log('[Tree] Generating preorder traversal');

    const steps = [];
    const root = levelOrderToTree(tree);
    const preorderResult = [];

    // Simulate preorder traversal step by step
    function preorderSimulate(node, path = []) {
        if (!node) return;

        // Visit current node first
        preorderResult.push(node.value);
        steps.push({
            title: `Visit ${node.value}`,
            description: `Processing node ${node.value} (Root first)`,
            tree: [...tree],
            path: [...path, node.value],
            result: [...preorderResult]
        });

        // Visit left subtree
        if (node.left) {
            steps.push({
                title: `Visit Left Subtree of ${node.value}`,
                description: `Going to left child of ${node.value}`,
                tree: [...tree],
                path: [...path, node.value],
                result: [...preorderResult]
            });
            preorderSimulate(node.left, [...path, node.value]);
        }

        // Visit right subtree
        if (node.right) {
            steps.push({
                title: `Visit Right Subtree of ${node.value}`,
                description: `Going to right child of ${node.value}`,
                tree: [...tree],
                path: [...path, node.value],
                result: [...preorderResult]
            });
            preorderSimulate(node.right, [...path, node.value]);
        }
    }

    // Add initial step
    steps.push({
        title: 'Start Preorder Traversal',
        description: 'Begin preorder traversal (Root, Left, Right)',
        tree: [...tree],
        path: [],
        result: []
    });

    // Perform traversal
    preorderSimulate(root);

    // Add completion step
    steps.push({
        title: 'Traversal Complete',
        description: `Preorder result: [${preorderResult.join(', ')}]`,
        tree: [...tree],
        result: [...preorderResult]
    });

    return {
        structures: [{ id: 'tree', type: 'tree', label: 'BST', data: tree }],
        steps
    };
}

/**
 * Generate postorder traversal visualization
 */
function generatePostorderTraversal(tree, query) {
    console.log('[Tree] Generating postorder traversal');

    const steps = [];
    const root = levelOrderToTree(tree);
    const postorderResult = [];

    // Simulate postorder traversal step by step
    function postorderSimulate(node, path = []) {
        if (!node) return;

        // Visit left subtree first
        if (node.left) {
            steps.push({
                title: `Visit Left Subtree of ${node.value}`,
                description: `Going to left child of ${node.value}`,
                tree: [...tree],
                path: [...path, node.value],
                result: [...postorderResult]
            });
            postorderSimulate(node.left, [...path, node.value]);
        }

        // Visit right subtree
        if (node.right) {
            steps.push({
                title: `Visit Right Subtree of ${node.value}`,
                description: `Going to right child of ${node.value}`,
                tree: [...tree],
                path: [...path, node.value],
                result: [...postorderResult]
            });
            postorderSimulate(node.right, [...path, node.value]);
        }

        // Visit current node last
        postorderResult.push(node.value);
        steps.push({
            title: `Visit ${node.value}`,
            description: `Processing node ${node.value} (Last)`,
            tree: [...tree],
            path: [...path, node.value],
            result: [...postorderResult]
        });
    }

    // Add initial step
    steps.push({
        title: 'Start Postorder Traversal',
        description: 'Begin postorder traversal (Left, Right, Root)',
        tree: [...tree],
        path: [],
        result: []
    });

    // Perform traversal
    postorderSimulate(root);

    // Add completion step
    steps.push({
        title: 'Traversal Complete',
        description: `Postorder result: [${postorderResult.join(', ')}]`,
        tree: [...tree],
        result: [...postorderResult]
    });

    return {
        structures: [{ id: 'tree', type: 'tree', label: 'BST', data: tree }],
        steps
    };
}

/**
 * Generate insert operation visualization
 */
function generateInsertOperation(tree, query) {
    console.log('[Tree] Generating insert operation');

    // Extract value to insert from query
    const insertMatch = query.match(/insert\s+(\d+)/i) || query.match(/add\s+(\d+)/i);
    const valueToInsert = insertMatch ? parseInt(insertMatch[1]) : 8; // default value

    const steps = [];

    // Initial state
    steps.push({
        title: 'Initial Tree',
        description: `Starting tree: [${tree.join(', ')}]`,
        tree: [...tree],
        result: []
    });

    // Insert step
    const newTree = bstInsert(tree, valueToInsert);
    steps.push({
        title: `Insert ${valueToInsert}`,
        description: `Inserting ${valueToInsert} into the tree`,
        tree: [...newTree],
        result: [valueToInsert]
    });

    // Completion
    steps.push({
        title: 'Insert Complete',
        description: `Value ${valueToInsert} inserted successfully`,
        tree: [...newTree],
        result: [valueToInsert]
    });

    return {
        structures: [{ id: 'tree', type: 'tree', label: 'BST', data: tree }],
        steps
    };
}

/**
 * Generate remove operation visualization
 */
function generateRemoveOperation(tree, query) {
    console.log('[Tree] Generating remove operation');

    // Extract value to remove from query
    const removeMatch = query.match(/remove\s+(\d+)/i) || query.match(/delete\s+(\d+)/i);
    const valueToRemove = removeMatch ? parseInt(removeMatch[1]) : 2; // default value

    const steps = [];

    // Initial state
    steps.push({
        title: 'Initial Tree',
        description: `Starting tree: [${tree.join(', ')}]`,
        tree: [...tree],
        result: []
    });

    // Remove step
    const newTree = bstRemove(tree, valueToRemove);
    steps.push({
        title: `Remove ${valueToRemove}`,
        description: `Removing ${valueToRemove} from the tree`,
        tree: [...newTree],
        result: [valueToRemove]
    });

    // Completion
    steps.push({
        title: 'Remove Complete',
        description: `Value ${valueToRemove} removed successfully`,
        tree: [...newTree],
        result: [valueToRemove]
    });

    return {
        structures: [{ id: 'tree', type: 'tree', label: 'BST', data: tree }],
        steps
    };
}

/**
 * Generate search operation visualization
 */
function generateSearchOperation(tree, query) {
    console.log('[Tree] Generating search operation');

    // Extract value to search from query
    const searchMatch = query.match(/search\s+for\s+(\d+)/i) || query.match(/find\s+(\d+)/i);
    const valueToSearch = searchMatch ? parseInt(searchMatch[1]) : 3; // default value

    const steps = [];
    const root = levelOrderToTree(tree);
    const path = [];

    // Initial state
    steps.push({
        title: 'Start Search',
        description: `Searching for ${valueToSearch} in the tree`,
        tree: [...tree],
        path: [],
        result: []
    });

    // Simulate search
    let current = root;
    let found = false;

    while (current) {
        path.push(current.value);
        steps.push({
            title: `Visit ${current.value}`,
            description: `${valueToSearch} ${valueToSearch < current.value ? '<' : valueToSearch > current.value ? '>' : '=='} ${current.value}, ${valueToSearch < current.value ? 'go left' : valueToSearch > current.value ? 'go right' : 'FOUND!'}`,
            tree: [...tree],
            path: [...path],
            result: [...path]
        });

        if (valueToSearch === current.value) {
            found = true;
            break;
        } else if (valueToSearch < current.value) {
            current = current.left;
        } else {
            current = current.right;
        }
    }

    // Result step
    steps.push({
        title: found ? `Found ${valueToSearch}!` : `${valueToSearch} Not Found`,
        description: found ? `Value ${valueToSearch} found at path: [${path.join(' → ')}]` : `Value ${valueToSearch} not present in tree`,
        tree: [...tree],
        path: [...path],
        result: found ? [valueToSearch] : [-1]
    });

    return {
        structures: [{ id: 'tree', type: 'tree', label: 'BST', data: tree }],
        steps
    };
}

module.exports = {
    runExecutors,
    isExecutorsEnabled,
    // NEW: Intent-respecting layer functions
    applyCorrectionsOnly,
    generateDeterministicFallback,
    treeExecutorCorrectionOnly,
    deterministicTreeFallback,
    // Individual executors (correction-only)
    arrayExecutor,
    stackExecutor,
    queueExecutor,
    treeExecutor,
    pointersExecutor,
    structureExecutor,
    // Universal executors (legacy - used in fallback mode only)
    universalTreeExecutor,
    universalArrayExecutor,
    universalStackExecutor,
    universalQueueExecutor,
    // BST helpers
    bstInsert,
    bstRemove,
    levelOrderToTree,
    treeToLevelOrder,
    // Helper functions
    checkIfTreeQuery,
    parseTreeFromQuery,
    parseOperationsFromQuery
};
