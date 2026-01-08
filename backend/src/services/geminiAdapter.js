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
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      if (!responseText) {
        throw new Error('Gemini API did not return expected response format');
      }

      console.log('[GeminiAdapter] Raw Response:', responseText);

      // Find and parse the JSON from the response
      // More robust regex for JSON extraction (works for objects and arrays)
      const jsonMatch = responseText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (!jsonMatch) {
        console.error('[GeminiAdapter] No JSON found in response:', responseText);
        throw new Error('LLM did not return valid JSON format');
      }

      const cleanJson = jsonMatch[1].trim();
      console.log('[GeminiAdapter] Attempting to parse:', cleanJson);

      try {
        return JSON.parse(cleanJson);
      } catch (parseError) {
        console.error('[GeminiAdapter] JSON Parse Error:', parseError.message);
        console.error('[GeminiAdapter] Problematic string:', cleanJson);
        throw parseError;
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  buildStructuredPrompt(problemStatement) {
    return `Analyze this sliding window problem and return ONLY valid JSON:

Problem: ${problemStatement}

Return this structure:
{
  "pattern": "Sliding Window",
  "example_input": {
    "data": [numbers] or "string",
    "data_type": "number" or "string",
    "k": number (optional),
    "target": value (optional)
  },
  "phases": [
    {
      "id": "phase_1",
      "description": "brief description",
      "window_state": {
        "left": 0,
        "right": 2,
        "elements": [window elements],
        "metric": value or object
      },
      "actions": ["action1", "action2"]
    }
  ],
  "key_variables": [
    {"name": "left", "description": "left pointer", "type": "number"}
  ]
}

Rules:
- For numeric problems: use data: [2,1,5,1,3,2], data_type: "number", metric: sum 
- For string problems: use data: "ADOBECODEBANC", data_type: "string", metric: {A:1,B:1}
- Include 3-4 phases showing window movement
- Return ONLY JSON, no other text`;
  }
}

module.exports = { GeminiAdapter };