/**
 * Utility functions for handling dependencies in OWASP plugins
 */

import { ProjectContext } from '../../../core/types';

/**
 * Check if a specific dependency exists in the project
 */
export function hasDependency(
  context: ProjectContext, 
  dependencyName: string
): boolean {
  const deps = context.dependencies;
  
  if (!deps) return false;
  
  if (Array.isArray(deps)) {
    return deps.includes(dependencyName);
  } else if (typeof deps === 'object') {
    return dependencyName in deps;
  }
  
  return false;
}

/**
 * Check if any of the specified dependencies exist
 */
export function hasAnyDependency(
  context: ProjectContext,
  dependencyNames: string[]
): boolean {
  return dependencyNames.some(dep => hasDependency(context, dep));
}

/**
 * Check if dependency name contains any of the specified patterns
 */
export function hasDependencyPattern(
  context: ProjectContext,
  patterns: string[]
): boolean {
  const deps = context.dependencies;
  
  if (!deps) return false;
  
  if (Array.isArray(deps)) {
    return deps.some(dep => 
      patterns.some(pattern => dep.includes(pattern))
    );
  } else if (typeof deps === 'object') {
    const depNames = Object.keys(deps);
    return depNames.some(dep => 
      patterns.some(pattern => dep.includes(pattern))
    );
  }
  
  return false;
}

/**
 * Get all dependency names from the context
 */
export function getDependencyNames(context: ProjectContext): string[] {
  const deps = context.dependencies;
  
  if (!deps) return [];
  
  if (Array.isArray(deps)) {
    return deps;
  } else if (typeof deps === 'object') {
    return Object.keys(deps);
  }
  
  return [];
}

/**
 * Get dependency version (for object-based dependencies)
 */
export function getDependencyVersion(
  context: ProjectContext,
  dependencyName: string
): string | undefined {
  const deps = context.dependencies;
  
  if (!deps || Array.isArray(deps)) return undefined;
  
  if (typeof deps === 'object') {
    return deps[dependencyName];
  }
  
  return undefined;
}