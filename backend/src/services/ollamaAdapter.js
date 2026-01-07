const { LLMAdapterInterface } = require('./llmAdapterInterface');
const fetch = require('node-fetch');

class OllamaAdapter extends LLMAdapterInterface {
    constructor(model = 'qwen2.5-coder:7b-instruct') {
        super();
        this.model = process.env.OLLAMA_MODEL || model;
        this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    }

    async callLLM(prompt) {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: this.buildPrompt(prompt),
                    stream: false,
                    options: { temperature: 0.1 }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const data = await response.json();
            return this.parseJSON(data.response);
        } catch (error) {
            console.error('Ollama error:', error.message);
            throw error;
        }
    }

    parseJSON(text) {
        try {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
        } catch (e) {
            console.log('JSON parse failed, trying cleanup...');
        }

        try {
            let fixed = text.match(/\{[\s\S]*\}/)?.[0] || text;
            fixed = fixed.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            return JSON.parse(fixed);
        } catch (e) {
            return this.getFallback();
        }
    }

    getFallback() {
        return {
            structures: [{ id: "arr", type: "array", label: "Data", data: [] }],
            steps: [{ title: "Error", description: "Could not parse LLM output", array: [], variables: {} }]
        };
    }

    buildPrompt(problem) {
        return `You are an algorithm visualization engine that generates step-by-step algorithm traces.

PROBLEM: ${problem}

=== CRITICAL RULES ===
1. Use ACTUAL values from the problem (never use example values)
2. Show EVERY step - comparisons, swaps, pointer moves, pushes, pops
3. Pointers must stay within valid array bounds (0 to length-1)
4. Stack: can only pop if stack is not empty
5. Queue: can only dequeue if queue is not empty
6. Array modifications must show the RESULTING state after the operation
7. Tree: include "tree" field in EVERY step

=== OUTPUT FORMAT ===
{
  "structures": [{"id": "...", "type": "array|stack|queue|tree", "label": "...", "data": [...]}],
  "steps": [
    {
      "title": "Operation name",
      "description": "What happens",
      "array": [...],           // current array state
      "highlight": [i, j],      // indices being operated on
      "pointers": {"left": 0, "right": 5},  // pointer positions
      "stack": [...],           // current stack (if applicable)
      "queue": [...],           // current queue (if applicable)
      "tree": [...],            // current tree nodes (if applicable)
      "result": [...],          // result being built (if applicable)
      "variables": {"sum": 10}  // any tracked variables
    }
  ]
}

=== TWO POINTER EXAMPLE: Find pair with sum 9 in [1,2,3,4,5,6] ===
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [1,2,3,4,5,6]}],
  "steps": [
    {"title": "Initialize", "description": "left=0, right=5", "array": [1,2,3,4,5,6], "pointers": {"left": 0, "right": 5}, "highlight": [0,5], "variables": {"sum": 7}},
    {"title": "Check Sum", "description": "1+6=7 < 9, move left", "array": [1,2,3,4,5,6], "pointers": {"left": 1, "right": 5}, "highlight": [1,5], "variables": {"sum": 8}},
    {"title": "Check Sum", "description": "2+6=8 < 9, move left", "array": [1,2,3,4,5,6], "pointers": {"left": 2, "right": 5}, "highlight": [2,5], "variables": {"sum": 9}},
    {"title": "Found!", "description": "3+6=9, pair found at indices 2,5", "array": [1,2,3,4,5,6], "pointers": {"left": 2, "right": 5}, "highlight": [2,5], "variables": {"sum": 9}}
  ]
}

=== SLIDING WINDOW EXAMPLE: Max sum of size 3 in [2,1,5,1,3,2] ===
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [2,1,5,1,3,2]}],
  "steps": [
    {"title": "Window [0-2]", "description": "Sum = 2+1+5 = 8", "array": [2,1,5,1,3,2], "highlight": [0,1,2], "variables": {"windowSum": 8, "maxSum": 8}},
    {"title": "Slide Right", "description": "Remove 2, add 1. Sum = 8-2+1 = 7", "array": [2,1,5,1,3,2], "highlight": [1,2,3], "variables": {"windowSum": 7, "maxSum": 8}},
    {"title": "Slide Right", "description": "Remove 1, add 3. Sum = 7-1+3 = 9", "array": [2,1,5,1,3,2], "highlight": [2,3,4], "variables": {"windowSum": 9, "maxSum": 9}},
    {"title": "Slide Right", "description": "Remove 5, add 2. Sum = 9-5+2 = 6", "array": [2,1,5,1,3,2], "highlight": [3,4,5], "variables": {"windowSum": 6, "maxSum": 9}},
    {"title": "Done", "description": "Maximum sum = 9", "array": [2,1,5,1,3,2], "highlight": [2,3,4], "variables": {"maxSum": 9}}
  ]
}

=== BUBBLE SORT EXAMPLE: Sort [5,3,1] ===
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [5,3,1]}],
  "steps": [
    {"title": "Compare", "description": "Compare 5 and 3", "array": [5,3,1], "highlight": [0,1], "pointers": {"i": 0, "j": 1}},
    {"title": "Swap", "description": "5 > 3, swap", "array": [3,5,1], "highlight": [0,1], "pointers": {"i": 0, "j": 1}},
    {"title": "Compare", "description": "Compare 5 and 1", "array": [3,5,1], "highlight": [1,2], "pointers": {"i": 1, "j": 2}},
    {"title": "Swap", "description": "5 > 1, swap", "array": [3,1,5], "highlight": [1,2], "pointers": {"i": 1, "j": 2}},
    {"title": "Compare", "description": "Compare 3 and 1", "array": [3,1,5], "highlight": [0,1], "pointers": {"i": 0, "j": 1}},
    {"title": "Swap", "description": "3 > 1, swap", "array": [1,3,5], "highlight": [0,1], "pointers": {"i": 0, "j": 1}},
    {"title": "Done", "description": "Array sorted!", "array": [1,3,5], "highlight": []}
  ]
}

=== STACK EXAMPLE: Check if "(())" is valid ===
{
  "structures": [{"id": "stack", "type": "stack", "label": "Stack", "data": []}],
  "steps": [
    {"title": "Push '('", "description": "Open paren, push to stack", "stack": ["("], "variables": {"char": "("}},
    {"title": "Push '('", "description": "Open paren, push to stack", "stack": ["(", "("], "variables": {"char": "("}},
    {"title": "Pop", "description": "Close paren matches, pop from stack", "stack": ["("], "variables": {"char": ")"}},
    {"title": "Pop", "description": "Close paren matches, pop from stack", "stack": [], "variables": {"char": ")"}},
    {"title": "Valid!", "description": "Stack is empty, parentheses are valid", "stack": [], "variables": {"result": true}}
  ]
}

=== QUEUE BFS EXAMPLE: BFS from node 1 in graph ===
{
  "structures": [{"id": "queue", "type": "queue", "label": "Queue", "data": []}],
  "steps": [
    {"title": "Start", "description": "Enqueue starting node 1", "queue": [1], "result": []},
    {"title": "Visit 1", "description": "Dequeue 1, enqueue neighbors 2,3", "queue": [2, 3], "result": [1]},
    {"title": "Visit 2", "description": "Dequeue 2, enqueue neighbor 4", "queue": [3, 4], "result": [1, 2]},
    {"title": "Visit 3", "description": "Dequeue 3, no new neighbors", "queue": [4], "result": [1, 2, 3]},
    {"title": "Visit 4", "description": "Dequeue 4, no new neighbors", "queue": [], "result": [1, 2, 3, 4]},
    {"title": "Done", "description": "BFS complete: 1,2,3,4", "queue": [], "result": [1, 2, 3, 4]}
  ]
}

=== TREE INORDER TRAVERSAL: BST [4,2,6,1,3,5,7] ===
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Visit 1", "description": "Leftmost node first", "tree": [4,2,6,1,3,5,7], "result": [1]},
    {"title": "Visit 2", "description": "Go to parent of 1", "tree": [4,2,6,1,3,5,7], "result": [1,2]},
    {"title": "Visit 3", "description": "Right child of 2", "tree": [4,2,6,1,3,5,7], "result": [1,2,3]},
    {"title": "Visit 4", "description": "Root node", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4]},
    {"title": "Visit 5", "description": "Left of right subtree", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4,5]},
    {"title": "Visit 6", "description": "Right subtree root", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4,5,6]},
    {"title": "Visit 7", "description": "Rightmost node", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4,5,6,7]},
    {"title": "Done", "description": "Inorder: 1,2,3,4,5,6,7", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4,5,6,7]}
  ]
}

=== BST INSERT: Insert 5,3,7,1 ===
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": []}],
  "steps": [
    {"title": "Insert 5", "description": "5 becomes root", "tree": [5]},
    {"title": "Insert 3", "description": "3 < 5, go left", "tree": [5, 3]},
    {"title": "Insert 7", "description": "7 > 5, go right", "tree": [5, 3, 7]},
    {"title": "Insert 1", "description": "1 < 5, 1 < 3, go left of 3", "tree": [5, 3, 7, 1]},
    {"title": "Done", "description": "BST complete", "tree": [5, 3, 7, 1]}
  ]
}

=== VALIDITY CONSTRAINTS ===
- Pointers: 0 <= pointer < array.length (NEVER negative or out of bounds)
- Two Pointers: left <= right (always)
- Stack pop: only if stack has elements
- Queue dequeue: only if queue has elements
- Array swap: show state AFTER swap, not before

Return ONLY valid JSON. Generate steps for the given problem!`;
    }
}

module.exports = { OllamaAdapter };