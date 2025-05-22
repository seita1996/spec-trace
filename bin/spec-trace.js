#!/usr/bin/env node

require('ts-node/register');
const { measureCoverage } = require('../dist');
const fs = require('fs');
const path = require('path');

// Redirect console.log to suppress logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Only allow Specification Coverage Report logs
console.log = function (...args) {
  const message = args[0];
  if (typeof message === 'string' && 
      (message.startsWith('Specification Coverage Report:') || 
       message === '------------------------------' ||
       message.startsWith('Total Requirements:') ||
       message.startsWith('Covered Requirements:') ||
       message.startsWith('Coverage Percentage:') ||
       message === '\nUncovered Requirements:' ||
       (args[0].startsWith('- ') && args[0].includes(': ') && args[0].includes(' (in ')))) {
    originalConsoleLog.apply(console, args);
  }
};

// Only allow critical errors
console.error = function (...args) {
  // エラーメッセージは常に表示する
  originalConsoleError.apply(console, args);
};

/**
 * Generates a Markdown report of the specification coverage
 * 
 * @param {Object} coverage - The coverage result
 * @param {string} outputPath - Path to save the Markdown report
 */
async function generateMarkdownReport(coverage, outputPath) {
  let markdown = '# Specification Coverage Report\n\n';
  
  // Add summary with visual percentage bar
  markdown += '## Summary\n\n';
  
  const coveragePercentage = coverage.summary.coveragePercentage;
  const barLength = 20;
  const filledBars = Math.round((coveragePercentage / 100) * barLength);
  const emptyBars = barLength - filledBars;
  const coverageBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
  
  let coverageColor = '';
  if (coveragePercentage >= 75) {
    coverageColor = '🟢';  // Green for good coverage
  } else if (coveragePercentage >= 50) {
    coverageColor = '🟡';  // Yellow for medium coverage
  } else {
    coverageColor = '🔴';  // Red for low coverage
  }
  
  markdown += `${coverageColor} **Coverage: ${coveragePercentage.toFixed(2)}%** \`${coverageBar}\`\n\n`;
  markdown += `- **Total Requirements:** ${coverage.summary.totalRequirements}\n`;
  markdown += `- **Covered Requirements:** ${coverage.summary.coveredRequirements}\n`;
  markdown += `- **Uncovered Requirements:** ${coverage.summary.totalRequirements - coverage.summary.coveredRequirements}\n\n`;
  
  // Add requirements by coverage status
  markdown += '## Requirements\n\n';
  
  // Group requirements by type (using the ID prefix)
  const requirementsByType = {};
  
  coverage.requirements.forEach(req => {
    // Extract requirement type from ID (assuming format like US-001, FS-001, etc.)
    const matchResult = req.id.match(/([A-Za-z]+)-\d+/);
    const type = matchResult ? matchResult[1] : 'Other';
    
    if (!requirementsByType[type]) {
      requirementsByType[type] = [];
    }
    requirementsByType[type].push(req);
  });
  
  // First add a TOC
  markdown += '### Table of Contents\n\n';
  for (const [type, requirements] of Object.entries(requirementsByType)) {
    const coveredInType = requirements.filter(req => req.covered).length;
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
    
    markdown += `- [${type} (${typeColor} ${typePercentage.toFixed(0)}%)](#${type.toLowerCase()})\n`;
  }
  markdown += '\n';
  
  // Add each type and its requirements
  for (const [type, requirements] of Object.entries(requirementsByType)) {
    const coveredInType = requirements.filter(req => req.covered).length;
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
    
    markdown += `### ${type} ${typeColor} ${typePercentage.toFixed(0)}%\n\n`;
    
    // Create a table for requirements
    markdown += '| ID | Title | Status | Source | Linked Tests |\n';
    markdown += '|:---|:------|:-------|:-------|:------------|\n';
    
    requirements.forEach(req => {
      const status = req.covered ? '✅ Covered' : '❌ Not Covered';
      const fileName = path.basename(req.filePath);
      const fileDir = path.dirname(req.filePath).split(path.sep).pop();
      const sourceDisplay = `${fileDir}/${fileName}`;
      
      // Format linked tests as list
      let linkedTestsStr = '';
      if (req.linkedTests && req.linkedTests.length > 0) {
        req.linkedTests.forEach(test => {
          const testFileName = path.basename(test.filePath);
          linkedTestsStr += `- ${testFileName}#${test.caseName}<br/>`;
        });
      } else {
        linkedTestsStr = '-';
      }
      
      markdown += `| ${req.id} | ${req.title} | ${status} | ${sourceDisplay} | ${linkedTestsStr} |\n`;
    });
    
    markdown += '\n';
  }
  
  // Add list of uncovered requirements for quick reference
  const uncoveredRequirements = coverage.requirements.filter(req => !req.covered);
  if (uncoveredRequirements.length > 0) {
    markdown += '## Uncovered Requirements\n\n';
    markdown += 'The following requirements have no associated tests:\n\n';
    
    uncoveredRequirements.forEach(req => {
      const fileName = path.basename(req.filePath);
      markdown += `- ${req.id}: ${req.title} (_in ${fileName}_)\n`;
    });
    
    markdown += '\n';
  }
  
  // Add report generation timestamp
  markdown += '---\n\n';
  markdown += `Report generated on: ${new Date().toLocaleString()}\n`;
  
  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write the markdown file
  fs.writeFileSync(outputPath, markdown);
  originalConsoleLog(`Markdown report saved to: ${outputPath}`);
}

