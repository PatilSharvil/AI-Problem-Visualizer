const { llmOutputSchema } = require('../schemas/llmOutputSchema');
const { LLMService } = require('../services/llmService');
const { VisualizationNormalizer } = require('../services/visualizationNormalizer');

const llmService = new LLMService();
const normalizer = new VisualizationNormalizer();

const classifyAlgorithm = async (req, res) => {
  try {
    const { problemStatement } = req.body;

    if (!problemStatement) {
      return res.status(400).json({ error: 'Problem statement is required' });
    }

    console.log('\n=== Processing Request ===');
    console.log('Problem:', problemStatement.substring(0, 80) + '...');

    // Get LLM output
    console.log('Calling LLM...');
    let llmOutput;
    try {
      llmOutput = await llmService.classifyAlgorithm(problemStatement);
    } catch (llmError) {
      console.error('LLM Error:', llmError.message);
      // Return a user-friendly error
      return res.status(500).json({
        error: 'LLM processing failed',
        message: 'The AI model returned an invalid response. Please try again or rephrase your question.',
        details: llmError.message
      });
    }

    console.log('LLM Response received');
    console.log('Pattern:', llmOutput.pattern || 'undefined');
    console.log('Structures:', llmOutput.structures?.length || 0);
    console.log('Steps:', llmOutput.steps?.length || 0);

    // Validate with schema (permissive)
    let validatedOutput;
    try {
      validatedOutput = llmOutputSchema.parse(llmOutput);
      console.log('Schema validation passed');
    } catch (validationError) {
      console.error('Validation error:', validationError.message);
      // Use raw output if validation fails
      validatedOutput = llmOutput;
      console.log('Using raw LLM output');
    }

    // Normalize
    const normalized = normalizer.normalize(validatedOutput);
    console.log('Normalization complete');
    console.log('Steps:', normalized.steps?.length);
    if (normalized.steps?.[0]) {
      console.log('Step 0 keys:', Object.keys(normalized.steps[0]));
      console.log('Step 0 result:', normalized.steps[0].result);
      console.log('Step 0 array2:', normalized.steps[0].array2);
    }
    if (normalized.steps?.[2]) {
      console.log('Step 2 keys:', Object.keys(normalized.steps[2]));
      console.log('Step 2 result:', normalized.steps[2].result);
    }

    // Convert to frames
    const frames = normalizer.toFrames(normalized);
    console.log('Generated', frames.length, 'frames');
    if (frames[2]) {
      console.log('Frame 2 components:', JSON.stringify(frames[2].components?.map(c => ({ type: c.type, id: c.id, data: c.data })), null, 2));
    }

    // Ensure we have at least one frame
    if (frames.length === 0) {
      return res.status(500).json({
        error: 'No visualization generated',
        message: 'The system could not generate visualization frames. Please try a different question.'
      });
    }

    res.json({
      pattern: normalized.pattern,
      structures: normalized.structures,
      frames: frames
    });

  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error:', error.message);

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

module.exports = { classifyAlgorithm };