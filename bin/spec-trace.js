#!/usr/bin/env node

require('ts-node/register');
const { measureCoverage } = require('../dist');

async function run() {
  const configPath = process.argv[2] || './spec-matcher.config.ts';
  
  try {
    const coverage = await measureCoverage({ configPath });
    
    console.log('Specification Coverage Report:');
    console.log('------------------------------');
    console.log(`Total Requirements: ${coverage.summary.totalRequirements}`);
    console.log(`Covered Requirements: ${coverage.summary.coveredRequirements}`);
    console.log(`Coverage Percentage: ${coverage.summary.coveragePercentage.toFixed(2)}%`);
    
    // Output uncovered requirements
    const uncoveredRequirements = coverage.requirements.filter(req => !req.covered);
    if (uncoveredRequirements.length > 0) {
      console.log('\nUncovered Requirements:');
      uncoveredRequirements.forEach(req => {
        console.log(`- ${req.id}: ${req.title} (in ${req.filePath})`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

run();
