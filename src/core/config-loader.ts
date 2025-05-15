import * as fs from 'fs';
import * as path from 'path';
import type { Config } from '../types';

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

    // Try to dynamically import the configuration
    // Note: This requires ts-node/register for .ts files
    let config: Config;

    // Check if it's a TypeScript file
    if (absolutePath.endsWith('.ts')) {
      try {
        // Try to load ts-node
        require('ts-node/register');
      } catch (error) {
        throw new Error(
          'ts-node is required to load TypeScript configuration files. Please install it as a dependency.'
        );
      }
    }

    // Dynamic import the configuration file
    const importedConfig = await import(absolutePath);
    config = importedConfig.default;

    // Basic validation
    if (!config) {
      throw new Error('Configuration file does not export a default configuration object');
    }

    if (!Array.isArray(config.requirements) || !Array.isArray(config.tests)) {
      throw new Error('Configuration must include requirements and tests arrays');
    }

    return config;
  } catch (error) {
    console.error('Error loading configuration:', error);
    return null;
  }
}
