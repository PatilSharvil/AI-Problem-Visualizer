const { llmOutputSchema } = require('../schemas/llmOutputSchema');
const { LLMService } = require('../services/llmService');
const { UniversalNormalizer } = require('../services/universalNormalizer');
const { runExecutors, isExecutorsEnabled } = require('../services/executors');
const fs = require('fs');
const path = require('path');

const llmService = new LLMService();
const normalizer = new UniversalNormalizer();

// Create logs directory
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const classifyAlgorithm = async (req, res) => {
  try {
    const { problemStatement } = req.body;

    if (!problemStatement) {
      return res.status(400).json({ error: 'Problem statement is required' });
    }

    console.log('\n========================================');
    console.log('=== NEW REQUEST ===');
    console.log('========================================');
    console.log('Problem:', problemStatement);
    console.log('Executors enabled:', isExecutorsEnabled());
    console.log('----------------------------------------');

    // Get LLM output
    console.log('Calling LLM...');
    let llmOutput;
    try {
      llmOutput = await llmService.classifyAlgorithm(problemStatement);
    } catch (llmError) {
      console.error('LLM Error:', llmError.message);

      // FALLBACK: Try deterministic approach if LLM fails
      console.log('[Controller] Attempting deterministic fallback...');
      try {
        const deterministicResult = runExecutors(null, problemStatement);
        if (deterministicResult) {
          console.log('[Controller] Successfully fell back to deterministic approach');
          llmOutput = deterministicResult;
        } else {
          throw llmError; // Re-throw if no deterministic match
        }
      } catch (fallbackError) {
        console.error('[Controller] Deterministic fallback failed:', fallbackError.message);
        return res.status(500).json({
          error: 'Processing failed',
          message: 'The AI model failed and no deterministic fallback was found.',
          details: llmError.message
        });
      }
    }

    // Log raw LLM output
    console.log('\n=== RAW LLM OUTPUT ===');
    console.log(JSON.stringify(llmOutput, null, 2));
    console.log('----------------------------------------');

    // Save to file for debugging
    const timestamp = Date.now();
    const logFile = path.join(logsDir, `llm_output_${timestamp}.json`);
    fs.writeFileSync(logFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      problem: problemStatement,
      llmOutput: llmOutput
    }, null, 2));
    console.log(`LLM output saved to: ${logFile}`);

    // Run executors (optional validation layer)
    const validatedOutput = runExecutors(llmOutput, problemStatement);
    console.log('\n=== EXECUTOR VALIDATION ===');
    console.log('Executors enabled:', isExecutorsEnabled());
    if (isExecutorsEnabled()) {
      console.log('Validation applied to', validatedOutput.steps?.length || 0, 'steps');
    }

    console.log('\n=== LLM OUTPUT SUMMARY ===');
    console.log('Structures:', validatedOutput.structures?.length || 0);
    console.log('Steps:', validatedOutput.steps?.length || 0);
    if (validatedOutput.structures) {
      console.log('Structure IDs:', validatedOutput.structures.map(s => s.id));
    }
    if (validatedOutput.steps?.[0]) {
      console.log('First step keys:', Object.keys(validatedOutput.steps[0]));
    }

    // Normalize to universal format (with query-based type override)
    const normalized = normalizer.normalizeWithQuery(validatedOutput, problemStatement);
    console.log('\n=== NORMALIZED DATA ===');
    console.log('Normalized steps:', normalized.steps?.length);

    // Detect if we should skip tree creation for array queries
    const queryLower = problemStatement.toLowerCase();
    const skipTree = queryLower.includes('binary search') ||
      queryLower.includes('bubble sort') ||
      queryLower.includes('selection sort') ||
      queryLower.includes('quick sort') ||
      queryLower.includes('two pointer') ||
      queryLower.includes('sliding window');

    console.log('Skip tree for frames:', skipTree);

    // Convert to entity+action frames
    const frames = normalizer.toFrames(normalized, { skipTree });
    console.log('\n=== GENERATED FRAMES ===');
    console.log('Total frames:', frames.length);

    if (frames[0]) {
      console.log('Frame 0 entities:', frames[0].entities?.map(e => `${e.id}(${e.type})`));
      console.log('Frame 0 actions:', frames[0].actions?.length || 0);
    }

    // Save frames to file too
    const framesFile = path.join(logsDir, `frames_${timestamp}.json`);
    fs.writeFileSync(framesFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      problem: problemStatement,
      frames: frames
    }, null, 2));
    console.log(`Frames saved to: ${framesFile}`);

    console.log('========================================\n');

    if (frames.length === 0) {
      return res.status(500).json({
        error: 'No visualization generated',
        message: 'Could not generate frames. Please try a different question.'
      });
    }

    res.json({
      structures: normalized.structures,
      frames: frames
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

module.exports = { classifyAlgorithm };