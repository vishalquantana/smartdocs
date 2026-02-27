const API_BASE = '/api';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

export interface Project {
  id: string;
  title: string;
  sourceType: 'upload' | 'youtube';
  sourceUrl: string | null;
  videoPath: string | null;
  audioPath: string | null;
  transcriptPath: string | null;
  analysisPath: string | null;
  status: string;
  errorMessage: string | null;
  videoDuration: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  projectId: string;
  orderIndex: number;
  title: string;
  summary: string | null;
  startTime: number;
  endTime: number;
  clipPath: string | null;
  sopJsonPath: string | null;
  sopHtmlPath: string | null;
  thumbnailPath: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  frames: Frame[];
}

export interface Frame {
  id: string;
  lessonId: string;
  orderIndex: number;
  timestamp: number;
  filePath: string;
  caption: string | null;
}

export interface Job {
  id: string;
  projectId: string;
  stage: string;
  status: string;
  progress: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ProjectDetail extends Project {
  lessons: Lesson[];
  jobs: Job[];
}

export const api = {
  health: () => fetchApi<{ status: string }>('/health'),

  createProject: async (data: { title: string; sourceType: 'upload' | 'youtube'; sourceUrl?: string; video?: File }) => {
    if (data.video) {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('sourceType', data.sourceType);
      formData.append('video', data.video);
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || 'Failed to create project');
      }
      return response.json() as Promise<Project>;
    }
    return fetchApi<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        sourceType: data.sourceType,
        sourceUrl: data.sourceUrl,
      }),
    });
  },

  listProjects: () => fetchApi<Project[]>('/projects'),

  getProject: (id: string) => fetchApi<ProjectDetail>(`/projects/${id}`),

  deleteProject: (id: string) => fetchApi<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' }),
};
