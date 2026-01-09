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
        // Detect problem type
        const problemLower = problem.toLowerCase();
        const hasTree = problemLower.includes('tree') || problemLower.includes('bst');
        const hasStack = problemLower.includes('stack') || problemLower.includes('parenthes');
        const hasQueue = problemLower.includes('queue') || problemLower.includes('bfs');

        let structureType = 'array';
        if (hasTree) structureType = 'tree';
        else if (hasStack) structureType = 'stack';
        else if (hasQueue) structureType = 'queue';

        return `You are an algorithm visualization engine. Generate step-by-step JSON visualization.

Problem: ${problem}

RULES:
1. Return ONLY valid JSON, no extra text or markdown
2. Generate one step per operation
3. Use the exact values from the problem

Return this structure:
{
  "structures": [{"id": "${structureType === 'tree' ? 'tree' : 'arr'}", "type": "${structureType}", "label": "${structureType.toUpperCase()}", "data": [values]}],
  "steps": [
    {"title": "Step 1", "description": "description", "${structureType}": [current_state], "highlight": [indices]},
    ...more steps...
  ]
}

Return ONLY the JSON object, nothing else. Do not include any thinking or explanation.`;
    }
}

module.exports = { OpenRouterAdapter };
