/**
 * Universal Visualization Normalizer
 * Handles all 14 patterns + error recovery + data conversion
 */

class VisualizationNormalizer {
    normalize(llmOutput) {
        try {
            if (llmOutput.is_multi_phase && llmOutput.phases) {
                return this.normalizeMultiPhase(llmOutput);
            }
            return this.normalizeSinglePhase(llmOutput);
        } catch (error) {
            console.error('Normalization error:', error.message);
            return this.getFallback();
        }
    }

    getFallback() {
        return {
            is_multi_phase: false,
            pattern: 'unknown',
            structures: [{ id: 'arr', type: 'array', label: 'Data', data: [] }],
            steps: [{
                id: 'step_1',
                title: 'Error',
                description: 'Could not process visualization',
                pointers: {},
                highlight: [],
                variables: {}
            }]
        };
    }

    normalizeSinglePhase(llmOutput) {
        const pattern = llmOutput.pattern || llmOutput.problem_type || 'unknown';

        const structures = this.normalizeStructures(llmOutput.structures || []);

        if (structures.length === 0) {
            structures.push({ id: 'arr', type: 'array', label: 'Data', data: [1, 2, 3, 4, 5] });
        }

        const maxLength = this.getMaxArrayLength(structures);
        const steps = this.normalizeSteps(llmOutput.steps || [], maxLength);

        return {
            is_multi_phase: false,
            pattern: pattern,
            structures: structures,
            steps: steps.length > 0 ? steps : [{
                id: 'step_1',
                title: 'Processing',
                description: 'Visualization step',
                pointers: {},
                highlight: [],
                variables: {}
            }]
        };
    }

    normalizeMultiPhase(llmOutput) {
        const phases = (llmOutput.phases || []).map((phase, idx) => ({
            phase_number: phase.phase_number || idx + 1,
            phase_name: phase.phase_name || `Phase ${idx + 1}`,
            pattern: phase.pattern || 'unknown',
            structures: this.normalizeStructures(phase.structures || []),
            steps: this.normalizeSteps(phase.steps || [], this.getMaxArrayLength(phase.structures || []))
        }));

        return {
            is_multi_phase: true,
            phases: phases
        };
    }

    // Convert any data format to array
    convertToArray(data) {
        if (Array.isArray(data)) {
            // Flatten if nested arrays
            return data.map(item => {
                if (typeof item === 'object' && item !== null && 'val' in item) {
                    return item.val; // Extract value from node-like object
                }
                return item;
            });
        }
        if (typeof data === 'string') {
            return data.split('');
        }
        if (typeof data === 'number') {
            return [data];
        }
        if (data === null || data === undefined) {
            return [];
        }
        // Handle object - could be linked list node or key-value pairs
        if (typeof data === 'object') {
            // If it looks like a linked list node with 'val' and 'next'
            if ('val' in data) {
                const result = [];
                let node = data;
                let count = 0;
                while (node && count < 100) { // prevent infinite loops
                    result.push(node.val);
                    node = node.next;
                    count++;
                }
                return result;
            }
            // Otherwise get values
            const values = Object.values(data);
            // Extract primitives from nested objects
            return values.map(v => {
                if (typeof v === 'object' && v !== null && 'val' in v) {
                    return v.val;
                }
                return v;
            }).filter(v => v !== null && v !== undefined && typeof v !== 'object');
        }
        return [String(data)];
    }

    normalizeStructures(structures) {
        if (!Array.isArray(structures)) {
            // If structures is not an array, try to make it one
            if (structures && typeof structures === 'object') {
                structures = [structures];
            } else {
                return [];
            }
        }

        return structures.map(struct => {
            if (!struct || typeof struct !== 'object') {
                return { id: 'arr', type: 'array', label: 'Data', data: [] };
            }

            // Convert data to array (handles string, number, etc.)
            const data = this.convertToArray(struct.data);

            return {
                id: struct.id || 'arr',
                type: struct.type || 'array',
                label: struct.label || 'Data',
                data: data
            };
        });
    }

    getMaxArrayLength(structures) {
        if (!structures || structures.length === 0) return 10;
        const lengths = structures.map(s => s.data?.length || 0);
        return Math.max(10, ...lengths);
    }

