const { LLMAdapterInterface } = require('./llmAdapterInterface');
const fetch = require('node-fetch');

/**
 * OpenRouter Adapter - Uses qwen/qwen3-coder:free model
 * This is a fallback when Gemini and other providers fail.
 */
class OpenRouterAdapter extends LLMAdapterInterface {
    constructor(apiKey) {
        super();

        if (!apiKey) {
            throw new Error('API key is required for OpenRouter provider');
        }

        this.apiKey = apiKey;
        this.model = 'qwen/qwen3-coder:free';
        this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    }

    async callLLM(prompt) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://ai-algorithm-visualizer.com',
                    'X-Title': 'AI Algorithm Visualizer'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'user',
                            content: this.buildPrompt(prompt)
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 4096
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || response.statusText;
                const error = new Error(`OpenRouter API error: ${response.status} - ${errorMessage}`);
                error.status = response.status;
                throw error;
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0]?.message?.content) {
                throw new Error('OpenRouter API returned unexpected response format');
            }

            const content = data.choices[0].message.content;
            console.log('[OpenRouterAdapter] Raw Response:', content.substring(0, 500) + '...');

            return this.parseJSON(content);
        } catch (error) {
            console.error('Error calling OpenRouter API:', error.message);
            throw error;
        }
    }

    parseJSON(text) {
        try {
            // Try to find JSON in the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.log('[OpenRouterAdapter] JSON parse failed, trying cleanup...');
        }

        try {
            // Try fixing common JSON issues
            let fixed = text.match(/\{[\s\S]*\}/)?.[0] || text;
            fixed = fixed.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            // Remove any thinking tags that Qwen might include
            fixed = fixed.replace(/<think>[\s\S]*?<\/think>/g, '');
            return JSON.parse(fixed);
        } catch (e) {
            console.error('[OpenRouterAdapter] Could not parse JSON:', e.message);
            return this.getFallback();
        }
    }

    getFallback() {
        return {
            structures: [{ id: "arr", type: "array", label: "Data", data: [] }],
            steps: [{ title: "Error", description: "Could not parse LLM output", array: [], variables: {} }]
        };
    }

    buildPrompt(problem) {
        return `You are an ALGORITHM VISUALIZATION ENGINE. Generate step-by-step visualization JSON ONLY.

=== STRICT OUTPUT FORMAT ===
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [INPUT_ARRAY]}],
  "steps": [
    {"title": "Step Title", "description": "What happens", "array": [FULL_ARRAY], "pointers": {"left": 0, "right": 5}, "highlight": [INDICES]}
  ]
}

=== RULES ===
1. EVERY step MUST have "array" field with the FULL array
2. Use "pointers" for indices (left, right, mid, i, j)
3. Use "highlight" for indices being processed
4. Generate 3-10 steps
5. Return ONLY JSON, no text/code/explanations

=== EXAMPLE ===
Problem: Binary search for 5 in [1,2,3,4,5,6,7]
{
  "structures": [{"id": "arr", "type": "array", "label": "Array", "data": [1,2,3,4,5,6,7]}],
  "steps": [
    {"title": "Check mid=3", "description": "arr[3]=4 < 5", "array": [1,2,3,4,5,6,7], "pointers": {"left": 0, "right": 6, "mid": 3}, "highlight": [3]},
    {"title": "Found at 4", "description": "arr[4]=5", "array": [1,2,3,4,5,6,7], "pointers": {"mid": 4}, "highlight": [4], "result": [5]}
  ]
}

=== YOUR TASK ===
Problem: ${problem}

Return ONLY the JSON object. No thinking, no code, no explanations.`;
    }
}

module.exports = { OpenRouterAdapter };
