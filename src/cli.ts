#!/usr/bin/env node

// Register ts-node for TypeScript configuration files
require('ts-node/register');

import { Command } from 'commander';
import { MarkdownReporter } from './core/markdown-reporter';
import { measureCoverage } from './index';
import type { CLIOptions } from './types';

const program = new Command();

program
  .name('spec-trace')
  .description(
    'A library for linking system requirements with test cases and measuring specification coverage',
  )
  .version('0.1.2');

program
  .option('--config <path>', 'Path to configuration file', './spec-matcher.config.ts')
  .option('--verbose', 'Enable verbose logging', false)
  .option('--json', 'Output in JSON format', false)
  .option('--summary-only', 'Output only summary text', false);

program.action(async (options) => {
  try {
    const cliOptions: CLIOptions = {
      config: options.config,
      verbose: options.verbose,
      json: options.json,
      summaryOnly: options.summaryOnly,
    };

    if (cliOptions.verbose) {
      console.error(`Loading configuration from: ${cliOptions.config}`);
    }

    const coverage = await measureCoverage({
      configPath: cliOptions.config || './spec-matcher.config.ts',
    });
    const reporter = new MarkdownReporter();

    if (cliOptions.json) {
      // JSON output
      const jsonReport = reporter.generateJson(coverage, cliOptions.config);
      console.log(jsonReport);
    } else if (cliOptions.summaryOnly) {
      // Summary only
      const summary = reporter.generateSummary(coverage);
      console.log(summary);
    } else {
      // Full Markdown report
      const markdownReport = reporter.generate(coverage, cliOptions.config);
      console.log(markdownReport);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error: ${errorMessage}`);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);
