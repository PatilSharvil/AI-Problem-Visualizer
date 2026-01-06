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
    return `You are an algorithm visualization engine.

PROBLEM: ${problem}

CRITICAL RULES:
1. Use ACTUAL values from the problem, never example values
2. Show EVERY SINGLE STEP - never skip any operation
3. The "array" field must reflect the CURRENT STATE after each step
4. For operations that build a result, use "result" field to show it building up
5. The FINAL step must show the ACTUAL result in the array/result field
6. For TREE TRAVERSAL: Show the TREE itself with "Visit X" titles. Do NOT output stack - visualize the TREE nodes being visited!

Return JSON with:
- structures: [{id, type, label, data}]
- steps: array of EVERY step

STEP FIELDS:
- title: "Compare", "Swap", "Push", "Pop", etc.
- description: what happens
- array: current INPUT array state (can change during algorithm)
- result: current RESULT/OUTPUT array (builds up during algorithm)
- highlight: [indices being operated on]
- pointers: {i, j, left, right, prev, curr, next}
- stack: current stack state
- queue: current queue state
- variables: {name: value}

SORTING EXAMPLE for [3,1,2]:
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [3,1,2]}],
  "steps": [
    {"title": "Compare", "description": "Compare 3 and 1", "array": [3,1,2], "highlight": [0,1]},
    {"title": "Swap", "description": "3 > 1, swap", "array": [1,3,2], "highlight": [0,1]},
    {"title": "Compare", "description": "Compare 3 and 2", "array": [1,3,2], "highlight": [1,2]},
    {"title": "Swap", "description": "3 > 2, swap", "array": [1,2,3], "highlight": [1,2]},
    {"title": "Done", "description": "Sorted!", "array": [1,2,3], "highlight": []}
  ]
}

STACK REVERSE EXAMPLE for "abc":
{
  "structures": [
    {"id": "stack", "type": "stack", "label": "Stack", "data": []},
    {"id": "result", "type": "array", "label": "Result", "data": []}
  ],
  "steps": [
    {"title": "Push 'a'", "description": "Push a to stack", "stack": ["a"], "result": []},
    {"title": "Push 'b'", "description": "Push b to stack", "stack": ["a","b"], "result": []},
    {"title": "Push 'c'", "description": "Push c to stack", "stack": ["a","b","c"], "result": []},
    {"title": "Pop 'c'", "description": "Pop c, add to result", "stack": ["a","b"], "result": ["c"]},
    {"title": "Pop 'b'", "description": "Pop b, add to result", "stack": ["a"], "result": ["c","b"]},
    {"title": "Pop 'a'", "description": "Pop a, add to result", "stack": [], "result": ["c","b","a"]},
    {"title": "Done", "description": "Reversed: cba", "stack": [], "result": ["c","b","a"]}
  ]
}

TREE TRAVERSAL EXAMPLE for BST [4,2,6,1,3,5,7] inorder:
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": [4,2,6,1,3,5,7]}],
  "steps": [
    {"title": "Visit 1", "description": "Left subtree first", "tree": [4,2,6,1,3,5,7], "result": [1]},
    {"title": "Visit 2", "description": "Visit parent", "tree": [4,2,6,1,3,5,7], "result": [1,2]},
    {"title": "Visit 3", "description": "Right of 2", "tree": [4,2,6,1,3,5,7], "result": [1,2,3]},
    {"title": "Visit 4", "description": "Visit root", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4]},
    {"title": "Done", "description": "Inorder complete!", "tree": [4,2,6,1,3,5,7], "result": [1,2,3,4,5,6,7]}
  ]
}

BST INSERT EXAMPLE for inserting 3, 5, 7, 1:
{
  "structures": [{"id": "tree", "type": "tree", "label": "BST", "data": []}],
  "steps": [
    {"title": "Insert 3", "description": "Insert 3 as root", "tree": [3]},
    {"title": "Insert 5", "description": "5 > 3, insert right", "tree": [3, 5]},
    {"title": "Insert 7", "description": "7 > 5, insert right", "tree": [3, 5, 7]},
    {"title": "Insert 1", "description": "1 < 3, insert left", "tree": [3, 5, 7, 1]},
    {"title": "Done", "description": "BST complete!", "tree": [3, 5, 7, 1]}
  ]
}

IMPORTANT: For tree operations, ALWAYS include the "tree" field with current tree values in EVERY step!

Return ONLY valid JSON. Show EVERY step!`;
  }
}

module.exports = { OllamaAdapter };