import { query } from '@anthropic-ai/claude-agent-sdk';
import {
  ReviewReport,
  ReviewReportSchema,
  ReviewReportJSONSchema
} from './types/report-types.js';
import {
  codeQualityAnalyzer,
  testCoverageAnalyzer,
  refactoringSuggester
} from './agents/index.js';
import { buildOrchestratorPrompt } from './prompts/index.js';
import { mcpServersConfig } from './config/mcp.config.js';
import { RateLimiter, type RateLimiterConfig } from './utils/index.js';

/**
 * Orchestrator configuration options
 */
export interface OrchestratorOptions {
  /**
   * Custom rate limit configuration
   * @default DEFAULT_RATE_LIMITS from rate-limiter
   */
  rateLimitConfig?: Partial<RateLimiterConfig>;

  /**
   * Custom model to use (overrides environment variable)
   */
  model?: string;

  /**
   * Maximum turns for orchestrator (default: 10)
   */
  maxTurns?: number;
}

/**
 * Main Code Review Orchestrator
 * Coordinates subagents to analyze pull requests and generate comprehensive reports
 */
export class CodeReviewOrchestrator {
  private rateLimiter: RateLimiter;
  private model: string;
  private maxTurns: number;

  constructor(options: OrchestratorOptions = {}) {
    this.rateLimiter = new RateLimiter(options.rateLimitConfig);
    this.model =
      options.model || process.env.ANTHROPIC_MODEL || 'claude-opus-4-5-20251101';
    this.maxTurns = options.maxTurns || 10;
  }

  /**
   * Review a pull request using parallel subagent analysis
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param prNumber - Pull request number
   * @returns Complete review report
   */
  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    await this.rateLimiter.acquire(2000);

    try {
      const startTime = Date.now();

      // Build the user message with PR details
      const userMessage = `Please analyze the pull request #${prNumber} in ${owner}/${repo}.

Fetch the PR details and all changed files using GitHub tools, then:
1. Use the code-quality-analyzer agent to analyze code quality for each file
2. Use the test-coverage-analyzer agent to analyze test coverage for each file
3. Use the refactoring-suggester agent to suggest refactorings for each file
4. Aggregate all findings into a comprehensive report

Provide the analysis in JSON format matching the specified schema.`;

      // Create async generator for prompt (streaming pattern)
      async function* generateMessages() {
        yield {
          type: "user" as const,
          message: { role: "user" as const, content: buildOrchestratorPrompt() + '\n\n' + userMessage },
          parent_tool_use_id: null,
          session_id: "code-review-orchestrator-session",
        };
      }

      // Execute the orchestrator with subagents
      let finalOutput: ReviewReport | null = null;

      try {
        // Call the query function with agents and get response
        for await (const message of query({
          prompt: generateMessages(),
          options: {
            allowedTools: [
              "Task",
              "mcp__github__get_pull_request",
              "mcp__github__get_pull_request_files",
              "mcp__github__get_file_contents"
            ],
            agents: {
              'code-quality-analyzer': codeQualityAnalyzer,
              'test-coverage-analyzer': testCoverageAnalyzer,
              'refactoring-suggester': refactoringSuggester
            },
            model: this.model,
            outputFormat: {
              type: "json_schema",
              schema: ReviewReportJSONSchema
            },
            maxTurns: this.maxTurns,
            mcpServers: mcpServersConfig as any,
            cwd: process.env.PROJECT_ROOT || process.cwd(),
            settingSources: ['project']
          }
        })) {
          const anyMessage = message as Record<string, unknown>;

          // Check for successful structured output result
          if (message.type === "result" && anyMessage.structured_output) {
            const parseResult = ReviewReportSchema.safeParse(anyMessage.structured_output);
            if (parseResult.success) {
              finalOutput = parseResult.data;
            } else {
              console.error('Schema validation failed:', parseResult.error);
            }
          }
        }
      } catch (error) {
        // Query execution failed, will use fallback report
        console.error('Orchestrator query failed:', error);
      }

      if (!finalOutput) {
        // Create a minimal report as fallback
        finalOutput = {
          pullRequest: { owner, repo, number: prNumber },
          fileReviews: [],
          summary: {
            totalFiles: 0,
            overallScore: 0,
            criticalIssues: 0,
            highPriorityTests: 0,
            refactoringOpportunities: 0
          },
          recommendations: [],
          metadata: {
            analyzedAt: new Date().toISOString(),
            duration: Date.now() - startTime,
            agentVersions: {
              'code-quality-analyzer': '1.0',
              'test-coverage-analyzer': '1.0',
              'refactoring-suggester': '1.0'
            }
          }
        };
      }

      // Update metadata with actual timing
      const duration = Date.now() - startTime;
      finalOutput.metadata.duration = duration;
      finalOutput.metadata.analyzedAt = new Date().toISOString();

      return finalOutput;
    } finally {
      this.rateLimiter.release();
    }
  }
}
