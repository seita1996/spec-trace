// Export all public types used by the library

// Configuration for the library
export interface Config {
  baseDir: string; // Base directory for resolving relative paths in the config, set by loader
  requirements: RequirementSource[];
  tests: TestSource[];
  outputDir?: string; // Future: Report output directory
}

// Configuration for a requirement source
export interface RequirementSource {
  id: string;
  type: 'markdown';
  path: string; // Markdown file or directory path (glob pattern supported)
  idPattern?: string; // Regular expression to extract requirement IDs
  linkMarkerPattern?: string; // Pattern to find test links in Markdown
}

// Configuration for a test source
export interface TestSource {
  id: string;
  type: 'vitest' | 'playwright';
  path: string; // Test files directory path (glob pattern supported)
  reportPath?: string; // Test result report path (JSON format)
}

// Represents a requirement extracted from a Markdown file
export interface Requirement {
  id: string;
  title: string;
  description: string;
  filePath: string;
  linkedTests: TestIdentifier[];
}

// Identifies a test case
export interface TestIdentifier {
  filePath: string;
  caseName: string; // Test case name (describe name + it name)
}

// Represents a test result
export interface TestResult extends TestIdentifier {
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration?: number;
}

// Coverage result for a requirement
export interface RequirementCoverage extends Requirement {
  covered: boolean;
  testResults: TestResult[];
}

// Summary of coverage results
export interface CoverageSummary {
  totalRequirements: number;
  coveredRequirements: number;
  coveragePercentage: number;
}

// Overall coverage result
export interface CoverageResult {
  requirements: RequirementCoverage[];
  summary: CoverageSummary;
}
