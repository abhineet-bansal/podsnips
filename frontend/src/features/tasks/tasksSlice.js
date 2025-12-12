import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { podSnipsApi } from '../../services/podSnipsApi';

// Async thunk to fetch tasks for a project
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await podSnipsApi.fetchProjectTasks(projectId);
      // Extract tasks array from response
      return response.tasks;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Tasks slice
const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasksList: [],
    tasksLoading: false,
    tasksError: null,
  },
  reducers: {
    clearTasks: (state) => {
      state.tasksList = [];
      state.tasksError = null;
    },
    clearTasksError: (state) => {
      state.tasksError = null;
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
        state.tasksError = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.tasksLoading = false;
        state.tasksError = action.payload || 'Failed to fetch tasks';
      });
  },
});

// Selectors
export const selectTasks = (state) => state.tasks.tasksList;
export const selectTasksLoading = (state) => state.tasks.tasksLoading;
export const selectTasksError = (state) => state.tasks.tasksError;

// Selector to get task by ID
export const selectTaskById = (taskId) => (state) => {
  return state.tasks.tasksList.find((task) => task.id === taskId);
};

// Actions
export const { clearTasks, clearTasksError } = tasksSlice.actions;

// Reducer
export default tasksSlice.reducer;
