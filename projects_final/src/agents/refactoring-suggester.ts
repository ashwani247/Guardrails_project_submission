import { REFACTORING_SUGGESTER_PROMPT } from '../prompts/index.js';

/**
 * Refactoring Suggester Agent Definition
 *
 * Specializes in identifying opportunities to improve code structure,
 * modernize patterns, and enhance readability and maintainability.
 */
export const refactoringSuggester = {
  description: 'Identifies refactoring opportunities including extract-function, rename, modernize, simplify, and design pattern improvements. Shows before/after code with benefits.',
  model: 'inherit' as const,
  prompt: REFACTORING_SUGGESTER_PROMPT,
  tools: ['javascript-best-practices']
};
