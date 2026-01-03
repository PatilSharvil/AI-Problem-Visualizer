const { SlidingWindowFrameGenerator } = require('./slidingWindowFrameGenerator');

class FrameGenerationEngine {
  constructor() {
    this.slidingWindowGenerator = new SlidingWindowFrameGenerator();
  }

  /**
   * Generates visualization frames from LLM output based on pattern
   * @param {Object} llmOutput - The validated LLM output
   * @returns {Array} - Visualization frames
   */
  generateFrames(llmOutput) {
    const { pattern, phases, key_variables } = llmOutput;

    // Use pattern-specific frame generator
    switch (pattern) {
      case 'Sliding Window':
        return this.slidingWindowGenerator.generateFrames(llmOutput);
      default:
        // For unsupported patterns, return a controlled error frame
        return [{
          frame_id: 'error',
          phase_id: 'unsupported',
          title: 'Pattern Not Supported',
          description: `Visualization for pattern "${pattern}" is not yet implemented`,
          phase_name: 'Error',
          highlighted_variables: [],
          explanation: `The visualizer currently only supports "Sliding Window" patterns. Pattern received: ${pattern}`,
          pattern: pattern
        }];
    }
  }
}

module.exports = { FrameGenerationEngine };