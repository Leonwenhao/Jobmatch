// Core data types for JobMatch

export interface ParsedResume {
  jobTitles: string[];
  skills: string[];
  yearsExperience: number | null;
  location: string | null;
  industries: string[];
  education: string | null;
  jobTypes: ('full-time' | 'part-time' | 'contract' | 'remote')[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  salary?: string;
  description?: string;
  source: 'adzuna';
}

export interface Session {
  id: string;
  email: string;
  resumeText: string;
  parsedResume?: ParsedResume;
  jobs?: Job[];
  status: 'pending' | 'paid' | 'processing' | 'complete' | 'failed';
  createdAt: Date;
}

export interface UploadResponse {
  sessionId: string;
  message: string;
}

export interface CheckoutRequest {
  sessionId: string;
  email: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface ResultsResponse {
  status: 'ready' | 'processing' | 'failed';
  jobs?: Job[];
  emailStatus?: 'queued' | 'sent' | 'failed';
}
