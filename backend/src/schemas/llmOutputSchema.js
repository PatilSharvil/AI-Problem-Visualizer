const { z } = require('zod');

// Flexible schema - accepts null values for pointers and optional fields
const stepSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  pointers: z.record(z.union([z.number(), z.null()])).optional(),
  highlight: z.array(z.number()).optional(),
  variables: z.record(z.any()).optional(),
  hashmap: z.any().optional(),
  stack: z.array(z.any()).nullable().optional(),
  queue: z.array(z.any()).nullable().optional(),
  heap: z.array(z.any()).nullable().optional(),
  subsets: z.array(z.any()).nullable().optional(),
  intervals: z.array(z.any()).nullable().optional(),
  tree: z.any().nullable().optional(),
  window: z.any().optional()
}).passthrough();

const structureSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  label: z.string().optional(),
  data: z.array(z.any()).optional()
}).passthrough();

const phaseSchema = z.object({
  phase_number: z.number().optional(),
  phase_name: z.string().optional(),
  pattern: z.string().optional(),
  structures: z.array(structureSchema).optional(),
  steps: z.array(stepSchema).optional()
}).passthrough();

// Main schema - very flexible
const llmOutputSchema = z.object({
  pattern: z.string().optional(),
  problem_type: z.string().optional(),
  is_multi_phase: z.boolean().optional(),
  structures: z.array(structureSchema).optional(),
  steps: z.array(stepSchema).optional(),
  phases: z.array(phaseSchema).optional()
}).passthrough();

module.exports = { llmOutputSchema };