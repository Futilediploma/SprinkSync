
import axios from 'axios';
import type { Job, JobData, Submission, SubmissionDetail, FormData, UploadConfig, Project, ProjectCreate, ProjectUpdate, Forecast, ForecastCreate, ManpowerSummary } from './types';


const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Job Management (Admin)
export const createJob = async (jobData: Omit<Job, 'id' | 'share_token' | 'created_at' | 'is_active' | 'share_link'>): Promise<Job> => {
  const response = await api.post<Job>('/jobs', jobData);
  return response.data;
};

export const listJobs = async (activeOnly: boolean = true): Promise<Job[]> => {
  const response = await api.get<Job[]>('/jobs', { params: { active_only: activeOnly } });
  return response.data;
};

export const getJob = async (jobId: number): Promise<Job> => {
  const response = await api.get<Job>(`/jobs/${jobId}`);
  return response.data;
};

export const deactivateJob = async (jobId: number): Promise<void> => {
  await api.patch(`/jobs/${jobId}/deactivate`);
};

export const deleteJob = async (jobId: number): Promise<void> => {
  await api.delete(`/jobs/${jobId}`);
};

export const deleteSubmission = async (submissionId: number): Promise<void> => {
  await api.delete(`/submissions/${submissionId}`);
};

// Form (Field Technician)
export const getFormData = async (shareToken: string): Promise<JobData> => {
  const response = await api.get<JobData>(`/form/${shareToken}`);
  return response.data;
};

export const submitForm = async (
  shareToken: string,
  formData: FormData,
  uploadConfig: UploadConfig,
  photos: File[]
): Promise<{ success: boolean; submission_id: number; pdf_filename: string; message: string }> => {
  const formDataObj = new FormData();

  formDataObj.append('submission_data', JSON.stringify({ ...formData, share_token: shareToken }));
  formDataObj.append('upload_config', JSON.stringify(uploadConfig));

  photos.forEach((photo) => {
    formDataObj.append('photos', photo);
  });

  const response = await api.post('/submit', formDataObj, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Submissions (Admin)
export const listSubmissions = async (limit: number = 100): Promise<Submission[]> => {
  const response = await api.get<Submission[]>('/submissions', { params: { limit } });
  return response.data;
};

export const getSubmission = async (submissionId: number): Promise<SubmissionDetail> => {
  const response = await api.get<SubmissionDetail>(`/submissions/${submissionId}`);
  return response.data;
};

export const downloadPDF = (submissionId: number): string => {
  return `/api/submissions/${submissionId}/pdf`;
};

export const downloadPhoto = (submissionId: number, photoFilename: string): string => {
  return `/api/submissions/${submissionId}/photos/${photoFilename}`;
};


export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  const response = await api.get('/health');
  return response.data;
};

// Manpower Forecast
export const createProject = async (project: ProjectCreate): Promise<Project> => {
  const response = await api.post<Project>('/projects', project);
  return response.data;
};

export const listProjectsForManpower = async (): Promise<Project[]> => {
  const response = await api.get<Project[]>('/projects');
  return response.data;
};

export const updateProject = async (id: number, project: ProjectUpdate): Promise<Project> => {
  const response = await api.put<Project>(`/projects/${id}`, project);
  return response.data;
};

export const saveForecast = async (forecast: ForecastCreate): Promise<Forecast> => {
  const response = await api.post<Forecast>('/forecast', forecast);
  return response.data;
};

export const listForecasts = async (): Promise<Forecast[]> => {
  const response = await api.get<Forecast[]>('/forecast');
  return response.data;
};

export const getForecastSummary = async (): Promise<ManpowerSummary[]> => {
  const response = await api.get<ManpowerSummary[]>('/forecast/summary');
  return response.data;
};

