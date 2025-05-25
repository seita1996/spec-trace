import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const examplesDir = path.join(__dirname, '..', 'examples');
const vitestReportDir = path.join(examplesDir, 'reports');
const vitestReportPath = path.join(vitestReportDir, 'vitest-results.json');
const playwrightReportDir = path.join(examplesDir, 'playwright-report');
const playwrightReportPath = path.join(playwrightReportDir, 'results.json');

describe('Integration Test', () => {
  beforeAll(() => {
    // Create dummy report files before running the test
    if (!fs.existsSync(vitestReportDir)) {
      fs.mkdirSync(vitestReportDir, { recursive: true });
    }
    fs.writeFileSync(vitestReportPath, JSON.stringify({}));

    if (!fs.existsSync(playwrightReportDir)) {
      fs.mkdirSync(playwrightReportDir, { recursive: true });
    }
    fs.writeFileSync(playwrightReportPath, JSON.stringify({}));
  });

  afterAll(() => {
    // Clean up dummy report files after the test
    if (fs.existsSync(vitestReportPath)) {
      fs.unlinkSync(vitestReportPath);
    }
    if (fs.existsSync(vitestReportDir) && fs.readdirSync(vitestReportDir).length === 0) {
      fs.rmdirSync(vitestReportDir);
    }

    if (fs.existsSync(playwrightReportPath)) {
      fs.unlinkSync(playwrightReportPath);
    }
    if (fs.existsSync(playwrightReportDir) && fs.readdirSync(playwrightReportDir).length === 0) {
      fs.rmdirSync(playwrightReportDir);
    }
  });

  it('should output markdown report with 100% coverage', () => {
    const command = `node ${path.join(__dirname, '..', 'dist', 'cli.js')} --config ${path.join(examplesDir, 'spec-matcher.config.ts')}`;
    
    try {
      // Ignore stderr as it contains expected warnings about missing test reports
      const output = execSync(command, { encoding: 'utf-8' });

      // Check for markdown report format
      expect(output).toContain('# Specification Coverage Report');
      expect(output).toContain('## Summary');
      expect(output).toContain('🟢 **Coverage: 100.00%**');
      expect(output).toContain('- **Total Requirements:** 4');
      expect(output).toContain('- **Covered Requirements:** 4');
      expect(output).toContain('- **Uncovered Requirements:** 0');
      expect(output).toContain('## Requirements');
      expect(output).toContain('### Table of Contents');
    } catch (error: any) {
      // For debugging: output both stdout and stderr
      console.error('Command failed:', command);
      console.error('stdout:', error.stdout?.toString());
      console.error('stderr:', error.stderr?.toString());
      throw error;
    }
  });

  it('should output summary only when --summary-only flag is used', () => {
    const command = `node ${path.join(__dirname, '..', 'dist', 'cli.js')} --config ${path.join(examplesDir, 'spec-matcher.config.ts')} --summary-only`;
    
    try {
      const output = execSync(command, { encoding: 'utf-8' });

      // Check for summary format
      expect(output).toContain('Found 4 requirement(s) total, 4 covered, 100.00% coverage.');
      // Should not contain markdown headers
      expect(output).not.toContain('# Specification Coverage Report');
    } catch (error: any) {
      console.error('Command failed:', command);
      console.error('stdout:', error.stdout?.toString());
      console.error('stderr:', error.stderr?.toString());
      throw error;
    }
  });

  it('should output JSON format when --json flag is used', () => {
    const command = `node ${path.join(__dirname, '..', 'dist', 'cli.js')} --config ${path.join(examplesDir, 'spec-matcher.config.ts')} --json`;
    
    try {
      const output = execSync(command, { encoding: 'utf-8' });

      // Parse JSON to ensure it's valid
      const jsonResult = JSON.parse(output);
      
      expect(jsonResult).toHaveProperty('summary');
      expect(jsonResult).toHaveProperty('requirements');
      expect(jsonResult.summary).toHaveProperty('totalRequirements', 4);
      expect(jsonResult.summary).toHaveProperty('coveredRequirements', 4);
      expect(jsonResult.summary).toHaveProperty('coveragePercentage', 100);
      expect(jsonResult.requirements).toHaveLength(4);
    } catch (error: any) {
      console.error('Command failed:', command);
      console.error('stdout:', error.stdout?.toString());
      console.error('stderr:', error.stderr?.toString());
      throw error;
    }
  });

  it('should show help when --help flag is used', () => {
    const command = `node ${path.join(__dirname, '..', 'dist', 'cli.js')} --help`;
    
    try {
      const output = execSync(command, { encoding: 'utf-8' });

      expect(output).toContain('Usage: spec-trace [options]');
      expect(output).toContain('--config <path>');
      expect(output).toContain('--verbose');
      expect(output).toContain('--json');
      expect(output).toContain('--summary-only');
    } catch (error: any) {
      console.error('Command failed:', command);
      console.error('stdout:', error.stdout?.toString());
      console.error('stderr:', error.stderr?.toString());
      throw error;
    }
  });
});
