import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Config } from '../types';

/**
 * Loads configuration from a TypeScript file.
 * Uses require with ts-node to load TypeScript configuration files.
 *
 * @param configPath Path to the configuration file
 * @returns Loaded configuration object or null if loading fails
 */
export async function loadConfigFromFile(configPath: string): Promise<Config | null> {
  try {
    // Ensure the path is absolute
    const absolutePath = path.isAbsolute(configPath)
      ? configPath
      : path.resolve(process.cwd(), configPath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Configuration file not found at ${absolutePath}`);
    }

    // Use require to load the configuration file (ts-node handles .ts files)
    // Clear the require cache to ensure fresh loading
    delete require.cache[require.resolve(absolutePath)];

    const importedConfigModule = require(absolutePath);
    const baseConfig: Omit<Config, 'baseDir'> = importedConfigModule.default;

    // Basic validation
    if (!baseConfig) {
      throw new Error('Configuration file does not export a default configuration object');
    }

    if (!Array.isArray(baseConfig.requirements) || !Array.isArray(baseConfig.tests)) {
      throw new Error('Configuration must include requirements and tests arrays');
    }

    const config: Config = {
      ...baseConfig,
      baseDir: path.dirname(absolutePath),
    };

    return config;
  } catch (error) {
    console.error('Error loading configuration:', error);
    return null;
  }
}
