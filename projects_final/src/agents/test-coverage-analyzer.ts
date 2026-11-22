import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts/index.js';

/**
 * Test Coverage Analyzer Agent Definition
 *
 * Specializes in evaluating test completeness and identifying gaps in test coverage.
 * Suggests specific, actionable test cases and identifies critical paths that need testing.
 */
export const testCoverageAnalyzer = {
  description: 'Evaluates test coverage by analyzing source code and identifying untested paths, critical functions, and edge cases. Suggests specific test cases with test code examples.',
  model: 'inherit' as const,
  prompt: TEST_COVERAGE_ANALYZER_PROMPT,
  tools: ['javascript-best-practices']
};
