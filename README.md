# SpecTrace

A library for linking system requirements with test cases and measuring specification coverage.

## Installation

```bash
npm install spec-trace
# or
pnpm add spec-trace
```

## Features

- Load TypeScript configuration files
- Parse Markdown requirement documents
- Link test cases to requirements
- Calculate specification coverage

## Usage

1. Create a configuration file named `spec-matcher.config.ts` in your project:

```typescript
import type { Config } from 'spec-trace';

const config: Config = {
  requirements: [
    {
      id: 'user-stories',
      type: 'markdown',
      path: './docs/user-stories/**/*.md',
      idPattern: "^##\\s+(US-\\d+):\\s+(.*)",
      linkMarkerPattern: "@test:\\s*(\\S+)#(\\S+)",
    },
  ],
  tests: [
    {
      id: 'unit-tests',
      type: 'vitest',
      path: './src/**/*.test.ts',
    },
  ],
};

export default config;
```

2. Add test links to your Markdown requirements:

```markdown
## US-001: User Registration

As a new user, I want to register for an account.

@test: src/auth/register.test.ts#shouldRegisterNewUser
```

3. Measure specification coverage:

```typescript
import { measureCoverage } from 'spec-trace';

async function runCoverageAnalysis() {
  const coverage = await measureCoverage({
    configPath: './spec-matcher.config.ts',
  });
  
  console.log(`Specification Coverage: ${coverage.summary.coveragePercentage.toFixed(2)}%`);
  console.log(`${coverage.summary.coveredRequirements} of ${coverage.summary.totalRequirements} requirements covered`);
}

runCoverageAnalysis();
```

## CLI Usage

You can also use the CLI tool to measure specification coverage:

```bash
# Using npx
npx spec-trace [path/to/your/config.ts]

# Or, if installed globally
spec-trace [path/to/your/config.ts]
```

If no configuration path is provided, it defaults to `./spec-matcher.config.ts`.

The CLI will output a report similar to this:

```
Specification Coverage Report:
------------------------------
Total Requirements: 10
Covered Requirements: 8
Coverage Percentage: 80.00%

Uncovered Requirements:
- REQ-009: Another Feature (in docs/specs/another-feature.md)
- REQ-010: Yet Another Feature (in docs/specs/yet-another-feature.md)
```

## Configuration

The configuration file supports the following options:

### Requirements

Define sources for your requirements:

```typescript
requirements: [
  {
    id: 'source-id',
    type: 'markdown',
    path: './path/to/markdown/files/**/*.md',
    idPattern: "regex-pattern-to-extract-id-and-title",
    linkMarkerPattern: "regex-pattern-to-find-test-links",
  }
]
```

### Tests

Define sources for your tests:

```typescript
tests: [
  {
    id: 'test-source-id',
    type: 'vitest' | 'playwright',
    path: './path/to/test/files/**/*.test.ts',
    reportPath: './optional/path/to/test/report.json',
  }
]
```

## API

- `measureCoverage(options: Options): Promise<CoverageResult>`: Main function to measure specification coverage
- `loadConfigFromFile(configPath: string): Promise<Config | null>`: Load configuration from a file
- `parseRequirements(requirementSources: RequirementSource[]): Promise<Requirement[]>`: Parse requirements from Markdown files
- `linkTestsAndGetResults(requirements: Requirement[], testSources: TestSource[]): Promise<{ linkedRequirements: Requirement[]; allTestResults: TestResult[] }>`: Link tests to requirements
- `calculateCoverage(requirements: Requirement[], testResults: TestResult[]): CoverageResult`: Calculate coverage metrics

## Development

### Prerequisites

- Node.js (>= 14.0.0)
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Run tests
pnpm test
```

### Code Quality Tools

This project uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Run linter
pnpm lint

# Format code
pnpm format

# Run linter and formatter (and apply safe fixes)
pnpm check
```

## License

MIT
