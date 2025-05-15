import * as fs from 'fs';
import glob from 'glob';
import { marked } from 'marked';
import type { Requirement, RequirementSource } from '../types';
import * as path from 'path';

/**
 * Parses requirements from Markdown files based on the configuration.
 *
 * @param requirementSources Array of requirement source configurations
 * @param baseDir The base directory for resolving relative paths
 * @returns Array of parsed requirements
 */
export async function parseRequirements(
  requirementSources: RequirementSource[],
  baseDir: string
): Promise<Requirement[]> {
  console.log(`[requirement-parser] Starting parseRequirements. baseDir: ${baseDir}`, requirementSources);
  const allRequirements: Requirement[] = [];

  for (const source of requirementSources) {
    console.log(`[requirement-parser] Processing requirement source: ${source.id}, path: ${source.path}`);
    const files = await findFiles(source.path, baseDir);

    for (const filePath of files) {
      // filePath from findFiles is already absolute
      const requirements = await parseRequirementsFromFile(filePath, source, baseDir);
      allRequirements.push(...requirements);
    }
  }

  return allRequirements;
}

/**
 * Finds files matching the specified glob pattern.
 *
 * @param pattern Glob pattern to match files
 * @param baseDir The base directory for resolving the pattern
 * @returns Array of matching file paths
 */
async function findFiles(pattern: string, baseDir: string): Promise<string[]> {
  console.log(`[requirement-parser] findFiles called with pattern: ${pattern}, baseDir: ${baseDir}`);
  return new Promise((resolve, reject) => {
    // Resolve the pattern against the base directory
    const absolutePattern = path.isAbsolute(pattern) ? pattern : path.join(baseDir, pattern);
    console.log(`[requirement-parser] Globbing with absolute pattern: ${absolutePattern}`);
    glob(absolutePattern, (err, matches) => {
      if (err) {
        console.error(`[requirement-parser] Error in glob: ${err}`);
        reject(err);
      } else {
        console.log(`[requirement-parser] Glob found matches:`, matches);
        resolve(matches);
      }
    });
  });
}

/**
 * Parses requirements from a single Markdown file.
 *
 * @param filePath Path to the Markdown file (should be absolute)
 * @param source Requirement source configuration
 * @param baseDir The base directory for resolving relative paths within the requirement file
 * @returns Array of parsed requirements
 */
async function parseRequirementsFromFile(
  filePath: string, // This filePath is already absolute from findFiles
  source: RequirementSource,
  baseDir: string // baseDir of the config file, used for resolving linked test paths
): Promise<Requirement[]> {
  console.log(`[requirement-parser] parseRequirementsFromFile called for: ${filePath}`);
  const requirements: Requirement[] = [];
  const fileContent = await fs.promises.readFile(filePath, 'utf-8');

  // Parse the Markdown content into tokens
  const tokens = marked.lexer(fileContent);
  console.log(`[requirement-parser] Tokens for ${filePath}:`, JSON.stringify(tokens.slice(0, 5), null, 2)); // Log first 5 tokens

  // Extract requirements based on idPattern
  if (source.idPattern) {
    const regex = new RegExp(source.idPattern);
    console.log(`[requirement-parser] Using idPattern: ${source.idPattern} for ${filePath}`);

    // Process heading tokens
    for (const token of tokens) {
      console.log(`[requirement-parser] Processing token: type=${token.type}, text=${(token as any).text?.substring(0,50)}`);
      if (token.type === 'heading') {
        console.log(`[requirement-parser] Found heading token: depth=${token.depth}, text=${token.text}`);
        const match = token.text.match(regex);
        console.log(`[requirement-parser] Regex match result for "${token.text}" with pattern "${source.idPattern}":`, match);

        if (match && match.length >= 3) {
          console.log(`[requirement-parser] Matched requirement: id=${match[1]}, title=${match[2]}`);
          const id = match[1];
          const title = match[2];

          // Find the description (all content until the next heading of the same or higher level)
          const description = '';
          const headingLevel = token.depth;
          console.log(headingLevel);

          // Find description by collecting text until next heading of same or higher level
          // This is a simplified approach; a more robust implementation would parse the AST

          const requirement: Requirement = {
            id,
            title,
            description,
            filePath,
            linkedTests: [],
          };

          // Find linked tests if linkMarkerPattern is provided
          if (source.linkMarkerPattern) {
            const linkRegex = new RegExp(source.linkMarkerPattern, 'g');
            let linkMatch = linkRegex.exec(fileContent);

            while (linkMatch !== null) {
              if (linkMatch.length >= 3) {
                // Resolve linked test file path relative to the config's baseDir
                const linkedTestPath = path.resolve(baseDir, linkMatch[1]);
                requirement.linkedTests.push({
                  filePath: linkedTestPath,
                  caseName: linkMatch[2],
                });
              }
              linkMatch = linkRegex.exec(fileContent);
            }
          }

          requirements.push(requirement);
        }
      }
    }
  }

  return requirements;
}
