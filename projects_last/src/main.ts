import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { CodeReviewOrchestrator } from './orchestrator';
import { ReportGenerator } from './utils';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Claude Multi-Agent Code Review System
 * Usage: npm run dev <owner> <repo> <pr-number>
 */
async function main() {
  const [owner, repo, prStr] = process.argv.slice(2);

  // Validate command line arguments
  if (!owner || !repo || !prStr) {
    console.error('❌ Missing required arguments');
    console.error('Usage: npm run dev <owner> <repo> <pr-number>');
    console.error('Example: npm run dev anthropics anthropic-sdk-js 123');
    process.exit(1);
  }

  const prNumber = parseInt(prStr, 10);
  if (isNaN(prNumber) || prNumber <= 0) {
    console.error('❌ PR number must be a positive integer');
    process.exit(1);
  }

  // Validate authentication (choose ONE method)
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasAwsCredentials =
    !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;

  if (!hasAnthropicKey && !hasAwsCredentials) {
    console.error('❌ No authentication method configured');
    console.error(
      'Please set either ANTHROPIC_API_KEY (for Anthropic API) or AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (for Bedrock)'
    );
    process.exit(1);
  }

  if (hasAwsCredentials) {
    if (!process.env.AWS_REGION) {
      console.error('❌ AWS_REGION is required for Bedrock authentication');
      process.exit(1);
    }
    console.log('🔐 Using AWS Bedrock authentication');
  } else {
    console.log('🔐 Using Anthropic API authentication');
  }

  // Validate GITHUB_TOKEN
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN is required');
    console.error('Please set GITHUB_TOKEN in your environment variables');
    console.error('Generate at: https://github.com/settings/tokens');
    console.error('Required scopes: repo, read:org');
    process.exit(1);
  }

  // Validate ANTHROPIC_MODEL environment variable
  if (!process.env.ANTHROPIC_MODEL) {
    console.error('❌ ANTHROPIC_MODEL environment variable is not set');
    console.error('For AWS Bedrock: us.anthropic.claude-sonnet-4-5-20250929-v1:0');
    console.error('For Anthropic API: claude-sonnet-4-5-20250929');
    process.exit(1);
  }

  try {
    console.log(
      `\n🔍 Analyzing PR #${prNumber} in ${owner}/${repo}...`
    );

    // Create orchestrator instance
    const orchestrator = new CodeReviewOrchestrator();

    // Call reviewPullRequest
    const report = await orchestrator.reviewPullRequest(owner, repo, prNumber);

    // Generate formatted reports
    const reportGenerator = new ReportGenerator();
    const markdownReport = reportGenerator.generateMarkdownReport(report);
    const htmlReport = reportGenerator.generateHTMLReport(report);
    const jsonReport = reportGenerator.generateJSONReport(report);

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Save reports to files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = `${owner}-${repo}-pr${prNumber}-${timestamp}`;

    fs.writeFileSync(
      path.join(reportsDir, `${baseName}.md`),
      markdownReport
    );
    fs.writeFileSync(
      path.join(reportsDir, `${baseName}.html`),
      htmlReport
    );
    fs.writeFileSync(
      path.join(reportsDir, `${baseName}.json`),
      jsonReport
    );

    console.log(`\n✅ Reports generated successfully!`);
    console.log(`📁 Saved to: ${reportsDir}/`);
    console.log(`  - ${baseName}.md`);
    console.log(`  - ${baseName}.html`);
    console.log(`  - ${baseName}.json`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
