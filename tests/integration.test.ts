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

  it('should output 100% coverage for spec-matcher.config.ts', () => {
    const command = `pnpm run build && node ${path.join(__dirname, '..', 'bin', 'spec-trace.js')} ${path.join(examplesDir, 'spec-matcher.config.ts')}`;
    
    try {
      const output = execSync(command, { encoding: 'utf-8' });

      const expectedOutput = `
Specification Coverage Report:
------------------------------
Total Requirements: 4
Covered Requirements: 4
Coverage Percentage: 100.00
`.trim(); // trim() を使って前後の空白を削除

      // 出力に期待する文字列が含まれているか確認
      expect(output).toContain(expectedOutput);
    } catch (error) {
      // エラーが発生した場合、テストを失敗させる
      // エラー内容も出力するとデバッグに役立ちます
      console.error('Test failed with error:', error);
      throw error;
    }
  });
});
