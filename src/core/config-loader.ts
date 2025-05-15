import * as fs from 'fs';
import * as path from 'path';
import type { Config } from '../types';
import { dynamicImportWrapper } from './importer';

/**
 * Loads configuration from a TypeScript file.
 * Uses dynamic import to load the configuration.
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

    // Dynamic import the configuration file
    // Vitest handles TypeScript compilation, so ts-node/register is not needed here for tests.
    // For actual CLI execution, ensure ts-node or a similar mechanism is used if running .ts directly.
    const importedConfigModule = await dynamicImportWrapper(absolutePath);
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
