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
          prompt: this.buildUniversalPrompt(prompt),
          stream: false,
          options: { temperature: 0.1 }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseJSON(data.response);
    } catch (error) {
      console.error('Error calling Ollama API:', error.message);
      throw error;
    }
  }

  parseJSON(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.log('Strategy 1 failed, trying fixes...');
    }

    try {
      let fixed = text.match(/\{[\s\S]*\}/)?.[0] || text;
      fixed = fixed.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      fixed = fixed.replace(/'/g, '"');
      return JSON.parse(fixed);
    } catch (e) {
      console.log('Strategy 2 failed');
    }

    return this.getFallbackStructure();
  }

  getFallbackStructure() {
    return {
      pattern: "unknown",
      structures: [{ id: "arr", type: "array", label: "Data", data: [1, 2, 3, 4, 5] }],
      steps: [{ title: "Processing", description: "Check logs", pointers: {}, highlight: [], variables: {} }]
    };
  }

  buildUniversalPrompt(problemStatement) {
    return `You are an algorithm visualization engine. Analyze the problem and return step-by-step visualization.

CRITICAL: Use the ACTUAL values from the problem. DO NOT use example values like [1,3,5] or [2,4,6]. Extract the real data from the problem statement.

PROBLEM: ${problemStatement}

Return JSON with this structure based on problem type:

FOR ARRAY PROBLEMS (sorting, searching, two pointers):
- pattern: "sorting" or "two_pointers" or "sliding_window"
- structures: [{id: "arr", type: "array", label: "Array", data: <ACTUAL_ARRAY_FROM_PROBLEM>}]
- steps: Show each comparison/swap with array, highlight, pointers, variables

FOR MERGE PROBLEMS:
- pattern: "merge"
- structures: [{id: "arr1", type: "array", label: "Array 1", data: <FIRST_ARRAY>}, {id: "arr2", type: "array", label: "Array 2", data: <SECOND_ARRAY>}, {id: "result", type: "array", label: "Result", data: []}]
- steps: Each step must have array, array2, result, pointers: {i, j}

FOR LINKED LIST:
- pattern: "linked_list" or "linked_list_reversal"
- structures: [{id: "list", type: "linked_list", label: "Linked List", data: <ACTUAL_LIST>}]
- steps: Show array field updating, use pointers: {prev, curr, next}

FOR LINKED LIST MERGE:
- pattern: "linked_list_merge"
- structures: []
- steps: Each step must have list1, list2, array (merged result), pointers: {p1, p2}
- Example step: {"title": "Compare", "description": "1 < 2, take 1", "list1": [1,3,5], "list2": [2,4,6], "array": [1], "pointers": {"p1": 0, "p2": 0}}

FOR DP PROBLEMS:
- pattern: "dp"
- structures: []
- steps: Each step has dp array with currentCell index and dpHighlight for dependencies

EXAMPLE for "Merge [1,3,5,7] and [2,4,6,8]":
{
  "pattern": "merge",
  "structures": [
    {"id": "arr1", "type": "array", "label": "Array 1", "data": [1,3,5,7]},
    {"id": "arr2", "type": "array", "label": "Array 2", "data": [2,4,6,8]},
    {"id": "result", "type": "array", "label": "Result", "data": []}
  ],
  "steps": [
    {"title": "Compare 1 vs 2", "description": "1 < 2, take 1", "array": [1,3,5,7], "array2": [2,4,6,8], "result": [1], "pointers": {"i": 0, "j": 0}, "variables": {}},
    {"title": "Compare 3 vs 2", "description": "3 > 2, take 2", "array": [1,3,5,7], "array2": [2,4,6,8], "result": [1,2], "pointers": {"i": 1, "j": 0}, "variables": {}},
    {"title": "Compare 3 vs 4", "description": "3 < 4, take 3", "array": [1,3,5,7], "array2": [2,4,6,8], "result": [1,2,3], "pointers": {"i": 1, "j": 1}, "variables": {}},
    {"title": "Compare 5 vs 4", "description": "5 > 4, take 4", "array": [1,3,5,7], "array2": [2,4,6,8], "result": [1,2,3,4], "pointers": {"i": 2, "j": 1}, "variables": {}},
    {"title": "Complete", "description": "Merged!", "array": [1,3,5,7], "array2": [2,4,6,8], "result": [1,2,3,4,5,6,7,8], "pointers": {}, "variables": {"result": "[1,2,3,4,5,6,7,8]"}}
  ]
}

RULES:
1. Use ACTUAL values from the problem, not example values
2. Each step MUST have the data field (array, dp, etc.) showing current state
3. Generate 8-15 detailed steps
4. Return ONLY valid JSON, no text before or after

Return ONLY the JSON.`;
  }
}

module.exports = { OllamaAdapter };