/**
 * Unit tests for Zod schemas
 * Tests valid data, invalid data, edge cases, and JSON schema export
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema,
  ReviewReportSchema,
  CodeQualityResultJSONSchema,
  TestCoverageResultJSONSchema,
  RefactoringSuggestionJSONSchema,
  ReviewReportJSONSchema
} from '../src/types/index.js';

// ============================================
// CODE QUALITY RESULT SCHEMA TESTS
// ============================================
describe('CodeQualityResultSchema', () => {
  describe('Valid Data', () => {
    it('should accept valid code quality result', () => {
      const validData = {
        file: 'src/example.ts',
        issues: [
          {
            line: 42,
            severity: 'critical' as const,
            category: 'security' as const,
            description: 'SQL injection vulnerability',
            suggestion: 'Use parameterized queries'
          }
        ],
        overallScore: 65,
        summary: 'Found 1 critical issue'
      };

      const result = CodeQualityResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.file).toBe('src/example.ts');
        expect(result.data.overallScore).toBe(65);
      }
    });

    it('should accept result with empty issues array', () => {
      const validData = {
        file: 'src/clean.ts',
        issues: [],
        overallScore: 95,
        summary: 'No issues found'
      };

      const result = CodeQualityResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.issues).toHaveLength(0);
      }
    });

    it('should accept multiple issues with different severities', () => {
      const validData = {
        file: 'src/mixed.ts',
        issues: [
          {
            line: 10,
            severity: 'critical' as const,
            category: 'security' as const,
            description: 'Issue 1',
            suggestion: 'Fix 1'
          },
          {
            line: 20,
            severity: 'high' as const,
            category: 'performance' as const,
            description: 'Issue 2',
            suggestion: 'Fix 2'
          },
          {
            line: 30,
            severity: 'low' as const,
            category: 'style' as const,
            description: 'Issue 3',
            suggestion: 'Fix 3'
          }
        ],
        overallScore: 50,
        summary: 'Multiple issues'
      };

      const result = CodeQualityResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.issues).toHaveLength(3);
      }
    });
  });

  describe('Invalid Data', () => {
    it('should reject missing file field', () => {
      const invalidData = {
        issues: [],
        overallScore: 80,
        summary: 'Missing file'
      };

      const result = CodeQualityResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid severity value', () => {
      const invalidData = {
        file: 'src/example.ts',
        issues: [
          {
            line: 10,
            severity: 'unknown',
            category: 'security',
            description: 'Issue',
            suggestion: 'Fix'
          }
        ],
        overallScore: 50,
        summary: 'Invalid severity'
      };

      const result = CodeQualityResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject score outside 0-100 range', () => {
      const invalidData = {
        file: 'src/example.ts',
        issues: [],
        overallScore: 150,
        summary: 'Score too high'
      };

      const result = CodeQualityResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric line numbers', () => {
      const invalidData = {
        file: 'src/example.ts',
        issues: [
          {
            line: 'invalid',
            severity: 'high',
            category: 'security',
            description: 'Issue',
            suggestion: 'Fix'
          }
        ],
        overallScore: 50,
        summary: 'Invalid line'
      };

      const result = CodeQualityResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should accept score of 0', () => {
      const validData = {
        file: 'src/broken.ts',
        issues: [],
        overallScore: 0,
        summary: 'Completely broken'
      };

      const result = CodeQualityResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept score of 100', () => {
      const validData = {
        file: 'src/perfect.ts',
        issues: [],
        overallScore: 100,
        summary: 'Perfect code'
      };

      const result = CodeQualityResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept all valid categories', () => {
      const categories = ['security', 'performance', 'maintainability', 'style', 'bug-risk', 'best-practice'];

      for (const category of categories) {
        const validData = {
          file: 'src/test.ts',
          issues: [
            {
              line: 1,
              severity: 'info' as const,
              category: category as any,
              description: 'Test',
              suggestion: 'Fix'
            }
          ],
          overallScore: 50,
          summary: 'Test'
        };

        const result = CodeQualityResultSchema.safeParse(validData);
        expect(result.success).toBe(true);
      }
    });
  });
});

// ============================================
// TEST COVERAGE RESULT SCHEMA TESTS
// ============================================
describe('TestCoverageResultSchema', () => {
  describe('Valid Data', () => {
    it('should accept valid test coverage result', () => {
      const validData = {
        file: 'src/utils.ts',
        hasTests: true,
        testFiles: ['src/utils.test.ts'],
        untestedPaths: [
          {
            type: 'function' as const,
            location: 'calculateTotal - error case',
            priority: 'high' as const,
            reasoning: 'No test for when input is null',
            suggestedTest: 'expect(() => calculateTotal(null)).toThrow()'
          }
        ],
        coverageEstimate: 75,
        summary: '75% coverage, 1 high priority gap'
      };

      const result = TestCoverageResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasTests).toBe(true);
        expect(result.data.untestedPaths).toHaveLength(1);
      }
    });

    it('should accept file with no tests', () => {
      const validData = {
        file: 'src/constants.ts',
        hasTests: false,
        testFiles: [],
        untestedPaths: [
          {
            type: 'function' as const,
            location: 'All functions',
            priority: 'low' as const,
            reasoning: 'Constants file, no business logic',
            suggestedTest: 'No tests needed'
          }
        ],
        coverageEstimate: 0,
        summary: 'No tests (expected for constants file)'
      };

      const result = TestCoverageResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasTests).toBe(false);
      }
    });

    it('should accept multiple untested paths', () => {
      const validData = {
        file: 'src/api.ts',
        hasTests: true,
        testFiles: ['src/api.test.ts'],
        untestedPaths: [
          {
            type: 'function' as const,
            location: 'fetchData',
            priority: 'critical' as const,
            reasoning: 'No test for success path',
            suggestedTest: 'Test successful API call'
          },
          {
            type: 'branch' as const,
            location: 'fetchData - catch block',
            priority: 'high' as const,
            reasoning: 'No test for error handling',
            suggestedTest: 'Test API error'
          }
        ],
        coverageEstimate: 50,
        summary: 'Multiple gaps'
      };

      const result = TestCoverageResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.untestedPaths).toHaveLength(2);
      }
    });
  });

  describe('Invalid Data', () => {
    it('should reject missing hasTests field', () => {
      const invalidData = {
        file: 'src/test.ts',
        testFiles: [],
        untestedPaths: [],
        coverageEstimate: 50,
        summary: 'Missing hasTests'
      };

      const result = TestCoverageResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid untested path type', () => {
      const invalidData = {
        file: 'src/test.ts',
        hasTests: true,
        testFiles: [],
        untestedPaths: [
          {
            type: 'invalid',
            location: 'test',
            priority: 'high',
            reasoning: 'test',
            suggestedTest: 'test'
          }
        ],
        coverageEstimate: 50,
        summary: 'Invalid type'
      };

      const result = TestCoverageResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject coverage estimate outside 0-100', () => {
      const invalidData = {
        file: 'src/test.ts',
        hasTests: true,
        testFiles: [],
        untestedPaths: [],
        coverageEstimate: 150,
        summary: 'Too high'
      };

      const result = TestCoverageResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================
// REFACTORING SUGGESTION SCHEMA TESTS
// ============================================
describe('RefactoringSuggestionSchema', () => {
  describe('Valid Data', () => {
    it('should accept valid refactoring suggestion', () => {
      const validData = {
        file: 'src/handler.ts',
        suggestions: [
          {
            type: 'extract-function' as const,
            location: 'processOrder (lines 45-75)',
            impact: 'high' as const,
            description: 'Method too large',
            before: 'if (order.total > 0) { ... 30 lines of code ... }',
            after: 'if (order.total > 0) { processPayment(order); }',
            benefits: 'Improves readability and testability'
          }
        ],
        summary: '1 high-impact refactoring opportunity'
      };

      const result = RefactoringSuggestionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.suggestions).toHaveLength(1);
      }
    });

    it('should accept file with no refactoring opportunities', () => {
      const validData = {
        file: 'src/well-designed.ts',
        suggestions: [],
        summary: 'Code is well-structured'
      };

      const result = RefactoringSuggestionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.suggestions).toHaveLength(0);
      }
    });

    it('should accept all valid refactoring types', () => {
      const types = ['extract-function', 'rename', 'modernize', 'simplify', 'pattern-improvement'];

      for (const type of types) {
        const validData = {
          file: 'src/test.ts',
          suggestions: [
            {
              type: type as any,
              location: 'test',
              impact: 'medium' as const,
              description: 'Test',
              before: 'before',
              after: 'after',
              benefits: 'Benefits'
            }
          ],
          summary: 'Test'
        };

        const result = RefactoringSuggestionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Invalid Data', () => {
    it('should reject invalid refactoring type', () => {
      const invalidData = {
        file: 'src/test.ts',
        suggestions: [
          {
            type: 'invalid-type',
            location: 'test',
            impact: 'high',
            description: 'Test',
            before: 'before',
            after: 'after',
            benefits: 'Benefits'
          }
        ],
        summary: 'Invalid'
      };

      const result = RefactoringSuggestionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid impact value', () => {
      const invalidData = {
        file: 'src/test.ts',
        suggestions: [
          {
            type: 'extract-function',
            location: 'test',
            impact: 'invalid',
            description: 'Test',
            before: 'before',
            after: 'after',
            benefits: 'Benefits'
          }
        ],
        summary: 'Invalid'
      };

      const result = RefactoringSuggestionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing before/after fields', () => {
      const invalidData = {
        file: 'src/test.ts',
        suggestions: [
          {
            type: 'extract-function',
            location: 'test',
            impact: 'high',
            description: 'Test',
            benefits: 'Benefits'
          }
        ],
        summary: 'Invalid'
      };

      const result = RefactoringSuggestionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================
// REVIEW REPORT SCHEMA TESTS
// ============================================
describe('ReviewReportSchema', () => {
  it('should accept valid review report', () => {
    const validData = {
      pullRequest: {
        owner: 'facebook',
        repo: 'react',
        number: 12345
      },
      fileReviews: [
        {
          file: 'src/index.ts',
          codeQuality: {
            file: 'src/index.ts',
            issues: [],
            overallScore: 85,
            summary: 'Good code'
          },
          testCoverage: {
            file: 'src/index.ts',
            hasTests: true,
            testFiles: ['src/index.test.ts'],
            untestedPaths: [],
            coverageEstimate: 90,
            summary: 'Well tested'
          },
          refactorings: {
            file: 'src/index.ts',
            suggestions: [],
            summary: 'Well refactored'
          }
        }
      ],
      summary: {
        totalFiles: 1,
        overallScore: 85,
        criticalIssues: 0,
        highPriorityTests: 0,
        refactoringOpportunities: 0
      },
      recommendations: [
        {
          priority: 'low' as const,
          category: 'Documentation',
          description: 'Add JSDoc comments',
          files: ['src/index.ts']
        }
      ],
      metadata: {
        analyzedAt: new Date().toISOString(),
        duration: 45000,
        agentVersions: {
          'code-quality-analyzer': '1.0.0',
          'test-coverage-analyzer': '1.0.0',
          'refactoring-suggester': '1.0.0'
        }
      }
    };

    const result = ReviewReportSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fileReviews).toHaveLength(1);
      expect(result.data.summary.totalFiles).toBe(1);
    }
  });
});

// ============================================
// JSON SCHEMA EXPORT TESTS
// ============================================
describe('JSON Schema Exports', () => {
  it('should export valid JSON schema for CodeQualityResult', () => {
    expect(CodeQualityResultJSONSchema).toBeDefined();
    expect(typeof CodeQualityResultJSONSchema).toBe('object');
  });

  it('should export valid JSON schema for TestCoverageResult', () => {
    expect(TestCoverageResultJSONSchema).toBeDefined();
    expect(typeof TestCoverageResultJSONSchema).toBe('object');
  });

  it('should export valid JSON schema for RefactoringSuggestion', () => {
    expect(RefactoringSuggestionJSONSchema).toBeDefined();
    expect(typeof RefactoringSuggestionJSONSchema).toBe('object');
  });

  it('should export valid JSON schema for ReviewReport', () => {
    expect(ReviewReportJSONSchema).toBeDefined();
    expect(typeof ReviewReportJSONSchema).toBe('object');
  });
});
