import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { podSnipsApi } from '../../services/podSnipsApi';

// Async thunk to fetch projects
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await podSnipsApi.fetchProjects();
      // Extract projects array from response
      return response.projects;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Projects slice
const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch projects';
      });
  },
});

// Selectors
export const selectProjects = (state) => state.projects.items;
export const selectProjectsLoading = (state) => state.projects.loading;
export const selectProjectsError = (state) => state.projects.error;

// Actions
export const { clearError } = projectsSlice.actions;

// Reducer
export default projectsSlice.reducer;
