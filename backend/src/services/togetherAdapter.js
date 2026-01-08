const { LLMAdapterInterface } = require('./llmAdapterInterface');

/**
 * Together AI Adapter
 */
class TogetherAdapter extends LLMAdapterInterface {
    constructor(apiKey) {
        super();
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.together.xyz/v1';
        this.model = 'gemini-2.5-flash';
    }

    async callLLM(prompt) {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 4096
                })
            });

            if (!response.ok) {
                const error = new Error(`Together AI API error: ${response.status}`);
                error.status = response.status;
                throw error;
            }

            const data = await response.json();
            const responseText = data.choices[0]?.message?.content;

            if (!responseText) {
                throw new Error('Together AI API did not return expected response format');
            }

            // Find and parse the JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('LLM did not return valid JSON format');
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('Error calling Together AI API:', error.message);
            throw error;
        }
    }
}

module.exports = { TogetherAdapter };