async function run() {
  const configPath = process.argv[2] || './spec-matcher.config.ts';
  
  try {
    // Restore original console functions temporarily to allow config loading logs
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Load the config to determine output dir
    const config = require(path.resolve(process.cwd(), configPath));
    
    // Silence logs again
    console.log = function (...args) {
      const message = args[0];
      if (typeof message === 'string' && 
          (message.startsWith('Specification Coverage Report:') || 
           message === '------------------------------' ||
           message.startsWith('Total Requirements:') ||
           message.startsWith('Covered Requirements:') ||
           message.startsWith('Coverage Percentage:') ||
           message === '\nUncovered Requirements:' ||
           (args[0].startsWith('- ') && args[0].includes(': ') && args[0].includes(' (in ')))) {
        originalConsoleLog.apply(console, args);
      }
    };
    
    console.error = function (...args) {
      // エラーメッセージは常に表示する
      originalConsoleError.apply(console, args);
    };
    
    const coverage = await measureCoverage({ configPath });
    
    // Print standard summary to console
    originalConsoleLog('Specification Coverage Report:');
    originalConsoleLog('------------------------------');
    originalConsoleLog(`Total Requirements: ${coverage.summary.totalRequirements}`);
    originalConsoleLog(`Covered Requirements: ${coverage.summary.coveredRequirements}`);
    originalConsoleLog(`Coverage Percentage: ${coverage.summary.coveragePercentage.toFixed(2)}%`);
    
    // Output uncovered requirements to console
    const uncoveredRequirements = coverage.requirements.filter(req => !req.covered);
    if (uncoveredRequirements.length > 0) {
      originalConsoleLog('\nUncovered Requirements:');
      uncoveredRequirements.forEach(req => {
        originalConsoleLog(`- ${req.id}: ${req.title} (in ${req.filePath})`);
      });
    }
    
    // Generate Markdown report
    const outputDir = config.default.outputDir || './coverage-reports';
    const outputPath = path.resolve(process.cwd(), outputDir, 'spec-coverage-report.md');
    
    await generateMarkdownReport(coverage, outputPath);
    
  } catch (error) {
    // Restore console for errors
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.error('Error:', error.message);
    process.exit(1);
  }
}

run();
