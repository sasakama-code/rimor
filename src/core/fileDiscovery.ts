import { readdir } from 'fs/promises';
import { resolve } from 'path';

export async function* findTestFiles(
  dir: string,
  excludePatterns: string[] = []
): AsyncGenerator<string> {
  const dirents = await readdir(dir, { withFileTypes: true });
  
  for (const dirent of dirents) {
    const path = resolve(dir, dirent.name);
    
    if (excludePatterns.some(p => path.includes(p))) continue;
    
    if (dirent.isDirectory()) {
      if (dirent.name === '__tests__') {
        const nestedDirents = await readdir(path, { withFileTypes: true });
        for (const nested of nestedDirents) {
          if (nested.isFile()) {
            yield resolve(path, nested.name);
          }
        }
      } else {
        yield* findTestFiles(path, excludePatterns);
      }
    } else if (isTestFile(dirent.name)) {
      yield path;
    }
  }
}

export function isTestFile(filename: string): boolean {
  return /\.(test|spec)\.(js|ts)$/.test(filename);
}