export interface MaterialItem {
  quantity: string;
  weight: string;
  description: string;
  unit_price: string;
  total: string;
}

export interface JobData {
  customer_name: string;
  customer_address: string;
  account_number: string;
  person_to_see: string;
  terms: string;
}

export interface FormData extends JobData {
  date_of_call: string;
  special_instructions: string;
  time_in: string;
  time_out: string;
  materials: MaterialItem[];
  gc_signature: string;
  tech_signature: string;
  subtotal: number;
  tax: number;
  total: number;
}

export interface Job {
  id: number;
  share_token: string;
  customer_name: string;
  customer_address: string;
  account_number: string;
  person_to_see: string;
  terms: string;
  created_at: string;
  is_active: boolean;
  share_link: string;
}

export interface Submission {
  id: number;
  job_id: number;
  share_token: string;
  customer_name: string;
  date_of_call: string;
  submitted_at: string;
  pdf_filename: string | null;
  uploaded_to_projectsight: boolean;
  emailed: boolean;
}

export interface SubmissionDetail extends Submission {
  customer_address: string;
  account_number: string;
  person_to_see: string;
  terms: string;
  special_instructions: string;
  time_in: string;
  time_out: string;
  materials: MaterialItem[];
  photos: string[];
  upload_notes: string;
  subtotal: number;
  tax: number;
  total: number;
}


export interface UploadConfig {
  upload_to_projectsight: boolean;
  send_email: boolean;
  email_to?: string;
}

// Manpower Forecast Types
export interface Project {
  id: number;
  job_number: string;
  job_name: string;
  designer: string | null;
  superintendent: string | null;
  total_labor_hours: number;
  labor_budget: number;
  created_at: string;
}

export interface ProjectCreate {
  job_number: string;
  job_name: string;
  designer?: string;
  superintendent?: string;
  total_labor_hours: number;
  labor_budget: number;
}

export interface ProjectUpdate {
  job_number?: string;
  job_name?: string;
  designer?: string;
  superintendent?: string;
  total_labor_hours?: number;
  labor_budget?: number;
}

export interface MonthlyAllocation {
  month: string;
  forecast_hours: number;
}

export interface Forecast {
  id: number;
  project_id: number;
  hours_completed: number;
  start_month: string;
  end_month: string;
  remaining_hours: number;
  allocations: MonthlyAllocation[];
}

export interface ForecastCreate {
  project_id: number;
  hours_completed: number;
  start_month: string;
  end_month: string;
}

export interface ManpowerSummary {
  month: string;
  total_hours: number;
}

