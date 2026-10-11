import {
  SubmissionResponse,
  CaseSummary,
  CaseDetail,
  GraphResponse,
  SystemStats,
  AuditEvent,
  RuleConfigItem,
  UserProfile,
  CaseStatus,
  RiskCategory
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('scamshield_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('scamshield_token', token);
  } else {
    localStorage.removeItem('scamshield_token');
  }
}

export function getStoredUser(): UserProfile | null {
  const data = localStorage.getItem('scamshield_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfile | null) {
  if (user) {
    localStorage.setItem('scamshield_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('scamshield_user');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'An error occurred during the request.';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.error || JSON.stringify(errJson);
    } catch {
      errorDetail = `${response.status} ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Submission
  async submitEvidence(payload: {
    evidence_items: Array<{
      evidence_type: string;
      content: string;
      sender_or_source?: string;
    }>;
    user_notes?: string;
    consent_to_analyze?: boolean;
  }): Promise<SubmissionResponse> {
    return request<SubmissionResponse>('/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Case Management
  async listCases(params?: {
    status?: CaseStatus;
    risk?: RiskCategory;
    search?: string;
  }): Promise<CaseSummary[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.risk) query.append('risk', params.risk);
    if (params?.search) query.append('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<CaseSummary[]>(`/cases${qs}`);
  },

  async getCaseByReference(caseRef: string): Promise<CaseDetail> {
    return request<CaseDetail>(`/cases/ref/${encodeURIComponent(caseRef)}`);
  },

  async getCaseById(caseId: number): Promise<CaseDetail> {
    return request<CaseDetail>(`/cases/${caseId}`);
  },

  async addAnalystNote(caseId: number, content: string): Promise<any> {
    return request(`/cases/${caseId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async updateCaseStatus(caseId: number, new_status: CaseStatus, reason: string): Promise<CaseDetail> {
    return request<CaseDetail>(`/cases/${caseId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ new_status, reason }),
    });
  },

  async deleteCase(caseId: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/cases/${caseId}`, {
      method: 'DELETE',
    });
  },

  async updateCaseLanguage(caseId: number, language: string): Promise<CaseDetail> {
    return request<CaseDetail>(`/cases/${caseId}/language?language=${encodeURIComponent(language)}`, {
      method: 'PATCH',
    });
  },

  // Graph
  async getGraph(caseId?: number): Promise<GraphResponse> {
    const qs = caseId ? `?case_id=${caseId}` : '';
    return request<GraphResponse>(`/graph${qs}`);
  },

  // Auth
  async firebaseLogin(idToken: string): Promise<any> {
    return request('/auth/firebase-login', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    });
  },

  // Auth
  async login(username: string, password: string): Promise<{
    access_token: string;
    user_id: number;
    username: string;
    full_name: string;
    role: 'analyst' | 'admin';
  }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async getCurrentUser(): Promise<UserProfile> {
    return request<UserProfile>('/auth/me');
  },

  // Admin & Telemetry
  async getAdminStats(): Promise<SystemStats> {
    return request<SystemStats>('/admin/stats');
  },

  async getAuditLogs(): Promise<AuditEvent[]> {
    return request<AuditEvent[]>('/admin/audit-logs');
  },

  async getRules(): Promise<RuleConfigItem[]> {
    return request<RuleConfigItem[]>('/admin/rules');
  },

  async checkHealth(): Promise<any> {
    return request('/health');
  }
};
