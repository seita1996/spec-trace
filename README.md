# SpecTrace

A CLI tool for linking system requirements with test cases and measuring specification coverage.

## Installation

```bash
npm install -g spec-trace
# or
pnpm add -g spec-trace
```

## Features

- Link requirements (written in Markdown) with test cases
- Calculate specification coverage metrics
- Support for multiple test frameworks (Vitest, Playwright)
- Multiple output formats (Markdown, JSON, summary)
- Command-line interface with flexible options

## Quick Start

1. Create a configuration file named `spec-matcher.config.ts`:

```typescript
import type { Config } from 'spec-trace';

const config: Config = {
  baseDir: '.',
  requirements: [
    {
      id: 'user-stories',
      type: 'markdown',
      path: './docs/user-stories/**/*.md',
      idPattern: "^(US-\\d+):\\s+(.*)",
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

3. Run the CLI tool:

```bash
# Generate full Markdown report
spec-trace --config ./spec-matcher.config.ts

# Get summary only
spec-trace --config ./spec-matcher.config.ts --summary-only

# Output JSON format
spec-trace --config ./spec-matcher.config.ts --json
```

## CLI Usage

```bash
spec-trace [options]

Options:
  --config <path>    Path to configuration file (default: "./spec-matcher.config.ts")
  --verbose          Enable verbose logging
  --json             Output in JSON format
  --summary-only     Output only summary text
  --help             Display help for command
  --version          Output the version number
```

### Examples

```bash
# Basic usage with default config
spec-trace

# Specify custom config file
spec-trace --config ./my-spec-config.ts

# Get only the summary
spec-trace --summary-only

# Output in JSON format for CI/CD integration
spec-trace --json

# Combine with other Linux commands
spec-trace > coverage-report.md
spec-trace --json | jq '.summary.coveragePercentage'
spec-trace --summary-only | grep "coverage"
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
    reportPath: './optional/path/to/test/report.json', // Optional
  }
]
```

## Output Formats

### Full Markdown Report

The default output is a comprehensive Markdown report with:
- Coverage summary with visual progress bar
- Requirements grouped by type (US, FS, etc.)
- Detailed table with coverage status
- List of uncovered requirements

### Summary Text

Perfect for quick checks or CI/CD pipelines:
```
Found 10 requirement(s) total, 8 covered, 80.00% coverage.
```

### JSON Format

Structured data for integration with other tools:
```json
{
  "summary": {
    "totalRequirements": 10,
    "coveredRequirements": 8,
    "coveragePercentage": 80,
    "generatedAt": "2025-05-25T12:00:00.000Z"
  },
  "requirements": [...]
}
```

## Integration with CI/CD

Use SpecTrace in your continuous integration workflows:

```yaml
# GitHub Actions example
- name: Check Specification Coverage
  run: |
    spec-trace --json > coverage.json
    COVERAGE=$(jq -r '.summary.coveragePercentage' coverage.json)
    echo "Coverage: $COVERAGE%"
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage below threshold!"
      exit 1
    fi
```

## API Usage

You can also use SpecTrace programmatically:

```typescript
import { measureCoverage, MarkdownReporter } from 'spec-trace';

async function generateReport() {
  const coverage = await measureCoverage({
    configPath: './spec-matcher.config.ts'
  });
  
  const reporter = new MarkdownReporter();
  console.log(reporter.generate(coverage));
}
```

## Development

### Prerequisites

- Node.js (>= 14.0.0)
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test

# Debug CLI during development
pnpm debug --config examples/spec-matcher.config.ts
pnpm debug:help
```

### Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
pnpm lint    # Run linter
pnpm format  # Format code
pnpm check   # Run linter and formatter with fixes
```

## License

MIT