    normalizeSteps(steps, maxLength) {
        if (!Array.isArray(steps)) return [];

        return steps.map((step, index) => {
            if (!step || typeof step !== 'object') {
                return {
                    id: `step_${index + 1}`,
                    title: `Step ${index + 1}`,
                    description: '',
                    pointers: {},
                    highlight: [],
                    variables: {}
                };
            }

            // Handle highlight that might be a single number instead of array
            let highlight = step.highlight;
            if (typeof highlight === 'number') {
                highlight = [highlight];
            } else if (!Array.isArray(highlight)) {
                highlight = [];
            }

            // Handle stack/queue that might be strings
            let stack = step.stack;
            if (typeof stack === 'string') {
                stack = stack.split('');
            }

            return {
                id: `step_${index + 1}`,
                title: step.title || `Step ${index + 1}`,
                description: step.description || '',
                pointers: this.normalizePointers(step.pointers, maxLength),
                highlight: this.normalizeHighlight(highlight, maxLength),
                variables: step.variables || {},
                array: Array.isArray(step.array) ? step.array : null,
                array2: Array.isArray(step.array2) ? step.array2 : null,
                result: Array.isArray(step.result) ? step.result : null,
                list1: Array.isArray(step.list1) ? step.list1 : null,
                list2: Array.isArray(step.list2) ? step.list2 : null,
                hashmap: step.hashmap || null,
                stack: Array.isArray(stack) ? stack : null,
                stackOperation: step.stackOperation || null,
                stackOperationValue: step.stackOperationValue,
                queue: Array.isArray(step.queue) ? step.queue : null,
                queueOperation: step.queueOperation || null,
                queueOperationValue: step.queueOperationValue,
                heap: Array.isArray(step.heap) ? step.heap : null,
                subsets: Array.isArray(step.subsets) ? step.subsets : null,
                intervals: Array.isArray(step.intervals) ? step.intervals : null,
                tree: step.tree || null,
                window: step.window || null,
                swap: Array.isArray(step.swap) ? step.swap : null,
                matrix: Array.isArray(step.matrix) ? step.matrix : null,
                dp: Array.isArray(step.dp) ? step.dp : null,
                dpTable: Array.isArray(step.dpTable) ? step.dpTable : null,
                currentCell: step.currentCell || null,
                dpHighlight: Array.isArray(step.dpHighlight) ? step.dpHighlight : null,
                path: Array.isArray(step.path) ? step.path : null
            };
        });
    }

