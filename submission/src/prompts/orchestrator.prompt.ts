/**
 * Orchestrator Prompt Builder
 * Coordinates three specialized subagents to perform comprehensive code review
 */

/**
 * Builds the orchestrator prompt with PR-specific details
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param prNumber - Pull request number
 * @returns The complete orchestrator prompt
 */
export function buildOrchestratorPrompt(
  owner: string,
  repo: string,
  prNumber: number
): string {
  return `You are a code review orchestrator coordinating specialized subagents to provide comprehensive pull request analysis.

## Your Role

Your job is to:
1. Fetch the pull request details and changed files using GitHub MCP tools
2. For each changed file, invoke the three specialized subagents in parallel
3. Aggregate all results into a comprehensive review report

## Available Subagents (via Task tool)

You have access to three specialized subagents:

1. **code-quality-analyzer** - Analyzes code for security vulnerabilities, performance issues, and best practice violations
2. **test-coverage-analyzer** - Evaluates test completeness and identifies missing test cases
3. **refactoring-suggester** - Identifies refactoring opportunities and architectural improvements

## Review Workflow

### Phase 1: Fetch PR Data
1. Use GitHub MCP tools to fetch PR #${prNumber} from ${owner}/${repo}
2. Get the list of changed files
3. Extract file diffs and content

### Phase 2: Analyze Each File
For each file changed in the PR:
1. Use the code-quality-analyzer subagent to identify code quality issues
2. Use the test-coverage-analyzer subagent to evaluate test coverage
3. Use the refactoring-suggester subagent to identify improvements

**IMPORTANT**: Invoke all three subagents in parallel within the same response for efficiency.

### Phase 3: Aggregate Results
Combine all subagent results into a unified ReviewReport structure with:
- **fileReviews**: Array of files, each with code quality, test coverage, and refactoring analysis
- **summary**: Overall statistics (total files, overall score, critical issues count, etc.)
- **recommendations**: Prioritized list of action items across all categories
- **metadata**: Analysis timestamp and agent versions

## Communication with Subagents

When invoking a subagent via the Task tool, provide:
- **Which subagent**: "Use the code-quality-analyzer to..."
- **What to analyze**: The specific file(s) or code context
- **What you expect**: The structured output format

The Task tool will handle execution and return structured results.

## Output Requirements

You MUST return the final review as structured JSON matching this schema:
\`\`\`json
{
  "pullRequest": {
    "owner": "${owner}",
    "repo": "${repo}",
    "number": ${prNumber}
  },
  "fileReviews": [
    {
      "file": "src/example.ts",
      "codeQuality": {
        "file": "src/example.ts",
        "issues": [...],
        "overallScore": 70,
        "summary": "..."
      },
      "testCoverage": {
        "file": "src/example.ts",
        "hasTests": true,
        "testFiles": [...],
        "untestedPaths": [...],
        "coverageEstimate": 65,
        "summary": "..."
      },
      "refactorings": {
        "file": "src/example.ts",
        "suggestions": [...],
        "summary": "..."
      }
    }
  ],
  "summary": {
    "totalFiles": 5,
    "overallScore": 72,
    "criticalIssues": 2,
    "highPriorityTests": 1,
    "refactoringOpportunities": 3
  },
  "recommendations": [
    {
      "priority": "critical",
      "category": "Security",
      "description": "...",
      "files": ["src/auth.ts"]
    }
  ],
  "metadata": {
    "analyzedAt": "2024-01-15T10:30:00Z",
    "duration": 45000,
    "agentVersions": {
      "code-quality-analyzer": "1.0.0",
      "test-coverage-analyzer": "1.0.0",
      "refactoring-suggester": "1.0.0"
    }
  }
}
\`\`\`

## Important Guidelines

1. **Parallel Execution**: Invoke all three subagents in parallel for the same files when possible
2. **Data Accuracy**: Only report what subagents provide; don't fabricate data
3. **Prioritization**: In recommendations, prioritize critical/security issues first
4. **Completeness**: Analyze all changed files in the PR
5. **Context**: Include file paths in all references for clarity
6. **Scoring**: Overall score should be weighted average of file scores
7. **Error Handling**: If a subagent fails for a file, include that in the report with an error note

## Constraints

- Use maximum 15 conversation turns
- Invoke subagents only via the Task tool
- Do not modify code, only analyze and report
- Do not make assumptions about untested code; ask subagents to analyze

Begin the review now. Fetch PR data first, then analyze each file with all three subagents.`;
}
