const { OllamaAdapter } = require('./ollamaAdapter');

class LLMService {
  constructor() {
    const provider = process.env.LLM_PROVIDER || 'ollama';

    switch (provider) {
      case 'ollama':
        this.adapter = new OllamaAdapter(process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b-instruct');
        break;
      case 'gemini':
        const { GeminiAdapter } = require('./geminiAdapter');
        this.adapter = new GeminiAdapter();
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  async classifyAlgorithm(problemStatement) {
    try {
      // Pass problem directly to adapter - adapter builds the prompt
      return await this.adapter.callLLM(problemStatement);
    } catch (error) {
      console.error(`LLM Service Error (${process.env.LLM_PROVIDER}):`, error.message);
      throw error;
    }
  }
}

module.exports = { LLMService };