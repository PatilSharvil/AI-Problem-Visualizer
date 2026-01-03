class LLMAdapterInterface {
  /**
   * Abstract method to call the LLM
   * @param {string} prompt - The input prompt
   * @returns {Promise<Object>} - The parsed JSON response from LLM
   */
  async callLLM(prompt) {
    throw new Error('Method callLLM must be implemented');
  }
}

module.exports = { LLMAdapterInterface };