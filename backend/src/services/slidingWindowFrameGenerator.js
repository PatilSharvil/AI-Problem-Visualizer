class SlidingWindowFrameGenerator {
  /**
   * Generates visualization frames for sliding window pattern
   * @param {Object} llmOutput - The validated LLM output
   * @returns {Array} - Array of visualization frames with visual state data
   */
  generateFrames(llmOutput) {
    // Verify it's a sliding window pattern
    if (llmOutput.pattern !== 'Sliding Window') {
      throw new Error(`SlidingWindowFrameGenerator can only process 'Sliding Window' patterns, got: ${llmOutput.pattern}`);
    }

    const { phases, key_variables, example_input } = llmOutput;
    const frames = [];

    // Extract the example data - support both old 'array' field and new 'data' field
    const exampleData = example_input?.data || example_input?.array || [];
    const dataType = example_input?.data_type || (typeof exampleData[0] === 'number' ? 'number' : 'string');
    const k = example_input?.k;
    const target = example_input?.target;

    // Add initial frame
    frames.push({
      frame_id: 'initial',
      phase_id: 'initial',
      title: 'Problem Setup',
      description: 'Understanding the sliding window problem',
      phase_name: 'Initialization',

      // Visual state for rendering
      visual_state: {
        array: exampleData,
        window: {
          left: null,
          right: null,
          highlighted_indices: []
        },
        variables: this.extractInitialVariables(key_variables, k, target)
      },

      explanation: this.formatDataDisplay(exampleData, dataType, k, target),
      pattern: 'Sliding Window'
    });

    // Process each phase to generate frames with visual state
    phases.forEach((phase, index) => {
      const windowState = phase.window_state || {};
      const left = windowState.left ?? null;
      const right = windowState.right ?? null;

      // Create highlighted indices array from left to right
      const highlighted = (left !== null && right !== null)
        ? Array.from({ length: right - left + 1 }, (_, i) => left + i)
        : [];

      // Extract metric - can be sum, substring, char_count, etc.
      const metric = windowState.metric ?? windowState.current_sum ?? null;

      const frame = {
        frame_id: `frame_${index + 1}`,
        phase_id: phase.id,
        title: phase.description,
        description: `Phase ${index + 1}: ${phase.description}`,
        phase_name: phase.id,

        // Enhanced visual state
        visual_state: {
          array: exampleData,
          window: {
            left: left,
            right: right,
            highlighted_indices: highlighted
          },
          variables: {
            left: left,
            right: right,
            metric: metric,
            window_size: highlighted.length,
            k: k,
            target: target,
            ...this.extractAdditionalVariables(windowState)
          }
        },

        explanation: this.buildExplanation(phase, windowState, exampleData, dataType),
        actions: phase.actions,
        pattern: 'Sliding Window'
      };

      frames.push(frame);
    });

    // Add final summary frame
    const lastPhase = phases[phases.length - 1];
    const lastWindowState = lastPhase?.window_state || {};

    frames.push({
      frame_id: 'final',
      phase_id: 'final',
      title: 'Algorithm Complete',
      description: 'Sliding window algorithm has finished',
      phase_name: 'Completed',

      visual_state: {
        array: exampleData,
        window: {
          left: lastWindowState.left ?? null,
          right: lastWindowState.right ?? null,
          highlighted_indices: []
        },
        variables: {
          final_result: lastWindowState.metric ?? lastWindowState.current_sum ?? 'Result computed',
          ...this.extractAdditionalVariables(lastWindowState)
        }
      },

      explanation: 'Algorithm execution completed successfully!',
      pattern: 'Sliding Window'
    });

    return frames;
  }

  /**
   * Extract initial variable values
   * @private
   */
  extractInitialVariables(keyVariables, k, target) {
    const vars = {
      left: 0,
      right: 0
    };

    if (k !== undefined) vars.k = k;
    if (target !== undefined) vars.target = target;

    return vars;
  }

  /**
   * Extract additional variables from window state
   * @private
   */
  extractAdditionalVariables(windowState) {
    const additional = {};

    // Extract any additional fields from window_state
    Object.keys(windowState).forEach(key => {
      if (!['left', 'right', 'elements', 'current_sum'].includes(key)) {
        additional[key] = windowState[key];
      }
    });

    return additional;
  }

  /**
   * Build a human-readable explanation
   * @private
   */
  buildExplanation(phase, windowState, data, dataType) {
    const { left, right, elements, metric, current_sum } = windowState;

    let explanation = phase.description + '. ';

    if (left !== undefined && right !== undefined && data.length > 0) {
      const windowElements = elements || (typeof data === 'string' ? data.slice(left, right + 1) : data.slice(left, right + 1));

      if (typeof data === 'string') {
        explanation += `Window at indices [${left}..${right}]: "${windowElements}". `;
      } else {
        const displayElements = Array.isArray(windowElements) ? windowElements.join(', ') : windowElements;
        explanation += `Window at indices [${left}..${right}]: [${displayElements}]. `;
      }
    }

    // Handle different metric types
    if (metric !== undefined && metric !== null) {
      if (typeof metric === 'object') {
        explanation += `Frequency: ${JSON.stringify(metric)}. `;
      } else if (typeof metric === 'string') {
        explanation += `Substring: "${metric}". `;
      } else {
        explanation += `Metric = ${metric}. `;
      }
    } else if (current_sum !== undefined) {
      explanation += `Sum = ${current_sum}. `;
    }

    if (phase.actions && phase.actions.length > 0) {
      explanation += `Actions: ${phase.actions.join(', ')}`;
    }

    return explanation.trim();
  }

  /**
   * Format data display for initial explanation
   * @private
   */
  formatDataDisplay(data, dataType, k, target) {
    let display = '';

    if (typeof data === 'string') {
      display = `String: "${data}"`;
    } else if (Array.isArray(data)) {
      display = `Data: [${data.join(', ')}]`;
    } else {
      display = `Data: ${data}`;
    }

    if (k) display += `, Window size: ${k}`;
    if (target) display += `, Target: ${target}`;

    return display;
  }
}

module.exports = { SlidingWindowFrameGenerator };