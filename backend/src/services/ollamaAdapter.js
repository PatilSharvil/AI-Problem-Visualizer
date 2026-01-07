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
      // Add 60-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: this.buildPrompt(prompt),
          stream: false,
          options: { temperature: 0.1, num_predict: 2000 }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseJSON(data.response);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('LLM request timed out after 60 seconds');
        throw new Error('LLM request timed out. Try a simpler problem or check if Ollama is running correctly.');
      }
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
    // Detect problem type for focused examples
    const problemLower = problem.toLowerCase();

    let example = '';

    if (problemLower.includes('stack') || problemLower.includes('push') || problemLower.includes('pop')) {
      example = this.getStackExample();
    } else if (problemLower.includes('queue') || problemLower.includes('enqueue') || problemLower.includes('dequeue') || problemLower.includes('bfs')) {
      example = this.getQueueExample();
    } else if (problemLower.includes('tree') || problemLower.includes('bst') || problemLower.includes('inorder') || problemLower.includes('preorder') || problemLower.includes('postorder') || problemLower.includes('traversal') || problemLower.includes('search')) {
      example = this.getTreeExample();
    } else if (problemLower.includes('sort') || problemLower.includes('bubble') || problemLower.includes('selection')) {
      example = this.getSortExample();
    } else if (problemLower.includes('window') || problemLower.includes('sliding')) {
      example = this.getSlidingWindowExample();
    } else {
      example = this.getTwoPointerExample();
    }

    return `You are an algorithm visualization engine.

PROBLEM: ${problem}

RULES:
1. Use ACTUAL values from the problem
2. Show EVERY step
3. Return valid JSON only

${example}

Generate steps for the EXACT problem above!`;
  }

  getStackExample() {
    return `STACK OUTPUT FORMAT:
{
  "structures": [{"id": "stack", "type": "stack", "label": "Stack", "data": []}],
  "steps": [
    {"title": "Push 1", "description": "Push 1 to stack", "stack": [1]},
    {"title": "Push 2", "description": "Push 2 to stack", "stack": [1, 2]},
    {"title": "Pop", "description": "Pop from stack, got 2", "stack": [1]},
    {"title": "Done", "description": "Stack operations complete", "stack": [1]}
  ]
}`;
  }

  getQueueExample() {
    return `QUEUE OUTPUT FORMAT:
{
  "structures": [{"id": "queue", "type": "queue", "label": "Queue", "data": []}],
  "steps": [
    {"title": "Enqueue 1", "description": "Add 1 to queue", "queue": [1]},
    {"title": "Enqueue 2", "description": "Add 2 to queue", "queue": [1, 2]},
    {"title": "Dequeue", "description": "Remove from front, got 1", "queue": [2]},
    {"title": "Done", "description": "Queue operations complete", "queue": [2]}
  ]
}`;
  }

  getTreeExample() {
    return `TREE OUTPUT FORMAT - Always use "tree" field and "Visit X" in title to highlight nodes.

Tree [4,2,6,1,3,5,7] represents:
        4
       / \\
      2   6
     / \\ / \\
    1  3 5  7

TRAVERSAL ORDERS:
- INORDER (Left-Root-Right): 1,2,3,4,5,6,7
- PREORDER (Root-Left-Right): 4,2,1,3,6,5,7  
- POSTORDER (Left-Right-Root): 1,3,2,5,7,6,4
- BFS/Level-Order: 4,2,6,1,3,5,7

BST SEARCH EXAMPLE - Search for 5 in [4,2,6,1,3,5,7]:
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Visit 4", "description": "Start at root. 5 > 4, go RIGHT", "tree": [4,2,6,1,3,5,7], "variables": {"target": 5, "current": 4}},
    {"title": "Visit 6", "description": "At 6. 5 < 6, go LEFT", "tree": [4,2,6,1,3,5,7], "variables": {"target": 5, "current": 6}},
    {"title": "Visit 5", "description": "Found 5!", "tree": [4,2,6,1,3,5,7], "variables": {"target": 5, "found": true}},
    {"title": "Done", "description": "Element 5 found at depth 3", "tree": [4,2,6,1,3,5,7], "variables": {"found": true}}
  ]
}

BST SEARCH follows: compare target with current node, go LEFT if smaller, RIGHT if larger!

TRAVERSAL EXAMPLE for PREORDER of [4,2,6,1,3,5,7]:
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Visit 4", "description": "Start at root", "tree": [4,2,6,1,3,5,7], "result": [4]},
    {"title": "Visit 2", "description": "Go to left child", "tree": [4,2,6,1,3,5,7], "result": [4,2]},
    {"title": "Visit 1", "description": "Go to left leaf", "tree": [4,2,6,1,3,5,7], "result": [4,2,1]},
    {"title": "Visit 3", "description": "Backtrack, visit right of 2", "tree": [4,2,6,1,3,5,7], "result": [4,2,1,3]},
    {"title": "Visit 6", "description": "Backtrack to root, go right", "tree": [4,2,6,1,3,5,7], "result": [4,2,1,3,6]},
    {"title": "Visit 5", "description": "Left child of 6", "tree": [4,2,6,1,3,5,7], "result": [4,2,1,3,6,5]},
    {"title": "Visit 7", "description": "Right child of 6", "tree": [4,2,6,1,3,5,7], "result": [4,2,1,3,6,5,7]},
    {"title": "Done", "description": "Preorder: 4,2,1,3,6,5,7", "tree": [4,2,6,1,3,5,7], "result": [4,2,1,3,6,5,7]}
  ]
}

Use the CORRECT pattern based on the problem (search vs traversal)!`;
  }

  getSortExample() {
    return `SORTING OUTPUT FORMAT:
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [3,1,2]}],
  "steps": [
    {"title": "Compare", "description": "Compare 3 and 1", "array": [3,1,2], "highlight": [0,1]},
    {"title": "Swap", "description": "3 > 1, swap them", "array": [1,3,2], "highlight": [0,1]},
    {"title": "Compare", "description": "Compare 3 and 2", "array": [1,3,2], "highlight": [1,2]},
    {"title": "Swap", "description": "3 > 2, swap them", "array": [1,2,3], "highlight": [1,2]},
    {"title": "Done", "description": "Array sorted!", "array": [1,2,3]}
  ]
}`;
  }

  getSlidingWindowExample() {
    return `SLIDING WINDOW OUTPUT FORMAT:
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [2,1,5,1,3]}],
  "steps": [
    {"title": "Window [0-2]", "description": "Sum = 8", "array": [2,1,5,1,3], "highlight": [0,1,2], "variables": {"sum": 8}},
    {"title": "Slide", "description": "Remove 2, add 1", "array": [2,1,5,1,3], "highlight": [1,2,3], "variables": {"sum": 7}},
    {"title": "Done", "description": "Max sum found", "array": [2,1,5,1,3], "variables": {"maxSum": 9}}
  ]
}`;
  }

  getTwoPointerExample() {
    return `TWO POINTER OUTPUT FORMAT:
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [1,2,3,4,5]}],
  "steps": [
    {"title": "Initialize", "description": "left=0, right=4", "array": [1,2,3,4,5], "pointers": {"left": 0, "right": 4}, "highlight": [0,4]},
    {"title": "Check", "description": "1+5=6", "array": [1,2,3,4,5], "pointers": {"left": 0, "right": 4}, "highlight": [0,4]},
    {"title": "Move Left", "description": "Sum < target, move left", "array": [1,2,3,4,5], "pointers": {"left": 1, "right": 4}, "highlight": [1,4]},
    {"title": "Found", "description": "Pair found!", "array": [1,2,3,4,5], "pointers": {"left": 1, "right": 3}, "highlight": [1,3]}
  ]
}`;
  }
}

module.exports = { OllamaAdapter };