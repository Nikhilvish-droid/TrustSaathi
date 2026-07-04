/** AI document upload — types matching /api/extract and /api/ai/upload contracts. */

export type ExtractedDonationRow = {
  donor_name: string | null;
  amount: number | null;
  date: string | null;
  payment_mode: string | null;
  confidence_score?: number;
  duplicate_flag?: boolean;
  similar_to?: string | null;
  /** Populated by backend enrich step for review UI */
  _missing_fields?: string[];
  _low_confidence?: boolean;
};

export type AiAnalysis = {
  is_complete: boolean;
  missing_fields: string[];
};

export type ExtractResponse = {
  status: 'success' | string;
  document_type: string;
  organization_id?: string;
  ai_analysis: AiAnalysis;
  extracted_data: ExtractedDonationRow[];
};

export type ReviewDonationRow = ExtractedDonationRow & {
  id: string;
};

export type RecordStatus = 'completed' | 'draft';

export type UploadDonationRow = {
  donor_name: string | null;
  amount: number | null;
  date: string | null;
  payment_mode: string | null;
  confidence_score?: number;
  missing_fields?: string[];
  phone?: string | null;
  pan?: string | null;
};

export type UploadPayload = {
  organization_id: string;
  document_type: string;
  record_status: RecordStatus;
  is_frontend_corrected: true;
  manual_review_required: boolean;
  status: 'success';
  data: UploadDonationRow[];
};

export type UploadResponse = {
  message: string;
  record_status: RecordStatus;
  records_processed: number;
  donation_ids: string[];
};

export type ActionRequiredResponse = {
  status: 'action_required';
  message: string;
  missing_fields: string[];
  raw_data: ExtractedDonationRow[];
};

export const CRITICAL_FIELDS = ['donor_name', 'amount', 'date', 'payment_mode'] as const;
export type CriticalField = (typeof CRITICAL_FIELDS)[number];

export const LOW_CONFIDENCE_THRESHOLD = 0.85;

export const PAYMENT_MODES = ['UPI', 'Cash', 'Bank Transfer', 'Cheque', 'Card', 'Unknown'] as const;
