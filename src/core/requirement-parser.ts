import * as fs from 'fs';
import glob from 'glob';
import { marked } from 'marked';
import type { Requirement, RequirementSource } from '../types';

/**
 * Parses requirements from Markdown files based on the configuration.
 *
 * @param requirementSources Array of requirement source configurations
 * @returns Array of parsed requirements
 */
export async function parseRequirements(
  requirementSources: RequirementSource[]
): Promise<Requirement[]> {
  const allRequirements: Requirement[] = [];

  for (const source of requirementSources) {
    const files = await findFiles(source.path);

    for (const filePath of files) {
      const requirements = await parseRequirementsFromFile(filePath, source);
      allRequirements.push(...requirements);
    }
  }

  return allRequirements;
}

/**
 * Finds files matching the specified glob pattern.
 *
 * @param pattern Glob pattern to match files
 * @returns Array of matching file paths
 */
async function findFiles(pattern: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(pattern, (err, matches) => {
      if (err) {
        reject(err);
      } else {
        resolve(matches);
      }
    });
  });
}

/**
 * Parses requirements from a single Markdown file.
 *
 * @param filePath Path to the Markdown file
 * @param source Requirement source configuration
 * @returns Array of parsed requirements
 */
async function parseRequirementsFromFile(
  filePath: string,
  source: RequirementSource
): Promise<Requirement[]> {
  const requirements: Requirement[] = [];
  const fileContent = await fs.promises.readFile(filePath, 'utf-8');

  // Parse the Markdown content into tokens
  const tokens = marked.lexer(fileContent);

  // Extract requirements based on idPattern
  if (source.idPattern) {
    const regex = new RegExp(source.idPattern);

    // Process heading tokens
    for (const token of tokens) {
      if (token.type === 'heading') {
        const match = token.text.match(regex);

        if (match && match.length >= 3) {
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
                requirement.linkedTests.push({
                  filePath: linkMatch[1],
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
