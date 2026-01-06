/**
 * Universal Frame Normalizer
 * Converts LLM output to entity + action based frames
 */

class UniversalNormalizer {
    /**
     * Normalize LLM output to standard frame format
     */
    normalize(llmOutput) {
        if (!llmOutput || typeof llmOutput !== 'object') {
            return this.getFallback();
        }

        const structures = this.normalizeStructures(llmOutput.structures || []);
        const steps = this.normalizeSteps(llmOutput.steps || [], structures);

        return { structures, steps };
    }

    normalizeStructures(structures) {
        if (!Array.isArray(structures)) return [];

        return structures.map((struct, idx) => ({
            id: struct.id || `entity_${idx}`,
            type: this.mapType(struct.type),
            label: struct.label || `Entity ${idx + 1}`,
            data: Array.isArray(struct.data) ? struct.data : []
        }));
    }

    mapType(type) {
        const typeMap = {
            'array': 'array',
            'linked_list': 'linked_list',
            'linkedlist': 'linked_list',
            'list': 'linked_list',
            'stack': 'stack',
            'queue': 'queue',
            'dp': 'dp_table',
            'dp_table': 'dp_table',
            'dptable': 'dp_table',
            'matrix': 'matrix',
            'tree': 'tree',
            'hashmap': 'hashmap',
            'hash': 'hashmap',
            'map': 'hashmap'
        };
        return typeMap[type?.toLowerCase()] || 'array';
    }

    normalizeSteps(steps, structures) {
        if (!Array.isArray(steps)) return [];

        return steps.map((step, idx) => ({
            id: `step_${idx + 1}`,
            title: step.title || `Step ${idx + 1}`,
            description: step.description || '',
            // Preserve all data fields
            array: step.array,
            array2: step.array2,
            result: step.result,
            list1: step.list1,
            list2: step.list2,
            dp: step.dp,
            dpTable: step.dpTable,
            matrix: step.matrix,
            stack: step.stack,
            queue: step.queue,
            hashmap: step.hashmap,
            // Metadata
            pointers: step.pointers || {},
            highlight: this.normalizeHighlight(step.highlight),
            variables: step.variables || {},
            // Cell references
            currentCell: step.currentCell,
            dpHighlight: step.dpHighlight,
            path: step.path
        }));
    }

    normalizeHighlight(highlight) {
        if (typeof highlight === 'number') return [highlight];
        if (Array.isArray(highlight)) return highlight;
        return [];
    }

    /**
     * Convert normalized data to renderable frames with entities and actions
     */
    toFrames(normalized) {
        const { structures, steps } = normalized;
        const frames = [];
        let prevEntities = null;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const entities = this.buildEntities(step, structures);
            const actions = this.detectActions(step, entities, prevEntities);

            frames.push({
                id: step.id,
                title: step.title,
                description: step.description,
                entities,
                actions,
                variables: step.variables
            });

            prevEntities = entities;
        }

