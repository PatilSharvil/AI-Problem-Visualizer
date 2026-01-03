const fetch = require('node-fetch');

const testOllama = async (req, res) => {
  try {
    console.log('\n=== Testing Ollama API ===');
    const model = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b-instruct';
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    
    console.log('Model:', model);
    console.log('URL:', ollamaUrl);
    
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: 'Return only this JSON: {"test": "success", "message": "hello"}',
        stream: false
      })
    });
    
    const data = await response.json();
    console.log('Ollama Response:', data.response);
    
    res.json({
      success: true,
      model: model,
      response: data.response
    });
    
  } catch (error) {
    console.error('Ollama Test Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = { testOllama };
