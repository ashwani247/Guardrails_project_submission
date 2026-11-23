import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { codeQualityAnalyzer, testCoverageAnalyzer, refactoringSuggester } from './agents/index.js';
import { mcpServersConfig } from './config/mcp.config.js';
import { buildOrchestratorPrompt } from './prompts/index.js';
import { ReviewReport, ReviewReportSchema, ReviewReportJSONSchema } from './types/index.js';
import { logger } from './utils/logger.js';

/**
 * Orchestrator configuration options
 */
export interface OrchestratorOptions {
  /**
   * Override the model used by the orchestrator
   * @default From ANTHROPIC_MODEL environment variable
   */
  model?: string;

  /**
   * Maximum conversation turns for multi-agent coordination
   * @default 15
   */
  maxTurns?: number;

  /**
   * Enable detailed logging of orchestrator operations
   * @default true
   */
  enableLogging?: boolean;
}

/**
 * Main Code Review Orchestrator
 * Coordinates three specialized subagents to analyze pull requests and generate comprehensive reports
 *
 * Architecture:
 * - Fetches PR data using GitHub MCP server
 * - Invokes three subagents in parallel for comprehensive analysis
 * - Aggregates results into structured ReviewReport
 * - Returns validated JSON output matching ReviewReportSchema
 */
export class CodeReviewOrchestrator {
  private model: string;
  private maxTurns: number;
  private enableLogging: boolean;
  private agents: Record<string, AgentDefinition>;

  constructor(options: OrchestratorOptions = {}) {
    this.model = options.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
    this.maxTurns = options.maxTurns || 35;
    this.enableLogging = options.enableLogging !== false;

    // Gather all subagent definitions
    this.agents = {
      'code-quality-analyzer': codeQualityAnalyzer,
      'test-coverage-analyzer': testCoverageAnalyzer,
      'refactoring-suggester': refactoringSuggester
    };

    if (this.enableLogging) {
      logger.info('CodeReviewOrchestrator initialized', {
        model: this.model,
        maxTurns: this.maxTurns,
        agents: Object.keys(this.agents)
      });
    }
  }

  /**
   * Review a pull request using parallel subagent analysis
   *
   * Process:
   * 1. Build orchestrator prompt with PR details
   * 2. Query orchestrator with agent definitions and MCP servers
   * 3. Stream results from async generator
   * 4. Validate structured output with Zod schema
   * 5. Return ReviewReport
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param prNumber - Pull request number
   * @returns Complete review report
   * @throws Error if MCP servers fail or structured output validation fails
   */
  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    if (this.enableLogging) {
      logger.info('Starting code review', { owner, repo, prNumber });
    }

    const startTime = Date.now();

    // Build orchestrator prompt with PR-specific context
    const orchestratorPrompt = buildOrchestratorPrompt(owner, repo, prNumber);

    // Create async generator for user message input (required for MCP compatibility)
    const messageGenerator = this.generateMessages(orchestratorPrompt);

    try {
      // Execute query with orchestrator and all subagents
      for await (const message of query({
        prompt: messageGenerator,
        options: {
          allowedTools: [
            'Task',                                    // For subagent invocation
            'mcp__github__get_pull_request',          // Fetch PR details
            'mcp__github__get_pull_request_files',    // Get changed files
            'mcp__github__get_file_contents'          // Read file contents
          ],
          agents: this.agents,
          model: this.model,
          mcpServers: mcpServersConfig,
          outputFormat: {
            type: 'json_schema',
            schema: ReviewReportJSONSchema as Record<string, unknown>
          },
          maxTurns: this.maxTurns
        }
      })) {
        // Handle assistant messages - log tool invocations for visibility
        if (message.type === 'assistant') {
          const content = message.message?.content;
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'tool_use' && block.name === 'Task') {
                const input = block.input as { description?: string };
                if (this.enableLogging) {
                  logger.debug(`Invoking subagent: ${input.description || 'unknown'}`);
                }
              }
            }
          }
        }

        // Handle result messages - extract structured output
        if (message.type === 'result') {
          if (message.subtype === 'success' && message.structured_output) {
            // Validate structured output with Zod schema
            const result = ReviewReportSchema.safeParse(message.structured_output);

            if (!result.success) {
              logger.error('Structured output validation failed', { errors: result.error.errors });
              throw new Error(
                `Invalid structured output: ${result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
              );
            }

            const duration = Date.now() - startTime;

            if (this.enableLogging) {
              logger.info('Code review completed', {
                owner,
                repo,
                prNumber,
                duration,
                totalFiles: result.data.fileReviews.length,
                overallScore: result.data.summary.overallScore
              });
            }

            return result.data;
          } else {
            // Handle error subtypes
            const errorSubtype = message.subtype;
            const errorMsg = `Agent execution failed: ${errorSubtype}`;
            throw new Error(errorMsg);
          }
        }
      }

      // Should not reach here - result message should break the loop
      throw new Error('Query completed without returning structured output');
    } catch (error) {
      logger.error('Code review failed', {
        owner,
        repo,
        prNumber,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Generate async message stream for query input
   * Required for MCP compatibility
   *
   * @param orchestratorPrompt - The orchestrator prompt text
   * @yields User message with orchestrator prompt
   */
  private async *generateMessages(orchestratorPrompt: string) {
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: orchestratorPrompt
      },
      parent_tool_use_id: null,
      session_id: 'code-review-session'
    };
  }
}
