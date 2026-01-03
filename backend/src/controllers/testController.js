const { GoogleGenerativeAI } = require('@google/generative-ai');

const testGemini = async (req, res) => {
    try {
        console.log('\n=== Testing Gemini API ===');
        console.log('API Key:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

        console.log('Model initialized successfully');
        console.log('Sending simple test prompt...');

        const result = await model.generateContent("Say hello in JSON format: {\"message\": \"your message here\"}");
        const response = await result.response;
        const text = response.text();

        console.log('Response received:', text);

        res.json({
            success: true,
            message: 'Gemini API is working!',
            response: text,
            model: "gemini-2.0-flash-001"
        });

    } catch (error) {
        console.error('Gemini Test Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            errorDetails: error.errorDetails || error,
            status: error.status || 'unknown'
        });
    }
};

module.exports = { testGemini };
