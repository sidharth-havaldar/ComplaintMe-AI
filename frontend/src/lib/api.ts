import { getSupabaseClient } from "@/lib/supabase";

/**
 * Thin client for the ComplaintMe AI backend REST API.
 *
 * The base URL comes from NEXT_PUBLIC_API_URL (see frontend/.env.example) and
 * falls back to the local backend so development works out of the box. Requests
 * carry the current Supabase access token as a Bearer credential, reusing the
 * shared browser client rather than duplicating authentication logic.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type Complaint = {
  id: string;
  title: string | null;
  description: string;
  current_status: string;
  created_at: string;
  updated_at: string;
  /** Present only on the detail endpoint (GET /complaints/{id}); null while Cortexa is analyzing. */
  ai_analysis?: ComplaintAIAnalysis | null;
};

/** Cortexa's structured analysis of a complaint (AI-001). */
export type ComplaintAIAnalysis = {
  id: string;
  ai_provider: string;
  ai_model: string;
  category: string | null;
  company: string | null;
  product: string | null;
  department: string | null;
  location: string | null;
  sentiment: string | null;
  emotion: string | null;
  severity: string | null;
  priority: string | null;
  summary: string | null;
  language: string | null;
  confidence_score: number | null;
  named_entities: string[];
  /** Decision-support intelligence (AI-002); null for pre-AI-002 analyses. */
  decision_intelligence: DecisionIntelligence | null;
  /** Cross-complaint intelligence (AI-003); null for pre-AI-003 analyses. */
  complaint_intelligence: ComplaintIntelligence | null;
  created_at: string;
};

/** Recommended ownership: primary owner plus supporting teams (AI-002). */
export type DepartmentRecommendation = {
  primary: string | null;
  secondary: string | null;
  optional: string | null;
};

/** Cortexa's "so what should the business do next" layer (AI-002). */
export type DecisionIntelligence = {
  executive_summary: string | null;
  business_impact: string[];
  recommended_department: DepartmentRecommendation | null;
  recommended_actions: string[];
  actionability: string | null;
  reasoning: string | null;
};

/** Cortexa's cross-complaint intelligence — "has this happened before?" (AI-003). */
export type ComplaintIntelligence = {
  similar_count: number;
  similarity_confidence: number;
  trend: string | null;
  pattern: string | null;
  risk_level: string | null;
  executive_insight: string | null;
  business_recommendation: string[];
  health_score: number | null;
  health_reasons: string[];
};

async function buildHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession();

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

/** Create a complaint from a free-text description and return the saved record. */
export async function createComplaint(description: string): Promise<Complaint> {
  const response = await fetch(`${API_BASE_URL}/complaints`, {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create complaint (status ${response.status}).`);
  }

  return (await response.json()) as Complaint;
}

/**
 * Fetch a single complaint by id for its detail page. Read-only; calls the
 * existing GET /complaints/{id} endpoint — no backend or API changes are
 * introduced here. Throws `ComplaintNotFoundError` on 404 so the UI can render
 * a dedicated "not found" state.
 */
export async function getComplaint(id: string): Promise<Complaint> {
  const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
    method: "GET",
    headers: await buildHeaders(),
  });

  if (response.status === 404) {
    throw new ComplaintNotFoundError(id);
  }

  if (!response.ok) {
    throw new Error(`Failed to load complaint (status ${response.status}).`);
  }

  return (await response.json()) as Complaint;
}

/** Raised by {@link getComplaint} when the requested complaint does not exist. */
export class ComplaintNotFoundError extends Error {
  constructor(id: string) {
    super(`Complaint ${id} was not found.`);
    this.name = "ComplaintNotFoundError";
  }
}

/**
 * List the current user's complaints, newest first, for the dashboard's
 * "Recent Complaints" surface. Read-only; calls the existing GET /complaints
 * endpoint — no backend or API changes are introduced here.
 */
export async function listComplaints(): Promise<Complaint[]> {
  const response = await fetch(`${API_BASE_URL}/complaints`, {
    method: "GET",
    headers: await buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load complaints (status ${response.status}).`);
  }

  return (await response.json()) as Complaint[];
}
