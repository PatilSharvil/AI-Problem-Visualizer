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
 * @param {string} originalProblem - Original user query (optional)
 * @returns {Object} - Validated/corrected LLM output
 */
function runExecutors(llmOutput, originalProblem = '') {
    if (!ENABLE_EXECUTORS) {
        return llmOutput;
    }

    // FIRST: Check for deterministic algorithms that bypass LLM entirely
    const binarySearchResult = deterministicBinarySearch(originalProblem);
    if (binarySearchResult) {
        console.log('[Executor] Using DETERMINISTIC binary search - bypassing LLM output');
        return binarySearchResult;
    }

    const linearSearchResult = deterministicLinearSearch(originalProblem);
    if (linearSearchResult) {
        console.log('[Executor] Using DETERMINISTIC linear search - bypassing LLM output');
        return linearSearchResult;
    }

    const slidingWindowResult = deterministicSlidingWindow(originalProblem);
    if (slidingWindowResult) {
        console.log('[Executor] Using DETERMINISTIC sliding window - bypassing LLM output');
        return slidingWindowResult;
    }

    // VALID PARENTHESES - catches bracket/parenthesis validation problems
    const validParenthesesResult = deterministicValidParentheses(originalProblem);
    if (validParenthesesResult) {
        console.log('[Executor] Using DETERMINISTIC valid parentheses - bypassing LLM output');
        return validParenthesesResult;
    }

    // REVERSE STRING USING STACK
    const reverseStringResult = deterministicReverseString(originalProblem);
    if (reverseStringResult) {
        console.log('[Executor] Using DETERMINISTIC reverse string (stack) - bypassing LLM output');
        return reverseStringResult;
    }

    // GENERIC STACK OPERATIONS - push/pop demonstration
    const stackOpsResult = deterministicStackOperations(originalProblem);
    if (stackOpsResult) {
        console.log('[Executor] Using DETERMINISTIC stack operations - bypassing LLM output');
        return stackOpsResult;
    }

    // UNIVERSAL STACK EXECUTOR - catches any remaining stack queries
    // Validates LLM output and provides deterministic fallback
    const universalStackResult = universalStackExecutor(llmOutput, originalProblem);
    if (universalStackResult) {
        console.log('[Executor] Using UNIVERSAL stack executor - validated/corrected output');
        return universalStackResult;
    }

    // QUEUE OPERATIONS - enqueue/dequeue demonstration
    const queueOpsResult = deterministicQueueOperations(originalProblem);
    if (queueOpsResult) {
        console.log('[Executor] Using DETERMINISTIC queue operations - bypassing LLM output');
        return queueOpsResult;
    }

    // UNIVERSAL QUEUE EXECUTOR - catches any remaining queue queries
    const universalQueueResult = universalQueueExecutor(llmOutput, originalProblem);
    if (universalQueueResult) {
        console.log('[Executor] Using UNIVERSAL queue executor - validated/corrected output');
        return universalQueueResult;
    }

    // GENERIC SORT - catches "sort the array", "sort this", etc. - defaults to bubble sort
    const genericSortResult = deterministicGenericSort(originalProblem);
    if (genericSortResult) {
        console.log('[Executor] Using DETERMINISTIC generic sort (bubble) - bypassing LLM output');
        return genericSortResult;
    }

    const bubbleSortResult = deterministicBubbleSort(originalProblem);
    if (bubbleSortResult) {
        console.log('[Executor] Using DETERMINISTIC bubble sort - bypassing LLM output');
        return bubbleSortResult;
    }

    const selectionSortResult = deterministicSelectionSort(originalProblem);
    if (selectionSortResult) {
        console.log('[Executor] Using DETERMINISTIC selection sort - bypassing LLM output');
        return selectionSortResult;
    }

    const insertionSortResult = deterministicInsertionSort(originalProblem);
    if (insertionSortResult) {
        console.log('[Executor] Using DETERMINISTIC insertion sort - bypassing LLM output');
        return insertionSortResult;
    }

    const quickSortResult = deterministicQuickSort(originalProblem);
    if (quickSortResult) {
        console.log('[Executor] Using DETERMINISTIC quick sort - bypassing LLM output');
        return quickSortResult;
    }

    const mergeSortResult = deterministicMergeSort(originalProblem);
    if (mergeSortResult) {
        console.log('[Executor] Using DETERMINISTIC merge sort - bypassing LLM output');
        return mergeSortResult;
    }

    // UNIVERSAL ARRAY EXECUTOR - catches any remaining array queries
    // Validates LLM output and provides deterministic fallback
    const universalArrayResult = universalArrayExecutor(llmOutput, originalProblem);
    if (universalArrayResult) {
        console.log('[Executor] Using UNIVERSAL array executor - validated/corrected output');
        return universalArrayResult;
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

    // Parse initial tree from user query if present
    let initialTree = parseTreeFromQuery(originalProblem);

    // Track previous tree for BST operations
    let previousTree = null;

    // Get initial tree from structures or parsed query
    const treeStructure = output.structures?.find(s => s.type === 'tree');
    if (initialTree && initialTree.length > 0) {
        previousTree = [...initialTree];
        // Also update the structure data
        if (treeStructure) {
            treeStructure.data = [...initialTree];
        }
    } else if (treeStructure && Array.isArray(treeStructure.data)) {
        previousTree = [...treeStructure.data];
    }

    // Parse operations from user query for reference
    const queryOperations = parseOperationsFromQuery(originalProblem);
    console.log('[Executor] Parsed operations from query:', queryOperations);

    // Validate each step
    if (Array.isArray(output.steps)) {
        output.steps = output.steps.map((step, idx) => {
            let validatedStep = { ...step };

            // Run structure-specific executors
            validatedStep = arrayExecutor(validatedStep);
            validatedStep = stackExecutor(validatedStep);
            validatedStep = queueExecutor(validatedStep);
            validatedStep = treeExecutor(validatedStep, previousTree, queryOperations);
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

    // If we have LLM output, validate and correct it
    if (llmOutput && llmOutput.steps && Array.isArray(llmOutput.steps) && llmOutput.steps.length > 0) {
        const correctedOutput = validateAndCorrectStackOutput(llmOutput, query);
        if (correctedOutput) {
            return correctedOutput;
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

    // If we have LLM output, validate and correct it
    if (llmOutput && llmOutput.steps && Array.isArray(llmOutput.steps) && llmOutput.steps.length > 0) {
        const correctedOutput = validateAndCorrectQueueOutput(llmOutput, query);
        if (correctedOutput) {
            return correctedOutput;
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
    const isArrayQuery =
        queryLower.includes('array') ||
        queryLower.includes('subarray') ||
        queryLower.includes('subarrays') ||
        queryLower.includes('element') ||
        queryLower.includes('index') ||
        queryLower.includes('traverse') ||
        queryLower.includes('find') ||
        queryLower.includes('sum') ||
        queryLower.includes('max') ||
        queryLower.includes('min') ||
        queryLower.includes('target') ||
        queryLower.includes('pair') ||
        /\[[0-9,\s\-]+\]/.test(query); // Has array literal

    if (!isArrayQuery) return null;

    console.log(`[Universal Array Executor] Processing: "${query.substring(0, 50)}..."`);

    // If we have LLM output, validate and correct it
    if (llmOutput && llmOutput.steps && Array.isArray(llmOutput.steps) && llmOutput.steps.length > 0) {
        const correctedOutput = validateAndCorrectArrayOutput(llmOutput, query);
        if (correctedOutput) {
            return correctedOutput;
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
