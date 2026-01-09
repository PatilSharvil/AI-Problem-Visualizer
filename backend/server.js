const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        process.env.FRONTEND_URL || 'https://your-frontend-domain.vercel.app', // Replace with actual Vercel domain
        'https://your-frontend-domain.vercel.app' // Default Vercel domain - update with actual domain
      ]
    : [
        'http://localhost:5173', // Vite default
        'http://localhost:3000', // Common React dev server
        'http://localhost:3001', // Alternative dev server
        'http://localhost:8080', // Alternative dev server
        'http://localhost:8000'  // Alternative dev server
      ]
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api', require('./src/routes/algorithmRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  const isLocalModel = process.env.LOCAL_MODEL === 'true';
  console.log(`Server running on port ${PORT}`);
  console.log(`Local Model Mode: ${isLocalModel ? 'ENABLED' : 'DISABLED'}`);

  if (isLocalModel) {
    console.log(`Using Local Model: ${process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b-instruct'}`);
    console.log(`Ollama URL: ${process.env.OLLAMA_URL || 'http://localhost:11434'}`);
  } else {
    console.log(`Using Cloud Models - API keys will be rotated as needed`);
  }
});