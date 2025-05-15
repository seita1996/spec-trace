import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as originalPath from 'path';
import { loadConfigFromFile } from '../src/core/config-loader';

// Mock the importer module and its function
// The factory function for vi.mock is hoisted, so it cannot reference variables defined later in the same scope.
// Instead, we define the mock function directly within the factory.
// We will then import the mocked function to control it in tests.
vi.mock('../src/core/importer', () => ({
  dynamicImportWrapper: vi.fn(),
}));

// We need to import the mocked function after vi.mock has been declared.
// This is a bit tricky with static imports. A dynamic import for the test setup might be cleaner,
// or we rely on Vitest's module cache. For now, let's assume direct import works post-mock.
// If not, we might need to dynamically import `dynamicImportWrapper` from '../src/core/importer' within tests.
// For simplicity, we'll try to import it and assume Vitest handles the mocked version.
import { dynamicImportWrapper as mockedDynamicImportWrapper } from '../src/core/importer';


// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  promises: {
    readFile: vi.fn(),
  },
}));

// Mock path module
vi.mock('path', async (importActual) => {
  const actualPath = await importActual<typeof path>();
  return {
    ...actualPath,
    isAbsolute: vi.fn().mockImplementation(actualPath.isAbsolute),
    resolve: vi.fn().mockImplementation(actualPath.resolve),
  };
});


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

describe('Config Loader', () => {
  afterEach(() => {
    vi.restoreAllMocks(); // Use restoreAllMocks to reset spies and mocks
  });

  it('should load configuration from a TypeScript file', async () => {
    const configPath = '../examples/spec-matcher.config.ts';
    // If path.isAbsolute(configPath) is true, then absolutePath in SUT will be configPath.
    const expectedAbsolutePath = configPath;

    // Mock path.isAbsolute to return true for our specific configPath
    vi.mocked(path.isAbsolute).mockImplementation(p => p === configPath);
    // path.resolve should not be called if isAbsolute is true for configPath
    // Default mock for path.resolve from vi.mock('path',...) will use actual if not overridden here.

    // Mock fs.existsSync to return true for the expected absolute path
    vi.mocked(fs.existsSync).mockImplementation(p => p === expectedAbsolutePath);

    // Reset the mock before each call if needed, or set specific behavior
    vi.mocked(mockedDynamicImportWrapper).mockResolvedValue(mockConfig);

    const loadedConfig = await loadConfigFromFile(configPath);

    expect(path.isAbsolute).toHaveBeenCalledWith(configPath);
    expect(fs.existsSync).toHaveBeenCalledWith(expectedAbsolutePath);
    expect(mockedDynamicImportWrapper).toHaveBeenCalledWith(expectedAbsolutePath);
    expect(loadedConfig).toEqual(mockConfig.default);
  });

  it('should return null when file does not exist', async () => {
    const nonExistentPath = 'non-existent-config.ts';
    const expectedResolvedPath = originalPath.resolve(process.cwd(), nonExistentPath);

    // Mock path.isAbsolute to return false for nonExistentPath
    vi.mocked(path.isAbsolute).mockImplementation(p => p !== nonExistentPath);
    // Mock path.resolve to return our expectedResolvedPath for nonExistentPath
    vi.mocked(path.resolve).mockImplementation((base, p) => {
      if (p === nonExistentPath) return expectedResolvedPath;
      return originalPath.resolve(base, p); // Fallback
    });

    // Mock fs.existsSync to return false for the expected resolved path
    vi.mocked(fs.existsSync).mockImplementation(p => p !== expectedResolvedPath);
    
    // Reset or clear mocks for dynamicImportWrapper if necessary,
    // though for this test it shouldn't be called.
    vi.mocked(mockedDynamicImportWrapper).mockClear(); // Clear previous calls for this assertion

    const loadedConfig = await loadConfigFromFile(nonExistentPath);

    expect(path.isAbsolute).toHaveBeenCalledWith(nonExistentPath);
    expect(path.resolve).toHaveBeenCalledWith(process.cwd(), nonExistentPath);
    expect(fs.existsSync).toHaveBeenCalledWith(expectedResolvedPath);
    expect(mockedDynamicImportWrapper).not.toHaveBeenCalled();
    expect(loadedConfig).toBeNull();
  });
});
