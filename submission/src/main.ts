import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { CodeReviewOrchestrator } from './orchestrator.js';
import { ReportGenerator, logger, formatError } from './utils/index.js';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Claude Multi-Agent Code Review System
 * Usage: npm run dev <owner> <repo> <pr-number>
 */
async function main() {
  const [owner, repo, prStr] = process.argv.slice(2);

  // ========================================
  // 1. VALIDATE COMMAND LINE ARGUMENTS
  // ========================================
  if (!owner || !repo || !prStr) {
    console.error('❌ Missing required arguments');
    console.error('Usage: npm run dev <owner> <repo> <pr-number>');
    console.error('Example: npm run dev facebook react 12345');
    process.exit(1);
  }

  // Validate PR number is a valid positive integer
  const prNumber = parseInt(prStr, 10);
  if (isNaN(prNumber) || prNumber <= 0) {
    console.error('❌ Invalid PR number. Must be a positive integer.');
    console.error(`Received: ${prStr}`);
    process.exit(1);
  }

  // ========================================
  // 2. VALIDATE AUTHENTICATION
  // ========================================
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasAwsCredentials = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );

  if (!hasAnthropicKey && !hasAwsCredentials) {
    console.error('❌ Authentication not configured. Choose ONE method:');
    console.error('');
    console.error('Option 1: Anthropic API');
    console.error('  Set environment variable: ANTHROPIC_API_KEY=sk-ant-...');
    console.error('');
    console.error('Option 2: AWS Bedrock');
    console.error('  Set environment variables:');
    console.error('    AWS_ACCESS_KEY_ID=...');
    console.error('    AWS_SECRET_ACCESS_KEY=...');
    console.error('    AWS_REGION=us-east-1  (or your region)');
    process.exit(1);
  }

  // Check AWS Bedrock configuration
  if (hasAwsCredentials) {
    if (!process.env.AWS_REGION) {
      console.error('❌ AWS_REGION not set. Required for AWS Bedrock authentication.');
      console.error('Set: AWS_REGION=us-east-1 (or your region)');
      process.exit(1);
    }
    console.log('🔐 Using AWS Bedrock authentication');
  } else {
    console.log('🔐 Using Anthropic API authentication');
  }

  // ========================================
  // 3. VALIDATE ANTHROPIC_MODEL
  // ========================================
  const model = process.env.ANTHROPIC_MODEL;
  if (!model) {
    console.error('❌ ANTHROPIC_MODEL environment variable not set.');
    console.error('');
    console.error('For Anthropic API, set:');
    console.error('  ANTHROPIC_MODEL=claude-sonnet-4-5-20250929');
    console.error('');
    console.error('For AWS Bedrock, set:');
    console.error('  ANTHROPIC_MODEL=us.anthropic.claude-sonnet-4-5-20250929-v1:0');
    process.exit(1);
  }

  console.log(`📋 Analyzing PR: ${owner}/${repo}#${prNumber}`);
  console.log(`🤖 Using model: ${model}`);

  try {
    // ========================================
    // 4. CREATE ORCHESTRATOR & RUN REVIEW
    // ========================================
    const orchestrator = new CodeReviewOrchestrator({ model });
    logger.info('Starting code review', { owner, repo, prNumber });

    console.log('⏳ Analyzing pull request (this may take 2-5 minutes)...');
    const report = await orchestrator.reviewPullRequest(owner, repo, prNumber);

    // ========================================
    // 5. GENERATE & SAVE REPORTS
    // ========================================
    const reportGenerator = new ReportGenerator();

    // Create reports directory if it doesn't exist
    const reportsDir = 'reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate filename base from PR details
    const filenameBase = `${owner}_${repo}_${prNumber}`;

    // Generate Markdown report
    const mdReport = reportGenerator.generateMarkdownReport(report);
    const mdPath = path.join(reportsDir, `${filenameBase}.md`);
    fs.writeFileSync(mdPath, mdReport);
    console.log(`✅ Markdown report: ${mdPath}`);

    // Generate HTML report
    const htmlReport = reportGenerator.generateHTMLReport(report);
    const htmlPath = path.join(reportsDir, `${filenameBase}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    console.log(`✅ HTML report: ${htmlPath}`);

    // Generate JSON report
    const jsonReport = JSON.stringify(report, null, 2);
    const jsonPath = path.join(reportsDir, `${filenameBase}.json`);
    fs.writeFileSync(jsonPath, jsonReport);
    console.log(`✅ JSON report: ${jsonPath}`);

    // ========================================
    // 6. SUMMARY
    // ========================================
    console.log('');
    console.log('📊 Review Summary:');
    console.log(`   • Files analyzed: ${report.fileReviews.length}`);
    console.log(`   • Overall score: ${report.summary.overallScore}/100`);
    console.log(`   • Critical issues: ${report.summary.criticalIssues}`);
    console.log(`   • High priority tests: ${report.summary.highPriorityTests}`);
    console.log(`   • Refactoring opportunities: ${report.summary.refactoringOpportunities}`);
    console.log('');
    console.log('✨ Review complete! Check the reports/ directory for detailed analysis.');
  } catch (error) {
    console.error('');
    console.error('❌ Code review failed:');
    console.error(formatError(error));
    logger.error('Code review failed', {
      owner,
      repo,
      prNumber,
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}

main();
