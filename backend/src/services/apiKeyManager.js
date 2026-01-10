/**
 * API Key Manager - Handles multi-provider API key rotation
 *
 * Supports automatic key rotation within providers and failover between providers.
 * Provider order: Gemini -> DeepSeek -> OpenAI -> Groq -> Together AI
 * When LOCAL_MODEL=true, only Ollama is used and cloud providers are ignored.
 */

class APIKeyManager {
  constructor() {
    // Check if using local model
    this.isLocalModel = process.env.LOCAL_MODEL === 'true';

    if (this.isLocalModel) {
      // When using local model, no cloud providers are initialized
      this.providerOrder = [];
      this.keys = {};
      this.currentKeyIndex = {};
      this.currentProviderIndex = -1;
      console.log('[API Key Manager] Local model mode enabled - cloud providers disabled');
      return;
    }

    // Provider order (first to last) - only when not using local model
    // OpenRouter with Qwen is added as fallback after Gemini
    this.providerOrder = ['gemini', 'openrouter'];

    // Parse keys from environment variables (comma-separated)
    this.keys = {
      gemini: this._parseKeys(process.env.GEMINI_API_KEYS),
      openrouter: this._parseKeys(process.env.OPENROUTER_API_KEYS)
    };

    // Current index for each provider
    this.currentKeyIndex = {
      gemini: 0,
      openrouter: 0
    };

    // Track exhausted keys with cooldown timestamps
    this.exhaustedKeys = new Map(); // key -> timestamp when it can be used again
    this.keyCooldownMs = 60 * 60 * 1000; // 1 hour cooldown for exhausted keys

    // Current provider index
    this.currentProviderIndex = 0;

    // Find first available provider
    this._findFirstAvailableProvider();

    console.log('[API Key Manager] Initialized with providers:',
      this.providerOrder.filter(p => this.keys[p].length > 0).join(', ') || 'None');
  }

  _parseKeys(envValue) {
    if (!envValue) return [];
    return envValue.split(',').map(k => k.trim()).filter(k => k.length > 0);
  }

  _findFirstAvailableProvider() {
    for (let i = 0; i < this.providerOrder.length; i++) {
      const provider = this.providerOrder[i];
      if (this.keys[provider].length > 0) {
        this.currentProviderIndex = i;
        console.log(`[API Key Manager] Starting with provider: ${provider}`);
        return;
      }
    }
    console.error('[API Key Manager] No API keys configured for any provider!');
  }

  /**
   * Get current provider name
   */
  getCurrentProvider() {
    if (this.isLocalModel) {
      return 'ollama'; // Return ollama when using local model
    }
    return this.providerOrder[this.currentProviderIndex];
  }

  /**
   * Get current API key for the current provider
   */
  getCurrentKey() {
    if (this.isLocalModel) {
      return 'local'; // Return a placeholder when using local model
    }

    const provider = this.getCurrentProvider();
    const keys = this.keys[provider];
    if (!keys || keys.length === 0) return null;

    const keyIndex = this.currentKeyIndex[provider];
    return keys[keyIndex];
  }

  /**
   * Check if a key is currently in cooldown
   */
  _isKeyInCooldown(provider, keyIndex) {
    if (this.isLocalModel) {
      return false; // No cooldown when using local model
    }

    const keyId = `${provider}:${keyIndex}`;
    const cooldownUntil = this.exhaustedKeys.get(keyId);
    if (!cooldownUntil) return false;

    if (Date.now() >= cooldownUntil) {
      this.exhaustedKeys.delete(keyId);
      console.log(`[API Key Manager] Key ${keyIndex + 1} for ${provider} recovered from cooldown`);
      return false;
    }
    return true;
  }

