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

    // Log sample step data to see if array is included
    if (normalized.steps && normalized.steps.length > 0) {
      console.log('Sample step 0:', JSON.stringify(normalized.steps[0]).substring(0, 200));
      if (normalized.steps.length > 2) {
        console.log('Sample step 2:', JSON.stringify(normalized.steps[2]).substring(0, 200));
      }
    }

    // Convert to frames
    const frames = normalizer.toFrames(normalized);
    console.log('Generated', frames.length, 'frames');

    // Log sample frame data to check if array data changes between frames
    if (frames.length > 0) {
      const frame0Data = frames[0]?.components?.find(c => c.type === 'array')?.data;
      const frame2Data = frames[2]?.components?.find(c => c.type === 'array')?.data;
      console.log('Frame 0 array data:', JSON.stringify(frame0Data));
      console.log('Frame 2 array data:', JSON.stringify(frame2Data));
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