        return frames;
    }

    /**
     * Build entities array from step data - with deduplication
     */
    buildEntities(step, structures) {
        const entities = [];
        const addedIds = new Set();

        // Helper to add entity only if not already added
        const addEntity = (entity) => {
            if (!addedIds.has(entity.id)) {
                addedIds.add(entity.id);
                entities.push(entity);
            }
        };

        // Process structures first
        for (const struct of structures) {
            const data = this.getEntityData(step, struct);
            if (data && data.length > 0) {
                addEntity({
                    id: struct.id,
                    type: struct.type,
                    data: data,
                    meta: {
                        label: struct.label,
                        pointers: this.getPointersForEntity(step.pointers, struct.id)
                    }
                });
            }
        }

        // Handle standalone data fields - only add if not already present
        if (step.array && !addedIds.has('arr') && !addedIds.has('arr1')) {
            addEntity({
                id: 'arr',
                type: 'array',
                data: step.array,
                meta: {
                    label: 'Array',
                    pointers: this.getPointersForEntity(step.pointers, 'arr', ['i', 'left', 'start', 'curr'])
                }
            });
        }

        if (step.array2 && !addedIds.has('arr2')) {
            addEntity({
                id: 'arr2',
                type: 'array',
                data: step.array2,
                meta: {
                    label: 'Array 2',
                    pointers: this.getPointersForEntity(step.pointers, 'arr2', ['j', 'right', 'end'])
                }
            });
        }

        if (step.result && !addedIds.has('result')) {
            addEntity({
                id: 'result',
                type: 'array',
                data: step.result,
                meta: { label: 'Result' }
            });
        }

        if (step.list1 && !addedIds.has('list1')) {
            addEntity({
                id: 'list1',
                type: 'linked_list',
                data: step.list1,
                meta: {
                    label: 'List 1',
                    pointers: { p1: step.pointers?.p1 }
                }
            });
        }

        if (step.list2 && !addedIds.has('list2')) {
            addEntity({
                id: 'list2',
                type: 'linked_list',
                data: step.list2,
                meta: {
                    label: 'List 2',
                    pointers: { p2: step.pointers?.p2 }
                }
            });
        }

        if ((step.dp || step.dpTable) && !addedIds.has('dp')) {
            const dpData = step.dp || step.dpTable;
            addEntity({
                id: 'dp',
                type: 'dp_table',
                data: dpData,
                meta: {
                    label: 'DP Table',
                    currentCell: step.currentCell,
                    highlight: step.dpHighlight
                }
            });
        }

        if (step.matrix && !addedIds.has('matrix')) {
            addEntity({
                id: 'matrix',
                type: 'matrix',
                data: step.matrix,
                meta: {
                    label: 'Matrix',
                    currentCell: step.currentCell,
                    path: step.path
                }
            });
        }

        if (step.stack && !addedIds.has('stack') && step.stack.length > 0) {
            addEntity({
                id: 'stack',
                type: 'stack',
                data: step.stack,
                meta: { label: 'Stack' }
            });
        }

        if (step.queue && !addedIds.has('queue') && step.queue.length > 0) {
            addEntity({
                id: 'queue',
                type: 'queue',
                data: step.queue,
                meta: { label: 'Queue' }
            });
        }

        // Apply highlights to array entities
        for (const entity of entities) {
            if (step.highlight && entity.type === 'array') {
                entity.meta.highlight = step.highlight;
            }
        }

        return entities;
    }

    getEntityData(step, struct) {
        // Map struct id to step data field
        const idToField = {
            'arr': step.array,
            'arr1': step.array,
            'arr2': step.array2,
            'result': step.result,
            'list': step.array,
            'list1': step.list1,
            'list2': step.list2,
            'dp': step.dp || step.dpTable,
            'matrix': step.matrix,
            'stack': step.stack,
            'queue': step.queue
        };

        return idToField[struct.id] || step.array || struct.data;
    }

    getPointersForEntity(pointers, entityId, includeKeys = null) {
        if (!pointers) return {};

        const result = {};
        const keyMap = {
            'arr': ['i', 'left', 'start', 'curr', 'prev', 'next', 'mid', 'pivot'],
            'arr1': ['i', 'left', 'start'],
            'arr2': ['j', 'right', 'end'],
            'list': ['prev', 'curr', 'next', 'slow', 'fast'],
            'list1': ['p1'],
            'list2': ['p2']
        };

        const keys = includeKeys || keyMap[entityId] || Object.keys(pointers);

        for (const key of keys) {
            if (pointers[key] !== undefined && pointers[key] !== null) {
                result[key] = pointers[key];
            }
        }

        return result;
    }

    /**
     * Detect actions by comparing current and previous entities
     */
    detectActions(step, entities, prevEntities) {
        const actions = [];

        if (!prevEntities) {
            // First frame - highlight initial elements
            for (const entity of entities) {
                if (entity.meta?.highlight?.length > 0) {
                    actions.push({
                        type: 'highlight',
                        target: entity.id,
                        indices: entity.meta.highlight
                    });
                }
            }
            return actions;
        }

        for (const entity of entities) {
            const prev = prevEntities.find(e => e.id === entity.id);

            if (!prev) {
                // New entity
                actions.push({
                    type: 'insert',
                    target: entity.id,
                    indices: [0],
                    value: entity.data
                });
                continue;
            }

            // Detect swap
            const swap = this.detectSwap(prev.data, entity.data);
            if (swap) {
                actions.push({
                    type: 'swap',
                    target: entity.id,
                    from: swap[0],
                    to: swap[1]
                });
            }

            // Detect removal
            if (entity.data.length < prev.data.length) {
                const removed = this.findRemovedIndices(prev.data, entity.data);
                for (const idx of removed) {
                    actions.push({
                        type: 'remove',
                        target: entity.id,
                        indices: [idx]
                    });
                }
            }

            // Detect insert
            if (entity.data.length > prev.data.length) {
                actions.push({
                    type: 'insert',
                    target: entity.id,
                    indices: [entity.data.length - 1],
                    value: entity.data[entity.data.length - 1]
                });
            }

            // Detect highlight
            if (entity.meta?.highlight?.length > 0) {
                actions.push({
                    type: 'highlight',
                    target: entity.id,
                    indices: entity.meta.highlight
                });
            }

            // Detect pointer movement
            if (entity.meta?.pointers && prev.meta?.pointers) {
                for (const [key, value] of Object.entries(entity.meta.pointers)) {
                    if (prev.meta.pointers[key] !== value) {
                        actions.push({
                            type: 'pointer_move',
                            target: entity.id,
                            pointer: key,
                            from: prev.meta.pointers[key],
                            to: value
                        });
                    }
                }
            }
        }

        return actions;
    }

    detectSwap(prevArr, currArr) {
        if (!prevArr || !currArr || prevArr.length !== currArr.length) return null;

        const changed = [];
        for (let i = 0; i < prevArr.length; i++) {
            if (String(prevArr[i]) !== String(currArr[i])) changed.push(i);
        }

        if (changed.length === 2) {
            const [i, j] = changed;
            if (String(prevArr[i]) === String(currArr[j]) && String(prevArr[j]) === String(currArr[i])) {
                return [i, j];
            }
        }
        return null;
    }

    findRemovedIndices(prevArr, currArr) {
        const removed = [];
        let currIdx = 0;

        for (let prevIdx = 0; prevIdx < prevArr.length; prevIdx++) {
            if (currIdx < currArr.length && String(prevArr[prevIdx]) === String(currArr[currIdx])) {
                currIdx++;
            } else {
                removed.push(prevIdx);
            }
        }
        return removed;
    }

    getFallback() {
        return {
            structures: [],
            steps: [{
                id: 'step_1',
                title: 'No Data',
                description: 'Could not process input',
                array: [],
                pointers: {},
                highlight: [],
                variables: {}
            }]
        };
    }
}

module.exports = { UniversalNormalizer };
