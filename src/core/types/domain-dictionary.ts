/**
 * Domain dictionary and business rule types
 */

import { BaseMetadata, ConfidenceInfo } from './base-types';

// Domain term
export interface DomainTerm {
  // Identification
  id: string;
  term: string;
  
  // Variations
  aliases?: string[];
  abbreviations?: string[];
  plurals?: string[];
  
  // Classification
  category?: string;
  type?: 'entity' | 'action' | 'attribute' | 'relationship' | 'constraint' | 'event';
  domain?: string;
  subdomain?: string;
  
  // Definition
  definition: string;
  description?: string;
  examples?: string[];
  nonExamples?: string[];
  
  // Context
  context?: string[];
  relatedTerms?: string[];
  synonyms?: string[];
  antonyms?: string[];
  
  // Business rules
  rules?: string[];
  constraints?: string[];
  validations?: string[];
  
  // Technical mapping
  technicalName?: string;
  dataType?: string;
  format?: string;
  pattern?: string;
  
  // Importance
  importance?: 'low' | 'medium' | 'high' | 'critical';
  frequency?: number; // Usage frequency
  
  // Metadata
  source?: string;
  references?: string[];
  lastUpdated?: Date;
  version?: string;
  metadata?: BaseMetadata;
}

// Business rule
export interface BusinessRule {
  // Identification
  id: string;
  name: string;
  code?: string; // Rule code for reference
  
  // Classification
  type?: 'validation' | 'calculation' | 'constraint' | 'workflow' | 'authorization' | 'other';
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  
  // Definition
  description: string;
  statement: string; // Formal rule statement
  conditions?: string[];
  actions?: string[];
  exceptions?: string[];
  
  // Implementation
  implementation?: {
    pseudocode?: string;
    formula?: string;
    algorithm?: string;
    flowchart?: string;
  };
  
  // Testing
  testScenarios?: TestScenario[];
  acceptanceCriteria?: string[];
  edgeCases?: string[];
  
  // Related entities
  relatedTerms?: string[];
  relatedRules?: string[];
  dependencies?: string[];
  
  // Compliance
  compliance?: {
    standard?: string;
    regulation?: string;
    requirement?: string;
    auditTrail?: boolean;
  };
  
  // Metadata
  owner?: string;
  approvedBy?: string;
  effectiveDate?: Date;
  expiryDate?: Date;
  version?: string;
  metadata?: BaseMetadata;
}

// Test scenario for business rules
export interface TestScenario {
  id: string;
  name: string;
  description?: string;
  given: string[]; // Preconditions
  when: string[]; // Actions
  then: string[]; // Expected outcomes
  priority?: 'low' | 'medium' | 'high';
  automated?: boolean;
}

// Domain dictionary
export interface DomainDictionary {
  // Identification
  id: string;
  name: string;
  version: string;
  
  // Content
  terms: DomainTerm[];
  rules: BusinessRule[];
  relationships?: DomainRelationship[];
  
  // Organization
  categories?: DomainCategory[];
  domains?: string[];
  glossary?: Map<string, string>; // Quick lookup
  
  // Metadata
  language?: string;
  industry?: string;
  organization?: string;
  createdAt?: Date;
  updatedAt?: Date;
  author?: string;
  reviewers?: string[];
  metadata?: BaseMetadata;
}

// Domain relationship
export interface DomainRelationship {
  id: string;
  type: 'is-a' | 'has-a' | 'uses' | 'depends-on' | 'relates-to' | 'custom';
  source: string; // Term ID
  target: string; // Term ID
  cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  required?: boolean;
  bidirectional?: boolean;
  description?: string;
  rules?: string[];
}

// Domain category
export interface DomainCategory {
  id: string;
  name: string;
  description?: string;
  parent?: string; // Parent category ID
  children?: string[]; // Child category IDs
  terms?: string[]; // Term IDs in this category
  icon?: string;
  color?: string;
  order?: number;
}

// Domain context for analysis
export interface DomainContext {
  dictionary: DomainDictionary;
  activeTerms: Set<string>; // Currently relevant terms
  activeRules: Set<string>; // Currently applicable rules
  confidence: ConfidenceInfo;
  matches?: DomainMatch[];
  violations?: RuleViolation[];
}

// Domain match in code
export interface DomainMatch {
  termId: string;
  term: string;
  location: {
    file: string;
    line: number;
    column: number;
    text: string;
  };
  confidence: number;
  type: 'exact' | 'partial' | 'semantic' | 'inferred';
  context?: string;
}

// Business rule violation
export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  location: {
    file: string;
    line: number;
    column?: number;
  };
  suggestion?: string;
  autoFixable?: boolean;
}

// Domain coverage metrics
export interface DomainCoverage {
  totalTerms: number;
  coveredTerms: number;
  uncoveredTerms: string[];
  coverage: number; // Percentage
  
  totalRules: number;
  implementedRules: number;
  violatedRules: number;
  compliance: number; // Percentage
  
  byCategory?: Map<string, {
    total: number;
    covered: number;
    coverage: number;
  }>;
  
  suggestions?: string[];
  gaps?: string[];
}

// Domain knowledge extractor interface
export interface IDomainKnowledgeExtractor {
  extractTerms(content: string): DomainTerm[];
  extractRules(content: string): BusinessRule[];
  extractRelationships(terms: DomainTerm[]): DomainRelationship[];
  buildDictionary(sources: string[]): DomainDictionary;
}

// Domain analyzer interface
export interface IDomainAnalyzer {
  analyze(content: string, dictionary: DomainDictionary): DomainContext;
  findMatches(content: string, terms: DomainTerm[]): DomainMatch[];
  validateRules(content: string, rules: BusinessRule[]): RuleViolation[];
  calculateCoverage(matches: DomainMatch[], dictionary: DomainDictionary): DomainCoverage;
}