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
          options: { temperature: 0 }
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

PROBLEM: ${problemStatement}

Detect the problem type and return appropriate JSON:

FOR SORTING/ARRAY PROBLEMS - use "sorting" or appropriate pattern:
{
  "pattern": "sorting",
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [5,3,8,1]}],
  "steps": [
    {"title": "Step", "description": "...", "array": [5,3,8,1], "highlight": [0,1], "swap": [0,1], "variables": {}}
  ]
}

FOR LINKED LIST PROBLEMS - use "linked_list_reversal" or "linked_list":
IMPORTANT: Show the reversed portion progressively! After reversing a link, update the array to show current logical order.
{
  "pattern": "linked_list_reversal",
  "structures": [{"id": "list", "type": "linked_list", "label": "Linked List", "data": [1,2,3,4]}],
  "steps": [
    {"title": "Initial State", "description": "Original list: 1→2→3→4→null", "array": [1,2,3,4], "pointers": {"curr": 0}, "highlight": [0], "variables": {}},
    {"title": "Setup Pointers", "description": "prev=null, curr=1, save next=2", "array": [1,2,3,4], "pointers": {"prev": -1, "curr": 0, "next": 1}, "highlight": [0], "variables": {}},
    {"title": "Reverse Link 1→null", "description": "1.next = null (was 2)", "array": [1,2,3,4], "pointers": {"prev": 0, "curr": 1}, "highlight": [0,1], "variables": {"reversed": "1→null"}},
    {"title": "Reverse Link 2→1", "description": "2.next = 1 (was 3)", "array": [2,1,3,4], "pointers": {"prev": 1, "curr": 2}, "highlight": [0,1], "variables": {"reversed": "2→1→null"}},
    {"title": "Reverse Link 3→2", "description": "3.next = 2 (was 4)", "array": [3,2,1,4], "pointers": {"prev": 2, "curr": 3}, "highlight": [0,1], "variables": {"reversed": "3→2→1→null"}},
    {"title": "Reverse Link 4→3", "description": "4.next = 3 (was null)", "array": [4,3,2,1], "pointers": {"prev": 3, "curr": -1}, "highlight": [0], "variables": {"reversed": "4→3→2→1→null"}},
    {"title": "Complete", "description": "List fully reversed!", "array": [4,3,2,1], "pointers": {}, "highlight": [], "variables": {"result": "4→3→2→1→null"}}
  ]
}

FOR STACK PROBLEMS - use "stack" pattern:
{
  "pattern": "stack",
  "structures": [{"id": "stack", "type": "stack", "label": "Stack", "data": []}],
  "steps": [
    {"title": "Push 5", "description": "Adding 5 to stack", "array": [5], "stackOperation": "push", "stackOperationValue": 5, "variables": {"top": 5}},
    {"title": "Push 3", "description": "Adding 3 to stack", "array": [5,3], "stackOperation": "push", "stackOperationValue": 3, "variables": {"top": 3}},
    {"title": "Push 8", "description": "Adding 8 to stack", "array": [5,3,8], "stackOperation": "push", "stackOperationValue": 8, "variables": {"top": 8}},
    {"title": "Pop", "description": "Removing top element 8", "array": [5,3], "stackOperation": "pop", "stackOperationValue": 8, "variables": {"popped": 8, "top": 3}},
    {"title": "Peek", "description": "Looking at top: 3", "array": [5,3], "stackOperation": "peek", "stackOperationValue": 3, "variables": {"top": 3}}
  ]
}

FOR QUEUE/BFS PROBLEMS - use "queue" or "bfs" pattern:
{
  "pattern": "queue",
  "structures": [{"id": "queue", "type": "queue", "label": "Queue", "data": []}],
  "steps": [
    {"title": "Enqueue 1", "description": "Adding 1 to queue", "array": [1], "queueOperation": "enqueue", "queueOperationValue": 1, "variables": {}},
    {"title": "Enqueue 2", "description": "Adding 2 to queue", "array": [1,2], "queueOperation": "enqueue", "queueOperationValue": 2, "variables": {}},
    {"title": "Dequeue", "description": "Removing front element 1", "array": [2], "queueOperation": "dequeue", "queueOperationValue": 1, "variables": {"processed": 1}}
  ]
}

FOR TWO POINTERS/SLIDING WINDOW:
Use "pointers": {"left": 0, "right": 5} with "highlight" array

FOR MATRIX PROBLEMS - use "matrix" pattern:
{
  "pattern": "matrix",
  "structures": [],
  "steps": [
    {"title": "Start", "description": "At position (0,0)", "matrix": [[1,2,3],[4,5,6],[7,8,9]], "currentCell": [0,0], "variables": {}},
    {"title": "Move right", "description": "At position (0,1)", "matrix": [[1,2,3],[4,5,6],[7,8,9]], "currentCell": [0,1], "path": [[0,0]], "variables": {}}
  ]
}

FOR DYNAMIC PROGRAMMING - use "dp" pattern:
{
  "pattern": "dp",
  "structures": [],
  "steps": [
    {"title": "Base case", "description": "dp[0]=0, dp[1]=1", "dp": [0,1,null,null,null], "currentCell": 1, "variables": {"n": 5}},
    {"title": "Compute dp[2]", "description": "dp[2] = dp[0] + dp[1] = 1", "dp": [0,1,1,null,null], "currentCell": 2, "dpHighlight": [0,1], "variables": {}},
    {"title": "Compute dp[3]", "description": "dp[3] = dp[1] + dp[2] = 2", "dp": [0,1,1,2,null], "currentCell": 3, "dpHighlight": [1,2], "variables": {}},
    {"title": "Compute dp[4]", "description": "dp[4] = dp[2] + dp[3] = 3", "dp": [0,1,1,2,3], "currentCell": 4, "dpHighlight": [2,3], "variables": {"result": 3}}
  ]
}

FOR PROBLEMS USING MULTIPLE DATA STRUCTURES (e.g., array + stack, array + hashmap):
{
  "pattern": "multi_structure",
  "structures": [
    {"id": "arr", "type": "array", "label": "Input Array", "data": [2,7,11,15]},
    {"id": "map", "type": "hashmap", "label": "HashMap", "data": {}}
  ],
  "steps": [
    {"title": "Step 1", "description": "...", "array": [2,7,11,15], "hashmap": {}, "highlight": [0], "variables": {}},
    {"title": "Step 2", "description": "...", "array": [2,7,11,15], "hashmap": {"2": 0}, "highlight": [1], "variables": {}}
  ]
}

CRITICAL RULES:
1. EACH step MUST have the relevant data field showing CURRENT state
2. For linked list: use "pointers" with "prev", "curr", "next"
3. For matrix: use "currentCell": [row, col] and "path": [[r,c],...]
4. For DP: use "dp" array with "currentCell" index and "dpHighlight" for dependencies
5. Include "highlight" for elements being processed
6. Return ONLY valid JSON, no text before or after
7. Generate 8-15 detailed steps

Return ONLY the JSON.`;
  }
}

module.exports = { OllamaAdapter };