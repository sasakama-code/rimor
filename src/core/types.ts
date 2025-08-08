/**
 * Legacy type definitions file
 * 
 * DEPRECATED: This file is maintained for backward compatibility only.
 * All type definitions have been moved to the ./types directory for better organization.
 * 
 * Migration guide:
 * - Basic types: import from './core/types/base-types'
 * - Project types: import from './core/types/project-context'
 * - Plugin types: import from './core/types/plugin-interface'
 * - Analysis types: import from './core/types/analysis-result'
 * - Quality types: import from './core/types/quality-score'
 * - Improvement types: import from './core/types/improvements'
 * - Domain types: import from './core/types/domain-dictionary'
 * - Type guards: import from './core/types/type-guards'
 * - Or use the index for all types: import from './core/types'
 * 
 * This file will be removed in version 3.0.0.
 */

// Re-export everything from the new type definitions for backward compatibility
export * from './types';