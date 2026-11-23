/**
 * Refactoring Suggester Agent
 * Specialized agent for identifying refactoring opportunities and architectural improvements
 */

import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts/index.js';

/**
 * Refactoring Suggester Agent Definition
 *
 * This agent specializes in:
 * - Function extraction opportunities
 * - Naming clarity improvements
 * - Pattern modernization
 * - Complexity reduction
 * - Design pattern application
 */
export const refactoringSuggester: AgentDefinition = {
  description: 'Identifies refactoring opportunities and architectural improvements to enhance code quality',
  prompt: REFACTORING_SUGGESTER_PROMPT,
  model: 'haiku',
  tools: ['Skill']
};
