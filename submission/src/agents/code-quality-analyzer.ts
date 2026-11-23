/**
 * Code Quality Analyzer Agent
 * Specialized agent for identifying code smells, security vulnerabilities, and anti-patterns
 */

import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts/index.js';

/**
 * Code Quality Analyzer Agent Definition
 *
 * This agent specializes in:
 * - Security vulnerability detection
 * - Performance issue identification
 * - Best practice violation detection
 * - Code maintainability assessment
 */
export const codeQualityAnalyzer: AgentDefinition = {
  description: 'Analyzes code for security vulnerabilities, performance issues, and best practice violations',
  prompt: CODE_QUALITY_ANALYZER_PROMPT,
  model: 'haiku',
  tools: ['Skill']
};