    normalizePointers(pointers, maxLength) {
        if (!pointers || typeof pointers !== 'object') return {};
        const normalized = {};
        const maxIndex = Math.max(0, maxLength - 1);

        Object.entries(pointers).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                // Skip null pointers
            } else if (typeof value === 'number') {
                if (value === -1) {
                    normalized[key] = -1;
                } else {
                    normalized[key] = Math.max(0, Math.min(value, maxIndex));
                }
            }
        });

        return normalized;
    }

    normalizeHighlight(highlight, maxLength) {
        if (!highlight || !Array.isArray(highlight)) return [];
        const maxIndex = Math.max(0, maxLength - 1);
        return highlight.filter(i => typeof i === 'number' && i >= 0 && i <= maxIndex);
    }

    toFrames(normalized) {
        try {
            if (normalized.is_multi_phase) {
                return this.multiPhaseToFrames(normalized);
            }
            return this.singlePhaseToFrames(normalized);
        } catch (error) {
            console.error('toFrames error:', error.message);
            return [{
                id: 'step_1',
                title: 'Error',
                description: 'Could not generate frames',
                pattern: 'unknown',
                components: []
            }];
        }
    }

    singlePhaseToFrames(normalized) {
        return normalized.steps.map(step => this.stepToFrame(step, normalized.structures, normalized.pattern));
    }

    multiPhaseToFrames(normalized) {
        const allFrames = [];

        (normalized.phases || []).forEach(phase => {
            (phase.steps || []).forEach(step => {
                const frame = this.stepToFrame(step, phase.structures, phase.pattern);
                frame.phase_number = phase.phase_number;
                frame.phase_name = phase.phase_name;
                allFrames.push(frame);
            });
        });

        return allFrames;
    }

    stepToFrame(step, structures, pattern) {
        const components = [];

        // Add array or linked_list components based on type/pattern
        (structures || []).forEach(struct => {
            // Use step-specific array data if provided, otherwise use structure data
            // Get correct data based on structure ID
            let arrayData;
            if (struct.id === 'arr2' || struct.id === 'array2') {
                arrayData = step.array2 || struct.data || [];
            } else if (struct.id === 'result') {
                arrayData = step.result || struct.data || [];
            } else {
                arrayData = step.array || struct.data || [];
            }
            if (arrayData.length === 0 && struct.id !== 'result') return;

            const displayPointers = {};
            if (step.pointers) {
                Object.entries(step.pointers).forEach(([key, value]) => {
                    // Assign pointers to correct array
                    if (struct.id === 'arr2' || struct.id === 'array2') {
                        if (key === 'j' && value !== null && value !== undefined && value >= 0) {
                            displayPointers[key] = value;
                        }
                    } else if (struct.id !== 'result') {
                        if (key === 'i' && value !== null && value !== undefined && value >= 0) {
                            displayPointers[key] = value;
                        } else if (key !== 'j' && value !== null && value !== undefined && value >= 0) {
                            displayPointers[key] = value;
                        }
                    }
                });
            }

            // Determine if this should be rendered as linked list or array
            const isLinkedList = struct.type === 'linked_list' ||
                pattern?.includes('linked_list') ||
                struct.id?.includes('list') ||
                struct.label?.toLowerCase().includes('linked');

            // Detect stack pattern
            const isStack = pattern?.includes('stack') ||
                struct.type === 'stack' ||
                struct.id?.includes('stack') ||
                struct.label?.toLowerCase().includes('stack');

            // Detect queue pattern
            const isQueue = pattern?.includes('queue') ||
                pattern?.includes('bfs') ||
                struct.type === 'queue' ||
                struct.id?.includes('queue') ||
                struct.label?.toLowerCase().includes('queue');

            if (isStack) {
                components.push({
                    type: 'stack',
                    id: struct.id,
                    data: arrayData,
                    operation: step.stackOperation || null,
                    operationValue: step.stackOperationValue
                });
            } else if (isQueue) {
                components.push({
                    type: 'queue',
                    id: struct.id,
                    data: arrayData,
                    operation: step.queueOperation || null,
                    operationValue: step.queueOperationValue
                });
            } else if (isLinkedList) {
                components.push({
                    type: 'linked_list',
                    id: struct.id,
                    label: struct.label,
                    data: arrayData,
                    highlight: step.highlight || [],
                    pointers: displayPointers,
                    operation: step.listOperation || null
                });
            } else if (struct.type === 'array') {
                components.push({
                    type: 'array',
                    id: struct.id,
                    label: struct.label,
                    data: arrayData,
                    highlight: step.highlight || [],
                    pointers: displayPointers,
                    window: step.window,
                    swap: step.swap
                });
            }
        });

        // CRITICAL: Handle array2 and result from step data (for merge operations)
        // This must happen AFTER the structures loop and override any previous values

        // Array 2 - for merge operations
        if (step.array2 && Array.isArray(step.array2)) {
            // Remove any existing array2 entries
            const existingIdx = components.findIndex(c => c.id === 'arr2' || c.id === 'array2');
            if (existingIdx !== -1) components.splice(existingIdx, 1);

            components.push({
                type: 'array',
                id: 'array2',
                label: 'Array 2',
                data: step.array2,
                highlight: [],
                pointers: step.pointers?.j !== undefined ? { j: step.pointers.j } : {}
            });
        }

        // Result array - for merge operations
        if (step.result && Array.isArray(step.result)) {
            // Remove any existing result entries (which may be empty from structures)
            const resultIdx = components.findIndex(c => c.id === 'result');
            if (resultIdx !== -1) components.splice(resultIdx, 1);

            components.push({
                type: 'array',
                id: 'result',
                label: 'Result',
                data: step.result,
                highlight: step.result.length > 0 ? [step.result.length - 1] : []
            });
        }

        // List 1 - for linked list merge operations
        if (step.list1 && Array.isArray(step.list1)) {
            components.push({
                type: 'linked_list',
                id: 'list1',
                label: 'List 1',
                data: step.list1,
                highlight: [],
                pointers: step.pointers?.p1 !== undefined ? { p1: step.pointers.p1 } : {}
            });
        }

        // List 2 - for linked list merge operations
        if (step.list2 && Array.isArray(step.list2)) {
            components.push({
                type: 'linked_list',
                id: 'list2',
                label: 'List 2',
                data: step.list2,
                highlight: [],
                pointers: step.pointers?.p2 !== undefined ? { p2: step.pointers.p2 } : {}
            });
        }

        // Add other components
        if (step.hashmap && typeof step.hashmap === 'object' && Object.keys(step.hashmap).length > 0) {
            components.push({ type: 'hashmap', data: step.hashmap });
        }
        if (step.stack && Array.isArray(step.stack)) {
            components.push({
                type: 'stack',
                data: step.stack,
                operation: step.stackOperation,
                operationValue: step.stackOperationValue
            });
        }
        if (step.queue && Array.isArray(step.queue)) {
            components.push({
                type: 'queue',
                data: step.queue,
                operation: step.queueOperation,
                operationValue: step.queueOperationValue
            });
        }
        if (step.heap && Array.isArray(step.heap) && step.heap.length > 0) {
            components.push({ type: 'heap', data: step.heap });
        }
        if (step.subsets && Array.isArray(step.subsets) && step.subsets.length > 0) {
            components.push({ type: 'subsets', data: step.subsets });
        }
        // Matrix support
        if (step.matrix && Array.isArray(step.matrix)) {
            components.push({
                type: 'matrix',
                data: step.matrix,
                highlight: step.matrixHighlight || [],
                currentCell: step.currentCell || null,
                path: step.path || [],
                label: 'Matrix'
            });
        }
        // DP Table support
        if (step.dpTable || step.dp) {
            const dpData = step.dpTable || step.dp;
            components.push({
                type: 'dp_table',
                data: dpData,
                currentCell: step.currentCell || step.dpCell || null,
                highlight: step.dpHighlight || [],
                label: 'DP Table'
            });
        }
        if (step.variables && Object.keys(step.variables).length > 0) {
            components.push({ type: 'variables', items: step.variables });
        }

        return {
            id: step.id,
            title: step.title,
            description: step.description,
            pattern: pattern,
            components: components
        };
    }
}

module.exports = { VisualizationNormalizer };
