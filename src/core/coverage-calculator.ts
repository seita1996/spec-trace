import type {
  CoverageResult,
  CoverageSummary,
  Requirement,
  RequirementCoverage,
  TestResult,
} from '../types';

/**
 * Calculates coverage based on linked requirements and test results.
 *
 * @param requirements Array of requirements with linked tests
 * @param testResults Array of test results
 * @returns Coverage result object
 */
export function calculateCoverage(
  requirements: Requirement[],
  testResults: TestResult[]
): CoverageResult {
  // Create a map of test results for quick lookup
  const testResultMap = new Map<string, TestResult>();

  for (const result of testResults) {
    const key = `${result.filePath}#${result.caseName}`;
    testResultMap.set(key, result);
  }

  // Calculate coverage for each requirement
  const requirementCoverages: RequirementCoverage[] = requirements.map((req) => {
    const testResults: TestResult[] = [];
    let covered = false;

    // Find matching test results for linked tests
    for (const linkedTest of req.linkedTests) {
      const key = `${linkedTest.filePath}#${linkedTest.caseName}`;
      const testResult = testResultMap.get(key);

      if (testResult) {
        testResults.push(testResult);

        // Consider the requirement covered if at least one test passed
        if (testResult.status === 'passed') {
          covered = true;
        }
      }
    }

    return {
      ...req,
      covered,
      testResults,
    };
  });

  // Calculate summary
  const totalRequirements = requirementCoverages.length;
  const coveredRequirements = requirementCoverages.filter((req) => req.covered).length;
  const coveragePercentage =
    totalRequirements > 0 ? (coveredRequirements / totalRequirements) * 100 : 0;

  const summary: CoverageSummary = {
    totalRequirements,
    coveredRequirements,
    coveragePercentage,
  };

  return {
    requirements: requirementCoverages,
    summary,
  };
}
