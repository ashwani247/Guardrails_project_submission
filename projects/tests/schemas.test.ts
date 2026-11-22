import { describe, it, expect } from 'vitest';
import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema,
  ReviewReportSchema
} from '../src/types/index.js';

describe('Zod Schemas Validation', () => {
  describe('CodeQualityResultSchema', () => {
    it('should validate a valid code quality result', () => {
      const validResult = {
        file: 'src/app.ts',
        issues: [
          {
            line: 42,
            severity: 'high',
            category: 'security',
            description: 'SQL injection vulnerability detected',
            suggestion: 'Use parameterized queries instead'
          }
        ],
        overallScore: 75,
        summary: 'Code has security issues that need attention'
      };

      const result = CodeQualityResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.overallScore).toBe(75);
        expect(result.data.issues).toHaveLength(1);
      }
    });

    it('should reject invalid severity level', () => {
      const invalidResult = {
        file: 'src/app.ts',
        issues: [
          {
            line: 42,
            severity: 'invalid_severity',
            category: 'security',
            description: 'Test issue',
            suggestion: 'Fix it'
          }
        ],
        overallScore: 75,
        summary: 'Test'
      };

      const result = CodeQualityResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should reject score outside 0-100 range', () => {
      const invalidResult = {
        file: 'src/app.ts',
        issues: [],
        overallScore: 150,
        summary: 'Test'
      };

      const result = CodeQualityResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should validate multiple issues', () => {
      const validResult = {
        file: 'src/app.ts',
        issues: [
          {
            line: 10,
            severity: 'critical',
            category: 'security',
            description: 'XSS vulnerability',
            suggestion: 'Sanitize user input'
          },
          {
            line: 25,
            severity: 'high',
            category: 'performance',
            description: 'N+1 query detected',
            suggestion: 'Use JOIN instead of loop'
          },
          {
            line: 40,
            severity: 'medium',
            category: 'maintainability',
            description: 'Function is too long',
            suggestion: 'Extract into smaller functions'
          }
        ],
        overallScore: 60,
        summary: 'Multiple issues found'
      };

      const result = CodeQualityResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.issues).toHaveLength(3);
      }
    });
  });

  describe('TestCoverageResultSchema', () => {
    it('should validate a valid test coverage result', () => {
      const validResult = {
        file: 'src/utils/math.ts',
        hasTests: true,
        testFiles: ['src/utils/math.test.ts'],
        untestedPaths: [
          {
            type: 'branch',
            location: 'src/utils/math.ts:divide (error case)',
            priority: 'high',
            reasoning: 'Division by zero not tested',
            suggestedTest: 'Test divide(10, 0) throws error'
          }
        ],
        coverageEstimate: 85,
        summary: 'Good coverage with minor gaps'
      };

      const result = TestCoverageResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasTests).toBe(true);
        expect(result.data.coverageEstimate).toBe(85);
      }
    });

    it('should validate file without tests', () => {
      const validResult = {
        file: 'src/config.ts',
        hasTests: false,
        testFiles: [],
        untestedPaths: [
          {
            type: 'function',
            location: 'src/config.ts:loadConfig',
            priority: 'critical',
            reasoning: 'Config loading is critical and untested',
            suggestedTest: 'Test loadConfig with various env vars'
          }
        ],
        coverageEstimate: 0,
        summary: 'No test coverage'
      };

      const result = TestCoverageResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasTests).toBe(false);
        expect(result.data.testFiles).toHaveLength(0);
      }
    });

    it('should reject invalid coverage estimate', () => {
      const invalidResult = {
        file: 'src/app.ts',
        hasTests: true,
        testFiles: ['src/app.test.ts'],
        untestedPaths: [],
        coverageEstimate: 150,
        summary: 'Test'
      };

      const result = TestCoverageResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });

    it('should validate multiple untested paths with different types', () => {
      const validResult = {
        file: 'src/api.ts',
        hasTests: true,
        testFiles: ['src/api.test.ts'],
        untestedPaths: [
          {
            type: 'function',
            location: 'src/api.ts:getUserById',
            priority: 'critical',
            reasoning: 'Main API endpoint',
            suggestedTest: 'Test valid and invalid user IDs'
          },
          {
            type: 'branch',
            location: 'src/api.ts:middleware (error case)',
            priority: 'high',
            reasoning: 'Error handling',
            suggestedTest: 'Test with invalid headers'
          },
          {
            type: 'edge-case',
            location: 'src/api.ts:parseQuery (empty)',
            priority: 'medium',
            reasoning: 'Edge case with empty query',
            suggestedTest: 'Test with empty query string'
          }
        ],
        coverageEstimate: 70,
        summary: 'Some coverage with gaps'
      };

      const result = TestCoverageResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.untestedPaths).toHaveLength(3);
      }
    });
  });

  describe('RefactoringSuggestionSchema', () => {
    it('should validate a valid refactoring suggestion', () => {
      const validResult = {
        file: 'src/helpers.ts',
        suggestions: [
          {
            type: 'extract-function',
            location: 'src/helpers.ts:processData (lines 20-45)',
            impact: 'high',
            description: 'Extract validation logic into separate function',
            before: 'function processData(data) {\n  if (!data) throw Error();\n  if (data.length === 0) throw Error();\n  // ... rest of logic\n}',
            after: 'function validateData(data) {\n  if (!data) throw Error();\n  if (data.length === 0) throw Error();\n}\n\nfunction processData(data) {\n  validateData(data);\n  // ... rest of logic\n}',
            benefits: 'Improves readability and reusability'
          }
        ],
        summary: 'One refactoring opportunity identified'
      };

      const result = RefactoringSuggestionSchema.safeParse(validResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.suggestions).toHaveLength(1);
        expect(result.data.suggestions[0].type).toBe('extract-function');
      }
    });

    it('should validate multiple refactoring suggestions', () => {
      const validResult = {
        file: 'src/component.tsx',
        suggestions: [
          {
            type: 'extract-function',
            location: 'src/component.tsx:render (lines 30-50)',
            impact: 'high',
            description: 'Extract render logic',
            before: 'function render() { /* 20 lines */ }',
            after: 'function renderHeader() { /* ... */ }\nfunction render() { renderHeader(); /* ... */ }',
            benefits: 'Better readability'
          },
          {
            type: 'rename',
            location: 'src/component.tsx:prop `x`',
            impact: 'medium',
            description: 'Rename ambiguous prop',
            before: 'interface Props { x: string; }',
            after: 'interface Props { title: string; }',
            benefits: 'Clearer intent'
          },
          {
            type: 'modernize',
            location: 'src/component.tsx:var declaration',
            impact: 'low',
            description: 'Replace var with const',
            before: 'var count = 0;',
            after: 'const count = 0;',
            benefits: 'Modern JavaScript practice'
          }
        ],
        summary: 'Multiple refactoring opportunities'
      };

      const result = RefactoringSuggestionSchema.safeParse(validResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.suggestions).toHaveLength(3);
      }
    });

    it('should reject invalid impact level', () => {
      const invalidResult = {
        file: 'src/app.ts',
        suggestions: [
          {
            type: 'extract-function',
            location: 'src/app.ts:fn',
            impact: 'critical',
            description: 'Test',
            before: 'before',
            after: 'after',
            benefits: 'benefits'
          }
        ],
        summary: 'Test'
      };

      const result = RefactoringSuggestionSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });
  });

  describe('ReviewReportSchema', () => {
    it('should validate a complete review report', () => {
      const validReport = {
        pullRequest: {
          owner: 'anthropics',
          repo: 'anthropic-sdk-js',
          number: 123
        },
        fileReviews: [
          {
            file: 'src/app.ts',
            codeQuality: {
              file: 'src/app.ts',
              issues: [],
              overallScore: 85,
              summary: 'Good code quality'
            },
            testCoverage: {
              file: 'src/app.ts',
              hasTests: true,
              testFiles: ['src/app.test.ts'],
              untestedPaths: [],
              coverageEstimate: 90,
              summary: 'Excellent coverage'
            },
            refactorings: {
              file: 'src/app.ts',
              suggestions: [],
              summary: 'No refactoring needed'
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
        recommendations: [],
        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 1234,
          agentVersions: {
            'code-quality-analyzer': '1.0',
            'test-coverage-analyzer': '1.0',
            'refactoring-suggester': '1.0'
          }
        }
      };

      const result = ReviewReportSchema.safeParse(validReport);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pullRequest.owner).toBe('anthropics');
        expect(result.data.fileReviews).toHaveLength(1);
      }
    });

    it('should validate report with recommendations', () => {
      const validReport = {
        pullRequest: {
          owner: 'test',
          repo: 'repo',
          number: 1
        },
        fileReviews: [],
        summary: {
          totalFiles: 0,
          overallScore: 0,
          criticalIssues: 1,
          highPriorityTests: 1,
          refactoringOpportunities: 2
        },
        recommendations: [
          {
            priority: 'critical',
            category: 'security',
            description: 'SQL injection risk in query builder',
            files: ['src/db.ts', 'src/api.ts']
          },
          {
            priority: 'high',
            category: 'testing',
            description: 'Add tests for error handling',
            files: ['src/middleware.ts']
          }
        ],
        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 5000,
          agentVersions: {}
        }
      };

      const result = ReviewReportSchema.safeParse(validReport);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recommendations).toHaveLength(2);
      }
    });

    it('should validate complete multi-file report', () => {
      const validReport = {
        pullRequest: {
          owner: 'anthropics',
          repo: 'anthropic-sdk-js',
          number: 456
        },
        fileReviews: [
          {
            file: 'src/api.ts',
            codeQuality: {
              file: 'src/api.ts',
              issues: [
                {
                  line: 15,
                  severity: 'high',
                  category: 'security',
                  description: 'User input not sanitized',
                  suggestion: 'Use parameterized queries'
                }
              ],
              overallScore: 70,
              summary: 'Security issues found'
            },
            testCoverage: {
              file: 'src/api.ts',
              hasTests: true,
              testFiles: ['src/api.test.ts'],
              untestedPaths: [
                {
                  type: 'branch',
                  location: 'src/api.ts:handleError',
                  priority: 'high',
                  reasoning: 'Error handling not tested',
                  suggestedTest: 'Test error responses'
                }
              ],
              coverageEstimate: 75,
              summary: 'Gaps in error handling'
            },
            refactorings: {
              file: 'src/api.ts',
              suggestions: [
                {
                  type: 'extract-function',
                  location: 'src/api.ts:validateRequest',
                  impact: 'medium',
                  description: 'Extract validation',
                  before: 'function handleRequest(req) { if (!req.body) throw Error(); /* ... */ }',
                  after: 'function validateRequest(req) { if (!req.body) throw Error(); }\nfunction handleRequest(req) { validateRequest(req); /* ... */ }',
                  benefits: 'Better structure'
                }
              ],
              summary: 'One refactoring opportunity'
            }
          },
          {
            file: 'src/utils.ts',
            codeQuality: {
              file: 'src/utils.ts',
              issues: [],
              overallScore: 95,
              summary: 'Excellent code quality'
            },
            testCoverage: {
              file: 'src/utils.ts',
              hasTests: true,
              testFiles: ['src/utils.test.ts'],
              untestedPaths: [],
              coverageEstimate: 98,
              summary: 'Excellent coverage'
            },
            refactorings: {
              file: 'src/utils.ts',
              suggestions: [],
              summary: 'No improvements needed'
            }
          }
        ],
        summary: {
          totalFiles: 2,
          overallScore: 82,
          criticalIssues: 0,
          highPriorityTests: 1,
          refactoringOpportunities: 1
        },
        recommendations: [
          {
            priority: 'high',
            category: 'security',
            description: 'Sanitize user input in API endpoint',
            files: ['src/api.ts']
          }
        ],
        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 8500,
          agentVersions: {
            'code-quality-analyzer': '1.0',
            'test-coverage-analyzer': '1.0',
            'refactoring-suggester': '1.0'
          }
        }
      };

      const result = ReviewReportSchema.safeParse(validReport);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fileReviews).toHaveLength(2);
        expect(result.data.summary.totalFiles).toBe(2);
      }
    });
  });
});
