const express = require('express');
const { classifyAlgorithm } = require('../controllers/algorithmController');
const { testGemini } = require('../controllers/testController');
const { testOllama } = require('../controllers/ollamaTestController');

const router = express.Router();

router.post('/classify', classifyAlgorithm);
router.get('/test-gemini', testGemini);
router.get('/test-ollama', testOllama);

module.exports = router;