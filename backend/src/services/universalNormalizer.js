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

        return steps.map((step, idx) => {
            // Extract raw data
            const rawStep = {
                id: `step_${idx + 1}`,
                title: step.title || `Step ${idx + 1}`,
                description: step.description || '',

                // Array variants
                array: step.array || step.arr || step.nums || step.input || step.arr1,
                array2: step.array2 || step.arr2,
                result: step.result || step.output || step.merged,

                // Linked list variants
                list: step.list || step.linkedList || step.linked_list,
                list1: step.list1 || step.linkedList1,
                list2: step.list2 || step.linkedList2,

                // DP variants
                dp: step.dp || step.dpTable || step.table || step.memo,
                dpTable: step.dpTable || step.dp_table,

                // Matrix variants
                matrix: step.matrix || step.grid || step.board,

                // Stack variants
                stack: step.stack || step.stack1 || step.stk,
                stack2: step.stack2,

                // Queue variants
                queue: step.queue || step.queue1 || step.q,
                queue2: step.queue2,

                // Hashmap variants
                hashmap: step.hashmap || step.hash || step.map || step.dict || step.seen,

                // Tree variants
                tree: step.tree || step.root,

                // Metadata
                pointers: step.pointers || step.indices || {},
                highlight: this.normalizeHighlight(step.highlight || step.current || step.active),
                variables: step.variables || step.vars || {},

                // Cell references
                currentCell: step.currentCell || step.current_cell || step.cell,
                dpHighlight: step.dpHighlight || step.dp_highlight || step.dependencies,
                path: step.path || step.route
            };

            // Apply validation
            return this.validateStep(rawStep);
        });
    }

    /**
     * Lightweight validation to ensure believable states
     */
    validateStep(step) {
        const arrayLen = step.array?.length || 0;

        // Validate pointers are within bounds
        if (step.pointers && arrayLen > 0) {
            step.pointers = this.sanitizePointers(step.pointers, arrayLen);
        }

        // Validate highlight indices within bounds
        if (step.highlight && arrayLen > 0) {
            step.highlight = step.highlight.filter(i => i >= 0 && i < arrayLen);
        }

        // Ensure stack is always an array
        if (step.stack && !Array.isArray(step.stack)) {
            step.stack = [];
        }

        // Ensure queue is always an array
        if (step.queue && !Array.isArray(step.queue)) {
            step.queue = [];
        }

        // Ensure tree is always an array
        if (step.tree && !Array.isArray(step.tree)) {
            step.tree = [];
        }

        // Ensure result is always an array
        if (step.result && !Array.isArray(step.result)) {
            step.result = [];
        }

        return step;
    }

    /**
     * Sanitize pointer values to stay within array bounds
     */
    sanitizePointers(pointers, arrayLen) {
        const sanitized = {};
        for (const [key, value] of Object.entries(pointers)) {
            if (typeof value === 'number') {
                // Clamp to valid range [0, arrayLen-1]
                sanitized[key] = Math.max(0, Math.min(value, arrayLen - 1));
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
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

        // Pre-scan: find all entities that EVER have data (to show empty states later)
        const entitiesWithData = new Set();
        for (const step of steps) {
            if (step.stack && Array.isArray(step.stack) && step.stack.length > 0) entitiesWithData.add('stack');
            if (step.stack2 && Array.isArray(step.stack2) && step.stack2.length > 0) entitiesWithData.add('stack2');
            if (step.queue && Array.isArray(step.queue) && step.queue.length > 0) entitiesWithData.add('queue');
            if (step.queue2 && Array.isArray(step.queue2) && step.queue2.length > 0) entitiesWithData.add('queue2');
            if (step.array && Array.isArray(step.array) && step.array.length > 0) entitiesWithData.add('arr');
            if (step.list && Array.isArray(step.list) && step.list.length > 0) entitiesWithData.add('list');
        }

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const entities = this.buildEntities(step, structures, entitiesWithData);
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
     * @param {Object} step - Current step data
     * @param {Array} structures - LLM-defined structures
     * @param {Set} entitiesWithData - Set of entity IDs that have data in ANY step (for empty state rendering)
     */
    buildEntities(step, structures, entitiesWithData = new Set()) {
        const entities = [];
        const addedIds = new Set();
        const addedDataSignatures = new Set(); // Track content to avoid duplicate data

        // Helper to create data signature for dedup
        const getDataSignature = (data) => JSON.stringify(data);

        // Helper to add entity only if not already added (by id OR by content)
        const addEntity = (entity) => {
            if (addedIds.has(entity.id)) return;

            const sig = getDataSignature(entity.data);
            // Skip if same content already exists (avoid duplicate arrays with same data)
            if (addedDataSignatures.has(sig) && entity.type === 'array') return;

            addedIds.add(entity.id);
            addedDataSignatures.add(sig);
            entities.push(entity);
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

        // Handle standalone data fields - only add if not already present AND has content
        if (step.array && Array.isArray(step.array) && step.array.length > 0 && !addedIds.has('arr') && !addedIds.has('arr1')) {
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

        if (step.array2 && Array.isArray(step.array2) && step.array2.length > 0 && !addedIds.has('arr2')) {
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

        if (step.result && Array.isArray(step.result) && step.result.length > 0 && !addedIds.has('result')) {
            addEntity({
                id: 'result',
                type: 'array',
                data: step.result,
                meta: { label: 'Result' }
            });
        }

        if (step.list1 && Array.isArray(step.list1) && step.list1.length > 0 && !addedIds.has('list1')) {
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

        if (step.list2 && Array.isArray(step.list2) && step.list2.length > 0 && !addedIds.has('list2')) {
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

        // Handle single list (when not using list1/list2)
        if (step.list && Array.isArray(step.list) && step.list.length > 0 && !addedIds.has('list') && !addedIds.has('list1')) {
            addEntity({
                id: 'list',
                type: 'linked_list',
                data: step.list,
                meta: {
                    label: 'Linked List',
                    pointers: this.getPointersForEntity(step.pointers, 'list', ['prev', 'curr', 'next', 'slow', 'fast'])
                }
            });
        }

        // Handle tree
        if (step.tree && !addedIds.has('tree')) {
            // Extract current node from step title (e.g., "Visit 5" -> 5)
            let currentNode = null;
            const visitMatch = step.title?.match(/visit\s+['"]?(\w+)['"]?/i);
            if (visitMatch) {
                currentNode = isNaN(visitMatch[1]) ? visitMatch[1] : parseInt(visitMatch[1]);
            }

            addEntity({
                id: 'tree',
                type: 'tree',
                data: step.tree,
                meta: {
                    label: 'Tree',
                    currentNode: currentNode,
                    highlight: step.highlight
                }
            });
        }

        if ((step.dp || step.dpTable) && !addedIds.has('dp')) {
            const dpData = step.dp || step.dpTable;
            if (dpData && (Array.isArray(dpData) ? dpData.length > 0 : true)) {
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
        }

        if (step.matrix && Array.isArray(step.matrix) && step.matrix.length > 0 && !addedIds.has('matrix')) {
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

        // Stack: show if has data OR if it was used earlier (show empty state)
        if (step.stack && Array.isArray(step.stack) && !addedIds.has('stack')) {
            if (step.stack.length > 0 || entitiesWithData.has('stack')) {
                addEntity({
                    id: 'stack',
                    type: 'stack',
                    data: step.stack,
                    meta: { label: 'Stack' }
                });
            }
        }

        if (step.stack2 && Array.isArray(step.stack2) && !addedIds.has('stack2')) {
            if (step.stack2.length > 0 || entitiesWithData.has('stack2')) {
                addEntity({
                    id: 'stack2',
                    type: 'stack',
                    data: step.stack2,
                    meta: { label: 'Stack 2' }
                });
            }
        }

        // Queue: show if has data OR if it was used earlier (show empty state)
        if (step.queue && Array.isArray(step.queue) && !addedIds.has('queue')) {
            if (step.queue.length > 0 || entitiesWithData.has('queue')) {
                addEntity({
                    id: 'queue',
                    type: 'queue',
                    data: step.queue,
                    meta: { label: 'Queue' }
                });
            }
        }

        if (step.queue2 && Array.isArray(step.queue2) && !addedIds.has('queue2')) {
            if (step.queue2.length > 0 || entitiesWithData.has('queue2')) {
                addEntity({
                    id: 'queue2',
                    type: 'queue',
                    data: step.queue2,
                    meta: { label: 'Queue 2' }
                });
            }
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

            // Detect tree visit from step title (for tree entities)
            if (entity.type === 'tree') {
                const visitMatch = step.title?.match(/visit\s+['"]?(\w+)['"]?/i);
                if (visitMatch) {
                    const visitValue = isNaN(visitMatch[1]) ? visitMatch[1] : parseInt(visitMatch[1]);
                    actions.push({
                        type: 'visit',
                        target: entity.id,
                        value: visitValue
                    });
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
