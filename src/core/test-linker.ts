import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';
import type { Requirement, TestResult, TestSource } from '../types';

/**
 * Links requirements with test results and returns linked requirements and all test results.
 *
 * @param requirements Array of parsed requirements
 * @param testSources Array of test source configurations
 * @param baseDir The base directory for resolving relative paths
 * @returns Object containing linked requirements and all test results
 */
export async function linkTestsAndGetResults(
  requirements: Requirement[],
  testSources: TestSource[],
  baseDir: string
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
      // Try to parse test results from report file
      testResults = await parseTestResultsFromReport(source, baseDir);
      // If report parsing fails (e.g., file not found, returns empty) and source.path exists,
      // attempt to extract from files as a fallback.
      if (testResults.length === 0 && source.path) {
        console.log(
          `[test-linker] Report not found or empty for ${source.id}. Falling back to static analysis.`
        );
        testResults = await extractTestIdentifiersFromFiles(source, baseDir);
      }
    } else if (source.path) {
      // If no reportPath, directly try to extract test identifiers from test files
      testResults = await extractTestIdentifiersFromFiles(source, baseDir);
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
 * @param baseDir The base directory for resolving the report path
 * @returns Array of test results
 */
async function parseTestResultsFromReport(
  source: TestSource,
  baseDir: string
): Promise<TestResult[]> {
  if (!source.reportPath) {
    return [];
  }

  try {
    const absoluteReportPath = path.resolve(baseDir, source.reportPath); // Resolve reportPath
    const reportContent = await fs.promises.readFile(absoluteReportPath, 'utf-8');
    const reportData = JSON.parse(reportContent);

    const testResults: TestResult[] = [];

    // Parse test results based on the test framework type
    if (source.type === 'vitest') {
      // Parse Vitest report format
      // This is a simplified example; actual implementation depends on Vitest report format
      if (reportData.testResults) {
        for (const testFile of reportData.testResults) {
          for (const testCase of testFile.assertionResults) {
            // Resolve filePath from report relative to baseDir if it's not absolute
            const resolvedFilePath = path.isAbsolute(testFile.name)
              ? testFile.name
              : path.resolve(baseDir, testFile.name);
            testResults.push({
              filePath: resolvedFilePath,
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
            // Resolve filePath from report relative to baseDir if it's not absolute
            const resolvedFilePath = path.isAbsolute(suite.file)
              ? suite.file
              : path.resolve(baseDir, suite.file);
            testResults.push({
              filePath: resolvedFilePath,
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
 * @param baseDir The base directory for resolving the source path
 * @returns Array of test results (with unknown status)
 */
async function extractTestIdentifiersFromFiles(
  source: TestSource,
  baseDir: string
): Promise<TestResult[]> {
  const testResults: TestResult[] = [];
  if (!source.path) {
    return testResults;
  }

  const absoluteSourcePattern = path.resolve(baseDir, source.path);
  console.log(
    `[test-linker] Globbing for test files with pattern: ${absoluteSourcePattern} (type: ${source.type})`
  );

  try {
    const files = await new Promise<string[]>((resolve, reject) => {
      glob(absoluteSourcePattern, (err, matches) => {
        if (err) reject(err);
        else resolve(matches);
      });
    });

    console.log('[test-linker] Found test files:', files);

    // Simplified regex to find test/it blocks. This is very basic.
    // It looks for `test('name', ...)` or `it('name', ...)`
    // and captures 'name'. It doesn't handle template literals or complex names well.
    const testCaseRegex = /(?:test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g;

    for (const filePath of files) {
      try {
        const fileContent = await fs.promises.readFile(filePath, 'utf-8');
        let match = testCaseRegex.exec(fileContent);
        while (match !== null) {
          const caseName = match[1];
          console.log(`[test-linker] Found test case: "${caseName}" in ${filePath}`);
          testResults.push({
            filePath: filePath, // Store absolute path
            caseName: caseName,
            status: 'pending', // Static analysis cannot determine status
          });
          match = testCaseRegex.exec(fileContent);
        }
      } catch (readError) {
        console.error(`[test-linker] Error reading test file ${filePath}:`, readError);
      }
    }
  } catch (globError) {
    console.error(
      `[test-linker] Error globbing for test files with pattern ${absoluteSourcePattern}:`,
      globError
    );
  }

  console.log('[test-linker] Extracted test identifiers:', testResults);
  return testResults;
}
