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
    return `You are an algorithm visualization engine.

PROBLEM: ${problemStatement}

VERY IMPORTANT: For sorting/swapping problems, EACH STEP MUST include the CURRENT array state after any changes!

Return JSON:

{
  "pattern": "sorting",
  "structures": [
    {"id": "arr", "type": "array", "label": "Array", "data": [5,3,8,1]}
  ],
  "steps": [
    {
      "title": "Initial",
      "description": "Starting array",
      "array": [5,3,8,1],
      "highlight": [],
      "variables": {}
    },
    {
      "title": "Compare 5 and 3",
      "description": "5 > 3, need to swap",
      "array": [5,3,8,1],
      "highlight": [0,1],
      "variables": {"comparing": "5 vs 3"}
    },
    {
      "title": "Swap 5 and 3",
      "description": "Swapped positions 0 and 1",
      "array": [3,5,8,1],
      "highlight": [0,1],
      "swap": [0,1],
      "variables": {"swapped": true}
    },
    {
      "title": "Compare 5 and 8",
      "description": "5 < 8, no swap needed",
      "array": [3,5,8,1],
      "highlight": [1,2],
      "variables": {}
    },
    {
      "title": "Compare 8 and 1",
      "description": "8 > 1, need to swap",
      "array": [3,5,8,1],
      "highlight": [2,3],
      "variables": {}
    },
    {
      "title": "Swap 8 and 1",
      "description": "Swapped positions 2 and 3",
      "array": [3,5,1,8],
      "highlight": [2,3],
      "swap": [2,3],
      "variables": {}
    }
  ]
}

CRITICAL RULES:
1. EACH step MUST have "array" field showing the CURRENT state of the array
2. When a swap happens, the next step's "array" should show the swapped values
3. Include "swap": [i, j] when elements swap positions
4. Include "highlight" to show which elements are being compared/swapped
5. Return ONLY valid JSON, no text before or after
6. Generate 8-15 steps for sorting problems

Return ONLY the JSON.`;
  }
}

module.exports = { OllamaAdapter };