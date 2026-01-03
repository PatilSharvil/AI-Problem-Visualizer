const { OllamaAdapter } = require('./ollamaAdapter');
// GeminiAdapter is loaded lazily to avoid initialization errors when not used

class LLMService {
  constructor() {
    const provider = process.env.LLM_PROVIDER || 'ollama'; // Default to ollama

    switch (provider) {
      case 'ollama':
        this.adapter = new OllamaAdapter(process.env.OLLAMA_MODEL || 'qwen3:8b');
        break;
      case 'gemini':
        // Lazy load GeminiAdapter only when needed
        const { GeminiAdapter } = require('./geminiAdapter');
        this.adapter = new GeminiAdapter();
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  async classifyAlgorithm(problemStatement) {
    try {
      const prompt = this.buildClassificationPrompt(problemStatement);
      return await this.adapter.callLLM(prompt);
    } catch (error) {
      console.error(`LLM Service Error (${process.env.LLM_PROVIDER}):`, error.message);
      throw error;
    }
  }

  buildClassificationPrompt(problemStatement) {
    return `Analyze this algorithm problem and identify the core algorithmic pattern, logical phases, and key variables:

Problem: ${problemStatement}

Return your analysis as a JSON object with the following structure:
{
  "pattern": "algorithmic pattern name",
  "phases": [
    {
      "id": "unique identifier for this phase",
      "description": "what happens in this phase",
      "input_state": {},
      "output_state": {},
      "actions": ["list of actions taken in this phase"]
    }
  ],
  "key_variables": [
    {
      "name": "variable name",
      "description": "what this variable represents",
      "type": "data type (number|boolean|list|object|string)"
    }
  ]
}

Respond with ONLY the JSON object, no other text.`;
  }
}

module.exports = { LLMService };