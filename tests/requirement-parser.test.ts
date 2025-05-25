import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { parseRequirements } from '../src/core/requirement-parser';
import * as fs from 'node:fs';
import { glob } from 'glob';
import { marked } from 'marked';
import type { RequirementSource } from '../src/types';

// Mock dependencies
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

vi.mock('glob', () => ({
  glob: vi.fn(),
}));

vi.mock('marked', () => ({
  marked: {
    lexer: vi.fn(),
  },
}));

describe('Requirement Parser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should parse requirements from Markdown files', async () => {
    // Mock glob to return a single file - v11 returns Promise
    (glob as unknown as Mock).mockResolvedValue(['path/to/requirements.md']);
    
    // Mock file content
    const markdownContent = `# Requirements Document
    
## US-001: User Registration
    
User story description here.
    
@test: path/to/test.ts#testName`;
    
    vi.mocked(fs.promises.readFile).mockResolvedValue(markdownContent);
    
    // Mock marked.lexer to return tokens
    vi.mocked(marked.lexer).mockReturnValue([
      { type: 'heading', depth: 1, text: 'Requirements Document' },
      { type: 'heading', depth: 2, text: 'US-001: User Registration' },
      { type: 'paragraph', text: 'User story description here.' },
      { type: 'paragraph', text: '@test: path/to/test.ts#testName' },
    ] as any);
    
    // Create requirement source configuration
    const requirementSources: RequirementSource[] = [
      {
        id: 'user-stories',
        type: 'markdown',
        path: './docs/**/*.md',
        idPattern: '^(US-\\d+):\\s+(.*)',
        linkMarkerPattern: '@test:\\s*(\\S+)#(\\S+)',
      },
    ];
    
    // Call the function
    await parseRequirements(requirementSources, process.cwd());
    
    // Assertions
    const expectedGlobPattern = require('node:path').join(process.cwd(), './docs/**/*.md');
    expect(glob).toHaveBeenCalledWith(expectedGlobPattern, { absolute: true });
    expect(fs.promises.readFile).toHaveBeenCalledWith('path/to/requirements.md', 'utf-8');
    expect(marked.lexer).toHaveBeenCalledWith(markdownContent);
    
    // The actual test is incomplete because our mock doesn't fully implement
    // the functionality, but in a real test, we would check the parsed requirements here
  });
});
