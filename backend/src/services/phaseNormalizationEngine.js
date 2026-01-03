class PhaseNormalizationEngine {
  /**
   * Normalizes phases to a consistent format
   * @param {Array} phases - Raw phases from LLM
   * @returns {Array} - Normalized phases
   */
  normalizePhases(phases) {
    return phases.map((phase, index) => {
      return {
        id: phase.id || `phase_${index}`,
        description: phase.description || `Phase ${index + 1}`,
        actions: Array.isArray(phase.actions) ? phase.actions : [],
        input_state: phase.input_state || {},
        output_state: phase.output_state || {},
        order: index
      };
    });
  }
}

module.exports = { PhaseNormalizationEngine };