  /**
   * Mark current key as exhausted and rotate to next
   */
  rotateKey() {
    if (this.isLocalModel) {
      // When using local model, rotation is not needed
      return { success: false, error: 'Local model mode - no key rotation needed' };
    }

    const provider = this.getCurrentProvider();
    const currentIdx = this.currentKeyIndex[provider];

    // Mark current key as exhausted
    const keyId = `${provider}:${currentIdx}`;
    this.exhaustedKeys.set(keyId, Date.now() + this.keyCooldownMs);
    console.log(`[API Key Manager] Key ${currentIdx + 1} exhausted for ${provider}, cooldown for 1 hour`);

    // Try next key in current provider
    const keys = this.keys[provider];
    let nextIdx = (currentIdx + 1) % keys.length;
    let checkedCount = 0;

    while (checkedCount < keys.length) {
      if (!this._isKeyInCooldown(provider, nextIdx)) {
        this.currentKeyIndex[provider] = nextIdx;
        console.log(`[API Key Manager] Switched to key ${nextIdx + 1} for ${provider}`);
        return { success: true, provider, keyIndex: nextIdx };
      }
      nextIdx = (nextIdx + 1) % keys.length;
      checkedCount++;
    }

    // All keys in current provider exhausted, try next provider
    console.log(`[API Key Manager] All keys exhausted for ${provider}, switching provider...`);
    return this.switchToNextProvider();
  }

  /**
   * Switch to the next available provider
   */
  switchToNextProvider() {
    if (this.isLocalModel) {
      // When using local model, provider switching is not needed
      return { success: false, error: 'Local model mode - no provider switching needed' };
    }

    const startIdx = this.currentProviderIndex;
    let nextIdx = (startIdx + 1) % this.providerOrder.length;

    while (nextIdx !== startIdx) {
      const provider = this.providerOrder[nextIdx];
      const keys = this.keys[provider];

      if (keys && keys.length > 0) {
        // Check if any key is available
        for (let i = 0; i < keys.length; i++) {
          if (!this._isKeyInCooldown(provider, i)) {
            this.currentProviderIndex = nextIdx;
            this.currentKeyIndex[provider] = i;
            console.log(`[API Key Manager] Switched to provider: ${provider}, key ${i + 1}`);
            return { success: true, provider, keyIndex: i };
          }
        }
      }
      nextIdx = (nextIdx + 1) % this.providerOrder.length;
    }

    console.error('[API Key Manager] All providers and keys exhausted!');
    return { success: false, error: 'All API keys exhausted across all providers' };
  }

  /**
   * Check if current key should be rotated based on error
   */
  shouldRotate(error) {
    if (this.isLocalModel) {
      return false; // No rotation needed when using local model
    }

    if (!error) return false;

    const errorMessage = error.message || error.toString();
    const statusCode = error.status || error.statusCode || error.code;

    // Rate limit and service unavailable indicators
    const rotationIndicators = [
      statusCode === 429,
      statusCode === '429',
      statusCode === 503,  // Service Unavailable
      statusCode === '503',
      errorMessage.includes('429'),
      errorMessage.includes('503'),
      errorMessage.toLowerCase().includes('rate limit'),
      errorMessage.toLowerCase().includes('quota'),
      errorMessage.toLowerCase().includes('too many requests'),
      errorMessage.toLowerCase().includes('resource exhausted'),
      errorMessage.toLowerCase().includes('exceeded'),
      errorMessage.toLowerCase().includes('overloaded'),  // Gemini "model is overloaded"
      errorMessage.toLowerCase().includes('service unavailable'),
      errorMessage.toLowerCase().includes('temporarily unavailable')
    ];

    return rotationIndicators.some(i => i);
  }

  /**
   * Get status info for logging
   */
  getStatus() {
    if (this.isLocalModel) {
      return {
        provider: 'ollama',
        keyIndex: 1,
        totalKeys: 1,
        exhaustedCount: 0,
        summary: 'ollama (local model)'
      };
    }

    const provider = this.getCurrentProvider();
    const keyIndex = this.currentKeyIndex[provider];
    const totalKeys = this.keys[provider].length;
    const exhaustedCount = this.exhaustedKeys.size;

    return {
      provider,
      keyIndex: keyIndex + 1,
      totalKeys,
      exhaustedCount,
      summary: `${provider} (key ${keyIndex + 1}/${totalKeys})`
    };
  }
}

// Singleton instance
let instance = null;

function getAPIKeyManager() {
  if (!instance) {
    instance = new APIKeyManager();
  }
  return instance;
}

module.exports = { APIKeyManager, getAPIKeyManager };
