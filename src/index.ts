import { loadConfigFromFile } from './core/config-loader';
import { calculateCoverage } from './core/coverage-calculator';
import { parseRequirements } from './core/requirement-parser';
import { linkTestsAndGetResults } from './core/test-linker';
import type {
  Config,
  CoverageResult,
  CoverageSummary,
  Requirement,
  RequirementCoverage,
  RequirementSource,
  TestIdentifier,
  TestResult,
  TestSource,
} from './types';

// Re-export types
export type {
  Config,
  CoverageResult,
  Requirement,
  TestResult,
  RequirementCoverage,
  CoverageSummary,
  TestIdentifier,
  RequirementSource,
  TestSource,
};

// Options for the main function
export interface Options {
  configPath: string; // Path to the configuration file
}

/**
 * Measures specification coverage based on the provided configuration.
 *
 * @param options Options for coverage measurement
 * @returns Promise that resolves to coverage result
 */
export async function measureCoverage(options: Options): Promise<CoverageResult> {
  const config = await loadConfigFromFile(options.configPath);
  if (!config) {
    throw new Error(`Failed to load or validate config from ${options.configPath}.`);
  }

  // baseDir is guaranteed to be set by loadConfigFromFile
  const requirements = await parseRequirements(config.requirements, config.baseDir!);
  const { linkedRequirements, allTestResults } = await linkTestsAndGetResults(
    requirements,
    config.tests,
    config.baseDir!
  );
  const coverageResult = calculateCoverage(linkedRequirements, allTestResults);

  return coverageResult;
}

// Re-export individual functions for flexibility
export { loadConfigFromFile, parseRequirements, linkTestsAndGetResults, calculateCoverage };
