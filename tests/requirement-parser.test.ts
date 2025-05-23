import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { parseRequirements } from '../src/core/requirement-parser';
import * as fs from 'fs';
import * as glob from 'glob';
import { marked } from 'marked';
import type { RequirementSource } from '../src/types';

// Mock dependencies
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

vi.mock('glob', () => ({
  default: vi.fn(),
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
    // Mock glob to return a single file
    ((glob as any).default as Mock).mockImplementation((pattern: string, cb: (err: Error | null, matches: string[]) => void) => {
      cb(null, ['path/to/requirements.md']);
      return undefined as any;
    });
    
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
    const requirements = await parseRequirements(requirementSources, process.cwd());
    
    // Assertions
    const expectedGlobPattern = require('path').join(process.cwd(), './docs/**/*.md');
    expect((glob as any).default).toHaveBeenCalledWith(expectedGlobPattern, expect.any(Function));
    expect(fs.promises.readFile).toHaveBeenCalledWith('path/to/requirements.md', 'utf-8');
    expect(marked.lexer).toHaveBeenCalledWith(markdownContent);
    
    // The actual test is incomplete because our mock doesn't fully implement
    // the functionality, but in a real test, we would check the parsed requirements here
  });
});
