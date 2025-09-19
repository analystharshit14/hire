import { apiRequest, queryClient } from "./queryClient";

export { queryClient };

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  experience?: number;
  skills: string[];
  resume?: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  title: string;
  scheduledAt: string;
  duration: number;
  status: string;
  type: string;
  location?: string;
  interviewerEmail: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recording {
  id: string;
  interviewId: string;
  videoPath?: string;
  audioPath?: string;
  transcription?: string;
  duration?: number;
  size?: number;
  createdAt: string;
}

export interface Evaluation {
  id: string;
  interviewId: string;
  candidateId: string;
  technicalScore?: string;
  communicationScore?: string;
  problemSolvingScore?: string;
  overallScore?: string;
  strengths?: string;
  weaknesses?: string;
  recommendation?: string;
  feedback?: string;
  evaluatorEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Metrics {
  totalInterviews: number;
  activeCandidates: number;
  weeklyInterviews: number;
  averageScore: number;
}

// Candidate API functions
export const candidateApi = {
  getAll: (params?: { limit?: number; offset?: number; search?: string }) => 
    `/api/candidates${params ? `?${new URLSearchParams(params as any).toString()}` : ''}`,
  
  getById: (id: string) => `/api/candidates/${id}`,
  
  create: async (candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await apiRequest('POST', '/api/candidates', candidate);
    return response.json();
  },
  
  update: async (id: string, candidate: Partial<Candidate>) => {
    const response = await apiRequest('PUT', `/api/candidates/${id}`, candidate);
    return response.json();
  },
  
  delete: async (id: string) => {
    await apiRequest('DELETE', `/api/candidates/${id}`);
  },
};

// Interview API functions
export const interviewApi = {
  getAll: (params?: { candidateId?: string; status?: string }) => 
    `/api/interviews${params ? `?${new URLSearchParams(params as any).toString()}` : ''}`,
  
  getById: (id: string) => `/api/interviews/${id}`,
  
  getUpcoming: (date: string) => `/api/interviews/upcoming/${date}`,
  
  create: async (interview: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await apiRequest('POST', '/api/interviews', interview);
    return response.json();
  },
  
  update: async (id: string, interview: Partial<Interview>) => {
    const response = await apiRequest('PUT', `/api/interviews/${id}`, interview);
    return response.json();
  },
};

// Recording API functions
export const recordingApi = {
  getAll: (interviewId?: string) => 
    `/api/recordings${interviewId ? `?interviewId=${interviewId}` : ''}`,
  
  create: async (formData: FormData) => {
    const response = await fetch('/api/recordings', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
    return response.json();
  },
  
  transcribe: async (id: string) => {
    const response = await apiRequest('POST', `/api/recordings/${id}/transcribe`);
    return response.json();
  },
};

// Evaluation API functions
export const evaluationApi = {
  getAll: (params?: { candidateId?: string; interviewId?: string }) => 
    `/api/evaluations${params ? `?${new URLSearchParams(params as any).toString()}` : ''}`,
  
  create: async (evaluation: Omit<Evaluation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await apiRequest('POST', '/api/evaluations', evaluation);
    return response.json();
  },
  
  analyze: async (data: { 
    transcription: string; 
    interviewId: string; 
    candidateId: string; 
    evaluatorEmail: string;
  }) => {
    const response = await apiRequest('POST', '/api/evaluations/analyze', data);
    return response.json();
  },
};

// Analytics API functions
export const analyticsApi = {
  getMetrics: () => '/api/analytics/metrics',
};
