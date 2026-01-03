const { LLMAdapterInterface } = require('./llmAdapterInterface');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAdapter extends LLMAdapterInterface {
  constructor(apiKey = process.env.GEMINI_API_KEY) {
    super();

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required when using Gemini provider');
    }

    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
  }

  async callLLM(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      if (!responseText) {
        throw new Error('Gemini API did not return expected response format');
      }

      // Find and parse the JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('LLM did not return valid JSON format');
      }

      return JSON.parse(jsonMatch[0]);
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