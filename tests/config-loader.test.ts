import { describe, it, expect } from 'vitest';
import { loadConfigFromFile } from '../src/core/config-loader';
import * as path from 'path';

describe('loadConfigFromFile', () => {
  it('should load configuration from existing example file', async () => {
    const configPath = path.join(__dirname, '..', 'examples', 'spec-matcher.config.ts');
    const result = await loadConfigFromFile(configPath);

    expect(result).not.toBeNull();
    expect(result?.requirements).toBeDefined();
    expect(result?.tests).toBeDefined();
    expect(result?.baseDir).toBeDefined();
    expect(Array.isArray(result?.requirements)).toBe(true);
    expect(Array.isArray(result?.tests)).toBe(true);
  });

  it('should return null for non-existent file', async () => {
    const result = await loadConfigFromFile('./non-existent-config.ts');
    expect(result).toBeNull();
  });
});
