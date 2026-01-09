const { getAPIKeyManager } = require('./apiKeyManager');
const { GeminiAdapter } = require('./geminiAdapter');
const { DeepSeekAdapter } = require('./deepseekAdapter');
const { OpenAIAdapter } = require('./openaiAdapter');
const { GroqAdapter } = require('./groqAdapter');
const { TogetherAdapter } = require('./togetherAdapter');
const { OllamaAdapter } = require('./ollamaAdapter'); // Import Ollama adapter

class LLMService {
  constructor() {
    this.keyManager = getAPIKeyManager();
    this.adapters = {};
    this.maxRetries = 10; // Maximum retries across all keys/providers

    // Check if using local model
    this.isLocalModel = process.env.LOCAL_MODEL === 'true';
  }

  /**
   * Create adapter for a specific provider with given API key
   */
  _createAdapter(provider, apiKey) {
    switch (provider) {
      case 'ollama':
        // When using local model, always return Ollama adapter
        return new OllamaAdapter(process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b-instruct');
      case 'gemini':
        return new GeminiAdapter(apiKey);
      case 'deepseek':
        return new DeepSeekAdapter(apiKey);
      case 'openai':
        return new OpenAIAdapter(apiKey);
      case 'groq':
        return new GroqAdapter(apiKey);
      case 'togetherai':
        return new TogetherAdapter(apiKey);
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  /**
   * Get current adapter based on key manager state
   */
  _getCurrentAdapter() {
    const provider = this.keyManager.getCurrentProvider();
    const apiKey = this.keyManager.getCurrentKey();

    if (!apiKey && !this.isLocalModel) {
      throw new Error('No API key available');
    }

    // Create new adapter with current key
    return this._createAdapter(provider, apiKey);
  }

  async classifyAlgorithm(problemStatement) {
    let retries = 0;
    let lastError = null;

    while (retries < this.maxRetries) {
      try {
        const status = this.keyManager.getStatus();
        console.log(`[LLM Service] Attempting with ${status.summary}`);

        const adapter = this._getCurrentAdapter();
        const result = await adapter.callLLM(problemStatement);

        console.log(`[LLM Service] Success with ${status.summary}`);
        return result;

      } catch (error) {
        lastError = error;
        console.error(`[LLM Service] Error: ${error.message}`);

        // Check if we should rotate keys (only if not using local model)
        if (!this.isLocalModel && this.keyManager.shouldRotate(error)) {
          console.log('[LLM Service] Rate limit detected, rotating key...');
          const rotateResult = this.keyManager.rotateKey();

          if (!rotateResult.success) {
            console.error('[LLM Service] All keys exhausted:', rotateResult.error);
            throw new Error('All API keys exhausted across all providers. Please try again later.');
          }

          retries++;
          continue;
        }

        // Non-rate-limit error, throw immediately
        throw error;
      }
    }

    // Max retries exceeded
    throw new Error(`Max retries (${this.maxRetries}) exceeded. Last error: ${lastError?.message}`);
  }
}

module.exports = { LLMService };