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
                hashmap: step.hashmap || null,
                stack: Array.isArray(stack) ? stack : null,
                queue: Array.isArray(step.queue) ? step.queue : null,
                heap: Array.isArray(step.heap) ? step.heap : null,
                subsets: Array.isArray(step.subsets) ? step.subsets : null,
                intervals: Array.isArray(step.intervals) ? step.intervals : null,
                tree: step.tree || null,
                window: step.window || null
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

        // Add array components
        (structures || []).forEach(struct => {
            if (struct.type === 'array' && struct.data && struct.data.length > 0) {
                const displayPointers = {};
                if (step.pointers) {
                    Object.entries(step.pointers).forEach(([key, value]) => {
                        if (value !== null && value !== undefined && value >= 0) {
                            displayPointers[key] = value;
                        }
                    });
                }

                components.push({
                    type: 'array',
                    id: struct.id,
                    label: struct.label,
                    data: struct.data,
                    highlight: step.highlight || [],
                    pointers: displayPointers,
                    window: step.window
                });
            }
        });

        // Add other components
        if (step.hashmap && typeof step.hashmap === 'object' && Object.keys(step.hashmap).length > 0) {
            components.push({ type: 'hashmap', data: step.hashmap });
        }
        if (step.stack && Array.isArray(step.stack) && step.stack.length > 0) {
            components.push({ type: 'stack', data: step.stack });
        }
        if (step.queue && Array.isArray(step.queue) && step.queue.length > 0) {
            components.push({ type: 'queue', data: step.queue });
        }
        if (step.heap && Array.isArray(step.heap) && step.heap.length > 0) {
            components.push({ type: 'heap', data: step.heap });
        }
        if (step.subsets && Array.isArray(step.subsets) && step.subsets.length > 0) {
            components.push({ type: 'subsets', data: step.subsets });
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
