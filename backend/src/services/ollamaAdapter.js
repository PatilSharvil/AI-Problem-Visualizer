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
2. Show EVERY SINGLE STEP - never skip any comparison or swap
3. For sorting: show state BEFORE the swap, then AFTER the swap as separate steps
4. Include highlight array to show which indices are being compared/swapped

Return JSON with:
- structures: [{id, type, label, data}]
- steps: array of EVERY step

STEP FIELDS:
- title: "Compare", "Swap", "Push", "Pop", etc.
- description: what happens
- array: current array state AFTER this step
- highlight: [indices being compared/swapped]
- pointers: {i, j, left, right, prev, curr, next}
- stack: current stack state
- variables: {name: value}

SORTING EXAMPLE for [3,1,2]:
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [3,1,2]}],
  "steps": [
    {"title": "Compare", "description": "Compare 3 and 1 at indices 0,1", "array": [3,1,2], "highlight": [0,1], "pointers": {"i": 0, "j": 1}},
    {"title": "Swap", "description": "3 > 1, swap them", "array": [1,3,2], "highlight": [0,1], "pointers": {"i": 0, "j": 1}},
    {"title": "Compare", "description": "Compare 3 and 2 at indices 1,2", "array": [1,3,2], "highlight": [1,2], "pointers": {"i": 1, "j": 2}},
    {"title": "Swap", "description": "3 > 2, swap them", "array": [1,2,3], "highlight": [1,2], "pointers": {"i": 1, "j": 2}},
    {"title": "Compare", "description": "Compare 1 and 2 at indices 0,1", "array": [1,2,3], "highlight": [0,1], "pointers": {"i": 0, "j": 1}},
    {"title": "No Swap", "description": "1 < 2, already in order", "array": [1,2,3], "highlight": [0,1], "pointers": {"i": 0, "j": 1}},
    {"title": "Done", "description": "Array is sorted!", "array": [1,2,3], "highlight": [], "pointers": {}}
  ]
}

STACK EXAMPLE for reverse "ab":
{
  "structures": [{"id": "stack", "type": "stack", "label": "Stack", "data": []}],
  "steps": [
    {"title": "Push 'a'", "description": "Push first character", "stack": ["a"], "array": ["a","b"], "highlight": [0]},
    {"title": "Push 'b'", "description": "Push second character", "stack": ["a","b"], "array": ["a","b"], "highlight": [1]},
    {"title": "Pop 'b'", "description": "Pop from stack", "stack": ["a"], "array": ["b"], "highlight": []},
    {"title": "Pop 'a'", "description": "Pop from stack", "stack": [], "array": ["b","a"], "highlight": []},
    {"title": "Done", "description": "Reversed: ba", "stack": [], "array": ["b","a"], "highlight": []}
  ]
}

Return ONLY valid JSON. Show EVERY step, never skip!`;
  }
}

module.exports = { OllamaAdapter };