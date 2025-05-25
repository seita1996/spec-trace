import type { CoverageResult, RequirementCoverage } from '../types';

export class MarkdownReporter {
  /**
   * Generate a full Markdown report of the specification coverage
   */
  generate(coverage: CoverageResult, configPath?: string): string {
    const sections: string[] = [];

    // Header
    sections.push('# Specification Coverage Report\n');

    if (configPath) {
      sections.push(`Configuration: \`${configPath}\`\n`);
    }

    // Summary section
    sections.push('## Summary\n');

    const coveragePercentage = coverage.summary.coveragePercentage;
    const barLength = 20;
    const filledBars = Math.round((coveragePercentage / 100) * barLength);
    const emptyBars = barLength - filledBars;
    const coverageBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

    let coverageColor = '';
    if (coveragePercentage >= 75) {
      coverageColor = '🟢'; // Green for good coverage
    } else if (coveragePercentage >= 50) {
      coverageColor = '🟡'; // Yellow for medium coverage
    } else {
      coverageColor = '🔴'; // Red for low coverage
    }

    sections.push(
      `${coverageColor} **Coverage: ${coveragePercentage.toFixed(2)}%** \`${coverageBar}\`\n`,
    );
    sections.push(`- **Total Requirements:** ${coverage.summary.totalRequirements}`);
    sections.push(`- **Covered Requirements:** ${coverage.summary.coveredRequirements}`);
    sections.push(
      `- **Uncovered Requirements:** ${
        coverage.summary.totalRequirements - coverage.summary.coveredRequirements
      }\n`,
    );

    // No requirements case
    if (coverage.requirements.length === 0) {
      sections.push('**No requirements found.**\n');
      return sections.join('\n');
    }

    // Group requirements by type (using the ID prefix)
    const requirementsByType = this.groupRequirementsByType(coverage.requirements);

    // Table of Contents
    sections.push('## Requirements\n');
    sections.push('### Table of Contents\n');
    for (const [type, requirements] of Object.entries(requirementsByType)) {
      const coveredInType = requirements.filter((req: RequirementCoverage) => req.covered).length;
      const totalInType = requirements.length;
      const typePercentage = (coveredInType / totalInType) * 100;

      let typeColor = '';
      if (typePercentage >= 75) {
        typeColor = '🟢';
      } else if (typePercentage >= 50) {
        typeColor = '🟡';
      } else {
        typeColor = '🔴';
      }

      sections.push(
        `- [${type} (${typeColor} ${typePercentage.toFixed(0)}%)](#${type.toLowerCase()})`,
      );
    }
    sections.push('');

    // Add each type and its requirements
    for (const [type, requirements] of Object.entries(requirementsByType)) {
      sections.push(this.formatRequirementSection(type, requirements));
    }

    // Add uncovered requirements section
    const uncoveredRequirements = coverage.requirements.filter(
      (req: RequirementCoverage) => !req.covered,
    );
    if (uncoveredRequirements.length > 0) {
      sections.push(this.formatUncoveredRequirements(uncoveredRequirements));
    }

    // Footer
    sections.push('---\n');
    sections.push(`Report generated on: ${new Date().toLocaleString()}\n`);

    return sections.join('\n');
  }

  /**
   * Generate a simple text summary for CLI output
   */
  generateSummary(coverage: CoverageResult): string {
    if (coverage.summary.totalRequirements === 0) {
      return 'No requirements found.';
    }

    const parts: string[] = [];

    parts.push(`${coverage.summary.totalRequirements} requirement(s) total`);
    parts.push(`${coverage.summary.coveredRequirements} covered`);
    parts.push(`${coverage.summary.coveragePercentage.toFixed(2)}% coverage`);

    return `Found ${parts.join(', ')}.`;
  }

  /**
   * Generate JSON output
   */
  generateJson(coverage: CoverageResult, configPath?: string): string {
    const report = {
      summary: {
        configPath: configPath || null,
        totalRequirements: coverage.summary.totalRequirements,
        coveredRequirements: coverage.summary.coveredRequirements,
        uncoveredRequirements:
          coverage.summary.totalRequirements - coverage.summary.coveredRequirements,
        coveragePercentage: coverage.summary.coveragePercentage,
        generatedAt: new Date().toISOString(),
      },
      requirements: coverage.requirements.map((req: RequirementCoverage) => ({
        id: req.id,
        title: req.title,
        filePath: req.filePath,
        covered: req.covered,
        linkedTests: req.linkedTests.map((test) => ({
          filePath: test.filePath,
          caseName: test.caseName,
        })),
        testResults: req.testResults.map((result) => ({
          filePath: result.filePath,
          caseName: result.caseName,
          status: result.status,
          duration: result.duration,
        })),
      })),
    };

    return JSON.stringify(report, null, 2);
  }

  private groupRequirementsByType(
    requirements: RequirementCoverage[],
  ): Record<string, RequirementCoverage[]> {
    const requirementsByType: Record<string, RequirementCoverage[]> = {};

    for (const req of requirements) {
      // Extract requirement type from ID (assuming format like US-001, FS-001, etc.)
      const matchResult = req.id.match(/([A-Za-z]+)-\d+/);
      const type = matchResult ? matchResult[1] : 'Other';

      if (!requirementsByType[type]) {
        requirementsByType[type] = [];
      }
      requirementsByType[type].push(req);
    }

    return requirementsByType;
  }

  private formatRequirementSection(type: string, requirements: RequirementCoverage[]): string {
    const sections: string[] = [];

    const coveredInType = requirements.filter((req: RequirementCoverage) => req.covered).length;
    const totalInType = requirements.length;
    const typePercentage = (coveredInType / totalInType) * 100;

    let typeColor = '';
    if (typePercentage >= 75) {
      typeColor = '🟢';
    } else if (typePercentage >= 50) {
      typeColor = '🟡';
    } else {
      typeColor = '🔴';
    }

    sections.push(`### ${type} ${typeColor} ${typePercentage.toFixed(0)}%\n`);

    // Create a table for requirements
    sections.push('| ID | Title | Status | Source | Linked Tests |');
    sections.push('|:---|:------|:-------|:-------|:------------|');

    for (const req of requirements) {
      const status = req.covered ? '✅ Covered' : '❌ Not Covered';
      const fileName = req.filePath.split('/').pop() || req.filePath;
      const fileDir = req.filePath.split('/').slice(-2, -1)[0] || '';
      const sourceDisplay = fileDir ? `${fileDir}/${fileName}` : fileName;

      // Format linked tests as list
      let linkedTestsStr = '';
      if (req.linkedTests && req.linkedTests.length > 0) {
        for (const test of req.linkedTests) {
          const testFileName = test.filePath.split('/').pop() || test.filePath;
          linkedTestsStr += `- ${testFileName}#${test.caseName}<br/>`;
        }
      } else {
        linkedTestsStr = '-';
      }

      sections.push(
        `| ${req.id} | ${req.title} | ${status} | ${sourceDisplay} | ${linkedTestsStr} |`,
      );
    }

    sections.push('');
    return sections.join('\n');
  }

  private formatUncoveredRequirements(uncoveredRequirements: RequirementCoverage[]): string {
    const sections: string[] = [];

    sections.push('## Uncovered Requirements\n');
    sections.push('The following requirements have no associated tests:\n');

    for (const req of uncoveredRequirements) {
      const fileName = req.filePath.split('/').pop() || req.filePath;
      sections.push(`- ${req.id}: ${req.title} (_in ${fileName}_)`);
    }

    sections.push('');
    return sections.join('\n');
  }
}
