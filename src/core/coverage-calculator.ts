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
  testResults: TestResult[],
): CoverageResult {
  // Create a map of test results for quick lookup
  const testResultMap = new Map<string, TestResult>();

  for (const result of testResults) {
    const key = `${result.filePath}#${result.caseName}`;
    testResultMap.set(key, result);
  }
  // console.log('[coverage-calculator] testResultMap keys:', Array.from(testResultMap.keys()));

  // Calculate coverage for each requirement
  const requirementCoverages: RequirementCoverage[] = requirements.map((req) => {
    // console.log(`[coverage-calculator] Processing requirement: ${req.id} from ${req.filePath}`);
    const testResults: TestResult[] = [];
    let covered = false;

    // Find matching test results for linked tests
    for (const linkedTest of req.linkedTests) {
      const key = `${linkedTest.filePath}#${linkedTest.caseName}`;
      // console.log(`[coverage-calculator] Looking for linked test key: ${key}`);
      const testResult = testResultMap.get(key);

      if (testResult) {
        // console.log(`[coverage-calculator] Found matching testResult for ${key}:`, testResult);
        testResults.push(testResult);
        // If a linked test is found (regardless of its status from static analysis),
        // consider the requirement covered.
        // If actual test execution results are available (e.g. from a report),
        // then 'passed' status would be a stricter criteria.
        // For now, existence of a linked test from static analysis implies coverage.
        covered = true;
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
