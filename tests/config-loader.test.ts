import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadConfigFromFile } from '../src/core/config-loader';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs and path modules
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  promises: {
    readFile: vi.fn(),
  },
}));

vi.mock('path', () => ({
  isAbsolute: vi.fn(),
  resolve: vi.fn(),
}));

// Mock dynamic import
const mockConfig = {
  default: {
    requirements: [
      {
        id: 'test-requirements',
        type: 'markdown',
        path: './docs/**/*.md',
      },
    ],
    tests: [
      {
        id: 'test-tests',
        type: 'vitest',
        path: './src/**/*.test.ts',
      },
    ],
  },
};

vi.mock('../examples/spec-matcher.config.ts', () => mockConfig, { virtual: true });

describe('Config Loader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementations
    vi.mocked(path.isAbsolute).mockReturnValue(false);
    vi.mocked(path.resolve).mockImplementation((_, p) => `/absolute/${p}`);
    vi.mocked(fs.existsSync).mockReturnValue(true);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should load configuration from a TypeScript file', async () => {
    const configPath = '../examples/spec-matcher.config.ts';
    const absolutePath = '/absolute/examples/spec-matcher.config.ts';
    
    vi.mocked(path.resolve).mockReturnValue(absolutePath);
    
    const config = await loadConfigFromFile(configPath);
    
    expect(path.isAbsolute).toHaveBeenCalledWith(configPath);
    expect(path.resolve).toHaveBeenCalledWith(process.cwd(), configPath);
    expect(fs.existsSync).toHaveBeenCalledWith(absolutePath);
    
    expect(config).toEqual(mockConfig.default);
  });
  
  it('should return null when file does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    
    const config = await loadConfigFromFile('non-existent-config.ts');
    
    expect(config).toBeNull();
  });
});