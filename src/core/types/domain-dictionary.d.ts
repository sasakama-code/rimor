/**
 * Domain dictionary and business rule types
 */
import { BaseMetadata, ConfidenceInfo } from './base-types';
export interface DomainTerm {
    id: string;
    term: string;
    aliases?: string[];
    abbreviations?: string[];
    plurals?: string[];
    category?: string;
    type?: 'entity' | 'action' | 'attribute' | 'relationship' | 'constraint' | 'event';
    domain?: string;
    subdomain?: string;
    definition: string;
    description?: string;
    examples?: string[];
    nonExamples?: string[];
    context?: string[];
    relatedTerms?: string[];
    synonyms?: string[];
    antonyms?: string[];
    rules?: string[];
    constraints?: string[];
    validations?: string[];
    technicalName?: string;
    dataType?: string;
    format?: string;
    pattern?: string;
    importance?: 'low' | 'medium' | 'high' | 'critical';
    frequency?: number;
    source?: string;
    references?: string[];
    lastUpdated?: Date;
    version?: string;
    metadata?: BaseMetadata;
}
export interface BusinessRule {
    id: string;
    name: string;
    code?: string;
    type?: 'validation' | 'calculation' | 'constraint' | 'workflow' | 'authorization' | 'other';
    category?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    statement: string;
    conditions?: string[];
    actions?: string[];
    exceptions?: string[];
    implementation?: {
        pseudocode?: string;
        formula?: string;
        algorithm?: string;
        flowchart?: string;
    };
    testScenarios?: TestScenario[];
    acceptanceCriteria?: string[];
    edgeCases?: string[];
    relatedTerms?: string[];
    relatedRules?: string[];
    dependencies?: string[];
    compliance?: {
        standard?: string;
        regulation?: string;
        requirement?: string;
        auditTrail?: boolean;
    };
    owner?: string;
    approvedBy?: string;
    effectiveDate?: Date;
    expiryDate?: Date;
    version?: string;
    metadata?: BaseMetadata;
}
export interface TestScenario {
    id: string;
    name: string;
    description?: string;
    given: string[];
    when: string[];
    then: string[];
    priority?: 'low' | 'medium' | 'high';
    automated?: boolean;
}
export interface DomainDictionary {
    id: string;
    name: string;
    version: string;
    terms: DomainTerm[];
    rules: BusinessRule[];
    relationships?: DomainRelationship[];
    categories?: DomainCategory[];
    domains?: string[];
    glossary?: Map<string, string>;
    language?: string;
    industry?: string;
    organization?: string;
    createdAt?: Date;
    updatedAt?: Date;
    author?: string;
    reviewers?: string[];
    metadata?: BaseMetadata;
}
export interface DomainRelationship {
    id: string;
    type: 'is-a' | 'has-a' | 'uses' | 'depends-on' | 'relates-to' | 'custom';
    source: string;
    target: string;
    cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    required?: boolean;
    bidirectional?: boolean;
    description?: string;
    rules?: string[];
}
export interface DomainCategory {
    id: string;
    name: string;
    description?: string;
    parent?: string;
    children?: string[];
    terms?: string[];
    icon?: string;
    color?: string;
    order?: number;
}
export interface DomainContext {
    dictionary: DomainDictionary;
    activeTerms: Set<string>;
    activeRules: Set<string>;
    confidence: ConfidenceInfo;
    matches?: DomainMatch[];
    violations?: RuleViolation[];
}
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
export interface DomainCoverage {
    totalTerms: number;
    coveredTerms: number;
    uncoveredTerms: string[];
    coverage: number;
    totalRules: number;
    implementedRules: number;
    violatedRules: number;
    compliance: number;
    byCategory?: Map<string, {
        total: number;
        covered: number;
        coverage: number;
    }>;
    suggestions?: string[];
    gaps?: string[];
}
export interface IDomainKnowledgeExtractor {
    extractTerms(content: string): DomainTerm[];
    extractRules(content: string): BusinessRule[];
    extractRelationships(terms: DomainTerm[]): DomainRelationship[];
    buildDictionary(sources: string[]): DomainDictionary;
}
export interface IDomainAnalyzer {
    analyze(content: string, dictionary: DomainDictionary): DomainContext;
    findMatches(content: string, terms: DomainTerm[]): DomainMatch[];
    validateRules(content: string, rules: BusinessRule[]): RuleViolation[];
    calculateCoverage(matches: DomainMatch[], dictionary: DomainDictionary): DomainCoverage;
}
//# sourceMappingURL=domain-dictionary.d.ts.map