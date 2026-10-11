export type RiskCategory = 'low' | 'medium' | 'high' | 'critical';
export type UncertaintyLevel = 'low' | 'moderate' | 'high';
export type CaseStatus = 
  | 'pending_review' 
  | 'in_investigation' 
  | 'verified_scam' 
  | 'inconclusive' 
  | 'false_positive' 
  | 'closed_resolved';

export interface DetectionIndicator {
  id?: number;
  rule_id: string;
  rule_name: string;
  category: string;
  severity: RiskCategory;
  score_contribution: number;
  explanation: string;
  matched_value?: string;
  confidence: number;
  created_at?: string;
}

export interface EvidenceItem {
  id?: number;
  case_id?: number;
  evidence_type: string;
  raw_content: string;
  normalized_content?: string;
  extracted_entities?: any;
  source_metadata?: any;
  created_at?: string;
}

export interface AnalystNote {
  id: number;
  case_id: number;
  author_id?: number;
  author_username: string;
  content: string;
  created_at: string;
}

export interface CaseReviewAction {
  id: number;
  case_id: number;
  actor_id?: number;
  actor_username: string;
  previous_status: string;
  new_status: string;
  reason: string;
  created_at: string;
}

export interface CaseSummary {
  id: number;
  case_reference: string;
  title: string;
  status: CaseStatus;
  risk_category: RiskCategory;
  risk_score: number;
  uncertainty_level: UncertaintyLevel;
  primary_threat_type: string;
  indicator_count: number;
  evidence_count: number;
  created_at: string;
  updated_at: string;
}

export interface CaseDetail {
  id: number;
  case_reference: string;
  title: string;
  summary?: string;
  status: CaseStatus;
  risk_category: RiskCategory;
  risk_score: number;
  uncertainty_level: UncertaintyLevel;
  primary_threat_type: string;
  confidence_score: number;
  reporter_notes?: string;
  safe_recommendations: string[];
  source_language?: string;
  language_confidence?: number;
  translations?: Record<string, string>;
  owner_id?: number | null;
  created_at: string;
  updated_at: string;
  evidences: EvidenceItem[];
  indicators: DetectionIndicator[];
  notes: AnalystNote[];
  review_actions: CaseReviewAction[];
}

export interface SubmissionResponse {
  case_reference: string;
  case_id: number;
  title: string;
  summary: string;
  risk_category: RiskCategory;
  risk_score: number;
  uncertainty_level: UncertaintyLevel;
  primary_threat_type: string;
  confidence_score: number;
  indicators: DetectionIndicator[];
  safe_recommendations: string[];
  source_language?: string;
  language_confidence?: number;
  translations?: Record<string, string>;
  created_at: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'case' | 'upi' | 'phone' | 'url' | 'modus_operandi';
  risk_category?: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  relationship_type: string;
  is_inferred: boolean;
  justification: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_connected_cases: number;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'user' | 'analyst' | 'admin';
  preferred_language?: string;
  is_active: boolean;
  created_at: string;
}

export interface SystemStats {
  total_cases: number;
  pending_cases: number;
  investigating_cases: number;
  verified_scams: number;
  inconclusive_cases: number;
  false_positives: number;
  critical_risk_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  total_evidences: number;
  total_indicators_flagged: number;
  total_relationships: number;
  threat_breakdown: Record<string, number>;
}

export interface AuditEvent {
  id: number;
  action_type: string;
  actor_username: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface RuleConfigItem {
  rule_id: string;
  name: string;
  category: string;
  base_weight: number;
  severity: string;
  description: string;
  enabled: boolean;
}
