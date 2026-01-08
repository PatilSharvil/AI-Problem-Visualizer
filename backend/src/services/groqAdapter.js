const { LLMAdapterInterface } = require('./llmAdapterInterface');

/**
 * Groq Adapter - Fast inference
 */
class GroqAdapter extends LLMAdapterInterface {
    constructor(apiKey) {
        super();
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.groq.com/openai/v1';
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
                const error = new Error(`Groq API error: ${response.status}`);
                error.status = response.status;
                throw error;
            }

            const data = await response.json();
            const responseText = data.choices[0]?.message?.content;

            if (!responseText) {
                throw new Error('Groq API did not return expected response format');
            }

            // Find and parse the JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('LLM did not return valid JSON format');
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('Error calling Groq API:', error.message);
            throw error;
        }
    }
}

module.exports = { GroqAdapter };
