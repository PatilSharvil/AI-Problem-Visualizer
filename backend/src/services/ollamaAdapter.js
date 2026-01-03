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
      const responseText = data.response;

      return this.parseJSON(responseText);
    } catch (error) {
      console.error('Error calling Ollama API:', error.message);
      throw error;
    }
  }

  parseJSON(text) {
    // Strategy 1: Direct parse
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('Strategy 1 failed, trying fixes...');
    }

    // Strategy 2: Fix common JSON issues
    try {
      let fixed = text;
      const jsonMatch = fixed.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        fixed = jsonMatch[0];
      }

      fixed = fixed.replace(/,\s*}/g, '}');
      fixed = fixed.replace(/,\s*]/g, ']');
      fixed = fixed.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
      fixed = fixed.replace(/'/g, '"');
      fixed = fixed.replace(/[\x00-\x1F\x7F]/g, ' ');

      return JSON.parse(fixed);
    } catch (e) {
      console.log('Strategy 2 failed, trying minimal structure...');
    }

    console.log('Returning fallback structure');
    return this.getFallbackStructure();
  }

  getFallbackStructure() {
    return {
      pattern: "unknown",
      structures: [
        { id: "arr", type: "array", label: "Data", data: [1, 2, 3, 4, 5] }
      ],
      steps: [
        {
          title: "Processing",
          description: "Algorithm visualization in progress. The LLM output may have had formatting issues.",
          pointers: {},
          highlight: [],
          variables: { status: "check logs for details" }
        }
      ]
    };
  }

  buildUniversalPrompt(problemStatement) {
    return `You are an algorithm visualization engine. Create DETAILED step-by-step visualization.

PROBLEM: ${problemStatement}

DETECT THE BEST PATTERN:
- sliding_window, two_pointers, fast_slow_pointers
- binary_search, cyclic_sort, merge_intervals  
- tree_bfs, tree_dfs, two_heaps
- subsets, top_k_elements, k_way_merge
- topological_sort, hashmap, linked_list_reversal

RETURN THIS EXACT JSON FORMAT:

{
  "pattern": "pattern_name",
  "structures": [
    {"id": "arr", "type": "array", "label": "Data", "data": [1,2,3,4,5]}
  ],
  "steps": [
    {
      "title": "Step Title",
      "description": "Detailed explanation of what happens",
      "pointers": {"i": 0},
      "highlight": [0],
      "variables": {"result": 0},
      "hashmap": null,
      "stack": null,
      "queue": null
    }
  ]
}

IMPORTANT: Only include data structures that are USED in the algorithm:
- For stack problems: include "stack", "stackOperation" (push/pop/peek), "stackOperationValue"
- For queue problems: include "queue", "queueOperation" (enqueue/dequeue), "queueOperationValue"
- For hashmap problems: include "hashmap"
- Do NOT include structures that aren't part of the solution

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no comments
2. Use double quotes for all strings
3. No trailing commas
4. GENERATE ENOUGH STEPS TO SHOW THE COMPLETE ALGORITHM:
   - Simple problems: 5-8 steps
   - Medium problems: 8-12 steps
   - Complex problems: 12-20 steps
   - Show EVERY iteration/operation, not just key moments
5. All indices must be valid (0 to array.length-1)
6. Each step should show the current state clearly
7. LINKED LISTS: Represent as simple value arrays [1,2,3,4], NOT as node objects

EXAMPLE - Two Pointers (Container with Water) - DETAILED:
{
  "pattern": "two_pointers",
  "structures": [
    {"id": "heights", "type": "array", "label": "Heights", "data": [1,8,6,2,5,4,8,3,7]}
  ],
  "steps": [
    {
      "title": "Initialize Pointers",
      "description": "Set left=0, right=8. Calculate initial area.",
      "pointers": {"left": 0, "right": 8},
      "highlight": [0, 8],
      "variables": {"maxArea": 0, "left": 0, "right": 8}
    },
    {
      "title": "Calculate Area 1",
      "description": "Area = min(1,7) × 8 = 8. Update maxArea to 8.",
      "pointers": {"left": 0, "right": 8},
      "highlight": [0, 8],
      "variables": {"maxArea": 8, "currentArea": 8, "width": 8}
    },
    {
      "title": "Move Left Pointer",
      "description": "heights[0]=1 < heights[8]=7, move left to 1",
      "pointers": {"left": 1, "right": 8},
      "highlight": [1, 8],
      "variables": {"maxArea": 8, "left": 1, "right": 8}
    },
    {
      "title": "Calculate Area 2",
      "description": "Area = min(8,7) × 7 = 49. Update maxArea to 49!",
      "pointers": {"left": 1, "right": 8},
      "highlight": [1, 8],
      "variables": {"maxArea": 49, "currentArea": 49, "width": 7}
    },
    {
      "title": "Move Right Pointer",
      "description": "heights[1]=8 > heights[8]=7, move right to 7",
      "pointers": {"left": 1, "right": 7},
      "highlight": [1, 7],
      "variables": {"maxArea": 49, "left": 1, "right": 7}
    },
    {
      "title": "Calculate Area 3",
      "description": "Area = min(8,3) × 6 = 18. maxArea stays 49.",
      "pointers": {"left": 1, "right": 7},
      "highlight": [1, 7],
      "variables": {"maxArea": 49, "currentArea": 18, "width": 6}
    },
    {
      "title": "Move Right Pointer",
      "description": "heights[1]=8 > heights[7]=3, move right to 6",
      "pointers": {"left": 1, "right": 6},
      "highlight": [1, 6],
      "variables": {"maxArea": 49, "left": 1, "right": 6}
    },
    {
      "title": "Calculate Area 4",
      "description": "Area = min(8,8) × 5 = 40. maxArea stays 49.",
      "pointers": {"left": 1, "right": 6},
      "highlight": [1, 6],
      "variables": {"maxArea": 49, "currentArea": 40, "width": 5}
    },
    {
      "title": "Final Result",
      "description": "Pointers meet. Maximum area found is 49.",
      "pointers": {"left": 1, "right": 6},
      "highlight": [1, 6],
      "variables": {"maxArea": 49, "result": 49}
    }
  ]
}

Generate a COMPLETE visualization with ALL iterations for the given problem.
Return ONLY the JSON object.`;
  }
}

module.exports = { OllamaAdapter };