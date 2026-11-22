import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts/index.js';

/**
 * Code Quality Analyzer Agent Definition
 *
 * Specializes in identifying security vulnerabilities, performance issues,
 * maintainability concern, and code style problems.
 *
 * Uses Claude Skills to provide expert analysis in multiple languages and frameworks.
 */
export const codeQualityAnalyzer = {
  description: 'Analyzes code for security vulnerabilities, performance issues, maintainability concerns, and best practice violations. Returns detailed findings with line numbers and severity levels.',
  model: 'inherit' as const,
  prompt: CODE_QUALITY_ANALYZER_PROMPT,
  tools: ['javascript-best-practices']
};
