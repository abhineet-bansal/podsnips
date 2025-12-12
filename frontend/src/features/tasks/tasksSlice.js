import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { podSnipsApi } from '../../services/podSnipsApi';

// Async thunk to fetch tasks for a project
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await podSnipsApi.fetchAllProjectTasks(projectId);
      // Add ID to each task using timestamp as unique identifier
      const tasksWithIds = response.tasks.map((task) => ({
        ...task,
        id: task.timestamp, // Use timestamp as unique ID
      }));
      return tasksWithIds;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasksList: [],
    tasksLoading: false,
    tasksError: null,
    currentProjectId: null, // Track which project's tasks are loaded
  },
  reducers: {
    clearTasks: (state) => {
      state.tasksList = [];
      state.tasksError = null;
      state.currentProjectId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.tasksLoading = true;
        state.tasksError = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.tasksLoading = false;
        state.tasksList = action.payload;
        state.currentProjectId = action.meta.arg; // Store the projectId that was fetched
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.tasksLoading = false;
        state.tasksError = action.payload;
      });
  },
});

export const { clearTasks } = tasksSlice.actions;

// Selectors
export const selectTasks = (state) => state.tasks.tasksList;
export const selectTasksLoading = (state) => state.tasks.tasksLoading;
export const selectTasksError = (state) => state.tasks.tasksError;
export const selectCurrentProjectId = (state) => state.tasks.currentProjectId;
export const selectTaskById = (taskId) => (state) =>
  state.tasks.tasksList.find((task) => task.id === taskId);

export default tasksSlice.reducer;
