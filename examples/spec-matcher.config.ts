import type { Config } from '../src/types';

const config: Config = {
  requirements: [
    {
      id: 'user-stories',
      type: 'markdown',
      path: './docs/user-stories/**/*.md',
      // Extract ID (US-XXX) and title from Markdown headings
      idPattern: "^(US-\\d+):\\s+(.*)",
      // Find test links in the format @test: path/to/test.spec.ts#TestCaseName
      linkMarkerPattern: "@test:\\s*(\\S+)#(\\S+)",
    },
    {
      id: 'functional-specs',
      type: 'markdown',
      path: './docs/specs/*.md',
      idPattern: "^(FS-\\d+):\\s+(.*)", // Removed "###\\s+"
      linkMarkerPattern: "@test:\\s*(\\S+)#(\\S+)",
    },
  ],
  tests: [
    {
      id: 'unit-tests',
      type: 'vitest',
      path: './src/**/*.test.ts',
      reportPath: './reports/vitest-results.json'
    },
    {
      id: 'e2e-tests',
      type: 'playwright',
      path: './e2e/**/*.spec.ts',
      reportPath: './playwright-report/results.json'
    },
  ],
  outputDir: './coverage-reports',
};

export default config;
