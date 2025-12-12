import api from './api';

export const podSnipsApi = {
  // Fetch all pending projects
  fetchProjects: async () => {
    return await api.get('/projects');
  },

  // Fetch project details
  fetchProjectDetails: async (projectId) => {
    return await api.get(`/projects/${projectId}`);
  },

  // Fetch tasks for a project
  fetchProjectTasks: async (projectId) => {
    return await api.get(`/projects/${projectId}/tasks`);
  },

  // Fetch transcript for a project
  fetchProjectTranscript: async (projectId) => {
    return await api.get(`/projects/${projectId}/transcript`);
  },

  // Create a snippet/clip
  createSnippet: async (data) => {
    return await api.post('/create', data);
  },

  // Health check
  healthCheck: async () => {
    return await api.get('/health');
  },
};
