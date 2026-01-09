const { LLMAdapterInterface } = require('./llmAdapterInterface');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAdapter extends LLMAdapterInterface {
  constructor(apiKey) {
    super();

    if (!apiKey) {
      throw new Error('API key is required for Gemini provider');
    }

    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
  }

  async callLLM(prompt) {
    try {
      // Use visualization-focused prompt
      const vizPrompt = this.buildVisualizationPrompt(prompt);
      const result = await this.model.generateContent(vizPrompt);
      const response = await result.response;
      const responseText = response.text();

      if (!responseText) {
        throw new Error('Gemini API did not return expected response format');
      }

      console.log('[GeminiAdapter] Raw Response:', responseText.substring(0, 500) + '...');

      // Find and parse the JSON from the response
      const jsonMatch = responseText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (!jsonMatch) {
        console.error('[GeminiAdapter] No JSON found in response');
        throw new Error('LLM did not return valid JSON format');
      }

      const cleanJson = jsonMatch[1].trim();

      try {
        return JSON.parse(cleanJson);
      } catch (parseError) {
        console.error('[GeminiAdapter] JSON Parse Error:', parseError.message);
        throw parseError;
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  buildVisualizationPrompt(problem) {
    return `You are an ALGORITHM VISUALIZATION ENGINE. Your ONLY job is to generate step-by-step visualization data.

=== STRICT OUTPUT FORMAT ===
You MUST return a JSON object with EXACTLY this structure:

{
  "structures": [
    {"id": "arr", "type": "array", "label": "Array", "data": [THE_INPUT_ARRAY]}
  ],
  "steps": [
    {
      "title": "Step 1 Title",
      "description": "What happens in this step",
      "array": [CURRENT_ARRAY_STATE],
      "pointers": {"left": 0, "right": 5, "i": 2},
      "highlight": [INDICES_TO_HIGHLIGHT],
      "result": [CURRENT_RESULT_IF_ANY]
    }
  ]
}

=== CRITICAL RULES ===
1. EVERY step MUST have an "array" field with the FULL array state
2. Use "pointers" for index tracking (left, right, mid, i, j, etc.)
3. Use "highlight" array to show which indices are being processed
4. Use "result" to accumulate found values
5. Generate 3-10 steps showing the algorithm execution
6. DO NOT include explanations, code, or text descriptions
7. Return ONLY the JSON object, nothing else

=== EXAMPLES ===

--- Binary Search Example ---
Problem: Binary search for 5 in [1,2,3,4,5,6,7]
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [1,2,3,4,5,6,7]}],
  "steps": [
    {"title": "Check mid=3", "description": "arr[3]=4 < 5, search right", "array": [1,2,3,4,5,6,7], "pointers": {"left": 0, "right": 6, "mid": 3}, "highlight": [3]},
    {"title": "Check mid=5", "description": "arr[5]=6 > 5, search left", "array": [1,2,3,4,5,6,7], "pointers": {"left": 4, "right": 6, "mid": 5}, "highlight": [5]},
    {"title": "Found at 4", "description": "arr[4]=5, target found!", "array": [1,2,3,4,5,6,7], "pointers": {"left": 4, "right": 4, "mid": 4}, "highlight": [4], "result": [5]}
  ]
}

--- Two Pointer / 3Sum Example ---
Problem: 3Sum find triplets summing to 0 in [-1,0,1,2,-1,-4]
{
  "structures": [{"id": "arr", "type": "array", "label": "Sorted Array", "data": [-4,-1,-1,0,1,2]}],
  "steps": [
    {"title": "Sort Array", "description": "Sort for two-pointer approach", "array": [-4,-1,-1,0,1,2], "highlight": []},
    {"title": "i=0: Fix -4", "description": "Need sum=4 from rest", "array": [-4,-1,-1,0,1,2], "pointers": {"i": 0, "left": 1, "right": 5}, "highlight": [0,1,5]},
    {"title": "i=1: Fix -1", "description": "Need sum=1 from rest", "array": [-4,-1,-1,0,1,2], "pointers": {"i": 1, "left": 2, "right": 5}, "highlight": [1,2,5]},
    {"title": "Found [-1,-1,2]", "description": "-1+(-1)+2=0", "array": [-4,-1,-1,0,1,2], "pointers": {"i": 1, "left": 2, "right": 5}, "highlight": [1,2,5], "result": [[-1,-1,2]]},
    {"title": "Found [-1,0,1]", "description": "-1+0+1=0", "array": [-4,-1,-1,0,1,2], "pointers": {"i": 1, "left": 3, "right": 4}, "highlight": [1,3,4], "result": [[-1,-1,2],[-1,0,1]]}
  ]
}

--- Sorting Example ---
Problem: Bubble sort [5,2,8,1,9]
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [5,2,8,1,9]}],
  "steps": [
    {"title": "Compare 5,2", "description": "5>2, swap", "array": [2,5,8,1,9], "pointers": {"i": 0, "j": 1}, "highlight": [0,1]},
    {"title": "Compare 8,1", "description": "8>1, swap", "array": [2,5,1,8,9], "pointers": {"i": 2, "j": 3}, "highlight": [2,3]},
    {"title": "Compare 5,1", "description": "5>1, swap", "array": [2,1,5,8,9], "pointers": {"i": 1, "j": 2}, "highlight": [1,2]},
    {"title": "Compare 2,1", "description": "2>1, swap", "array": [1,2,5,8,9], "pointers": {"i": 0, "j": 1}, "highlight": [0,1]},
    {"title": "Sorted", "description": "Array is sorted", "array": [1,2,5,8,9], "result": [1,2,5,8,9]}
  ]
}

=== YOUR TASK ===
Problem: ${problem}

Generate visualization JSON following the EXACT format above. Return ONLY the JSON object.`;
  }
}

module.exports = { GeminiAdapter };
