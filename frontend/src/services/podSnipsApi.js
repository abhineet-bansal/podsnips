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
  fetchProjectTasks: async (projectId, page = 1, pageSize = 10) => {
    return await api.get(`/projects/${projectId}/tasks`, {
      params: { page, page_size: pageSize }
    });
  },

  // Fetch all tasks for a project (handles pagination)
  fetchAllProjectTasks: async (projectId) => {
    let allTasks = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const response = await api.get(`/projects/${projectId}/tasks`, {
        params: { page, page_size: 10}
      });

      allTasks = [...allTasks, ...response.tasks];
      hasNext = response.has_next;
      page++;
    }

    return { tasks: allTasks, total_count: allTasks.length };
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
