import * as fs from 'fs';
import type { Requirement, TestResult, TestSource } from '../types';

/**
 * Links requirements with test results and returns linked requirements and all test results.
 *
 * @param requirements Array of parsed requirements
 * @param testSources Array of test source configurations
 * @returns Object containing linked requirements and all test results
 */
export async function linkTestsAndGetResults(
  requirements: Requirement[],
  testSources: TestSource[]
): Promise<{
  linkedRequirements: Requirement[];
  allTestResults: TestResult[];
}> {
  const allTestResults: TestResult[] = [];

  // Clone requirements to avoid mutating the original
  const linkedRequirements = JSON.parse(JSON.stringify(requirements)) as Requirement[];

  // Process each test source
  for (const source of testSources) {
    let testResults: TestResult[] = [];

    if (source.reportPath) {
      // Parse test results from report file
      testResults = await parseTestResultsFromReport(source);
    } else if (source.path) {
      // Try to extract test identifiers from test files (static analysis)
      testResults = await extractTestIdentifiersFromFiles(source);
    }

    // Add test results to the collection
    allTestResults.push(...testResults);
  }

  // Link requirements with test results
  // For now, we assume the linking is already done during requirement parsing
  // based on the linkMarkerPattern

  return {
    linkedRequirements,
    allTestResults,
  };
}

/**
 * Parses test results from a report file.
 *
 * @param source Test source configuration
 * @returns Array of test results
 */
async function parseTestResultsFromReport(source: TestSource): Promise<TestResult[]> {
  if (!source.reportPath) {
    return [];
  }

  try {
    const reportContent = await fs.promises.readFile(source.reportPath, 'utf-8');
    const reportData = JSON.parse(reportContent);

    const testResults: TestResult[] = [];

    // Parse test results based on the test framework type
    if (source.type === 'vitest') {
      // Parse Vitest report format
      // This is a simplified example; actual implementation depends on Vitest report format
      if (reportData.testResults) {
        for (const testFile of reportData.testResults) {
          for (const testCase of testFile.assertionResults) {
            testResults.push({
              filePath: testFile.name,
              caseName: testCase.fullName || testCase.title,
              status: testCase.status,
              duration: testCase.duration,
            });
          }
        }
      }
    } else if (source.type === 'playwright') {
      // Parse Playwright report format
      // This is a simplified example; actual implementation depends on Playwright report format
      if (reportData.suites) {
        for (const suite of reportData.suites) {
          for (const test of suite.specs) {
            testResults.push({
              filePath: suite.file,
              caseName: test.title,
              status: test.ok ? 'passed' : 'failed',
              duration: test.duration,
            });
          }
        }
      }
    }

    return testResults;
  } catch (error) {
    console.error(`Error parsing test report from ${source.reportPath}:`, error);
    return [];
  }
}

/**
 * Extracts test identifiers from test files (static analysis).
 * This is a placeholder for a more complex implementation that would
 * use TypeScript Compiler API or similar to analyze test files.
 *
 * @param source Test source configuration
 * @returns Array of test results (with unknown status)
 */
async function extractTestIdentifiersFromFiles(source: TestSource): Promise<TestResult[]> {
  // This is a simplified placeholder implementation
  // Actual implementation would use TypeScript Compiler API or similar to analyze test files
  console.log(source);

  return [];
}
