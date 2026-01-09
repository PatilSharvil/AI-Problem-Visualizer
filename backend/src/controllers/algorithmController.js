const { llmOutputSchema } = require('../schemas/llmOutputSchema');
const { LLMService } = require('../services/llmService');
const { UniversalNormalizer } = require('../services/universalNormalizer');
const { runExecutors, isExecutorsEnabled } = require('../services/executors');
const { resolveIntent, requiresTraversal } = require('../services/intentResolver');

const llmService = new LLMService();
const normalizer = new UniversalNormalizer();

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
    let llmOutput = null;
    try {
      llmOutput = await llmService.classifyAlgorithm(problemStatement);
    } catch (llmError) {
      console.error('LLM Error:', llmError.message);
      console.log('[Controller] LLM failed - executors will use fallback mode');
      // Don't throw - let executors handle the fallback
    }

    // Log raw LLM output
    if (llmOutput) {
      console.log('\n=== RAW LLM OUTPUT ===');
      console.log(JSON.stringify(llmOutput, null, 2));
      console.log('----------------------------------------');
    } else {
      console.log('\n=== LLM OUTPUT: NULL (will use fallback) ===');
    }

    // ════════════════════════════════════════════════════════════════════════
    // INTENT-RESPECTING PIPELINE
    // ════════════════════════════════════════════════════════════════════════

    // Step 1: Resolve intent from LLM output (or query if LLM failed)
    const intent = resolveIntent(llmOutput, problemStatement);
    console.log('\n=== RESOLVED INTENT ===');
    console.log(`Domain: ${intent.domain}`);
    console.log(`Algorithm: ${intent.algorithm || 'not specified'}`);
    console.log(`Source: ${intent.source}`);
    console.log(`Locked: ${intent.locked}`);

    // Step 2: Run executors with intent (correction mode if LLM valid, fallback otherwise)
    const validatedOutput = runExecutors(llmOutput, problemStatement, intent);

    if (!validatedOutput) {
      console.error('[Controller] No output from executors');
      return res.status(500).json({
        error: 'Processing failed',
        message: 'Could not generate visualization. Please try a different question.'
      });
    }

    console.log('\n=== EXECUTOR OUTPUT ===');
    console.log('Structures:', validatedOutput.structures?.length || 0);
    console.log('Steps:', validatedOutput.steps?.length || 0);
    if (validatedOutput.structures) {
      console.log('Structure types:', validatedOutput.structures.map(s => `${s.id}(${s.type})`));
    }

    // Step 3: Normalize to universal format (render-only, no logic changes)
    const normalized = normalizer.normalizeWithQuery(validatedOutput, problemStatement);
    console.log('\n=== NORMALIZED DATA ===');
    console.log('Normalized steps:', normalized.steps?.length);

    // Step 4: Determine skipTree based on INTENT, not keywords
    // Only skip tree creation if the intent domain is explicitly NOT tree
    const skipTree = intent.domain === 'array' && !requiresTraversal(intent, problemStatement);
    console.log('Skip tree for frames:', skipTree, `(intent.domain=${intent.domain})`);

    // Step 5: Convert to entity+action frames
    const frames = normalizer.toFrames(normalized, { skipTree });
    console.log('\n=== GENERATED FRAMES ===');
    console.log('Total frames:', frames.length);

    if (frames[0]) {
      console.log('Frame 0 entities:', frames[0].entities?.map(e => `${e.id}(${e.type})`));
      console.log('Frame 0 actions:', frames[0].actions?.length || 0);
    }

    console.log('========================================\n');

    if (frames.length === 0) {
      return res.status(500).json({
        error: 'No visualization generated',
        message: 'Could not generate frames. Please try a different question.'
      });
    }

    res.json({
      structures: normalized.structures,
      frames: frames,
      intent: {
        domain: intent.domain,
        algorithm: intent.algorithm,
        source: intent.source
      }
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