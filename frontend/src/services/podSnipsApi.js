import api from './api';

// API functions for interacting with the PodSnips backend
export const podSnipsApi = {
  // Fetch all pending projects
  // Response: { success: true, count: N, projects: [...] }
  fetchProjects: async () => {
    return await api.get('/projects');
  },

  // Fetch project details
  // Response: { success: true, project: {...} }
  fetchProjectDetails: async (projectId) => {
    return await api.get(`/projects/${projectId}`);
  },

  // Fetch tasks for a project
  // Response: { success: true, project_id: "...", task_count: N, tasks: [...] }
  fetchProjectTasks: async (projectId) => {
    return await api.get(`/projects/${projectId}/tasks`);
  },

  // Fetch transcript for a project
  // Response: { success: true, project_id: "...", video_id: "...", transcript: {...} }
  fetchProjectTranscript: async (projectId) => {
    return await api.get(`/projects/${projectId}/transcript`);
  },

  // Create a snippet/clip
  // Body: { title: "...", video_id: "...", start: "00:10:30", end: "00:12:45" }
  // Response: { success: true, message: "...", canva_asset_id: "..." }
  createSnippet: async (data) => {
    return await api.post('/create', data);
  },
};
