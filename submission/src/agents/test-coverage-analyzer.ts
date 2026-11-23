/**
 * Test Coverage Analyzer Agent
 * Specialized agent for evaluating test completeness and identifying coverage gaps
 */

import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts/index.js';

/**
 * Test Coverage Analyzer Agent Definition
 *
 * This agent specializes in:
 * - Test file detection and correlation
 * - Coverage gap identification
 * - Missing test case suggestion
 * - Test prioritization based on importance
 */
export const testCoverageAnalyzer: AgentDefinition = {
  description: 'Evaluates test completeness and identifies missing test cases and coverage gaps',
  prompt: TEST_COVERAGE_ANALYZER_PROMPT,
  model: 'haiku',
  tools: ['Skill']
};
