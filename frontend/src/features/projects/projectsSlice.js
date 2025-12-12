import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { podSnipsApi } from '../../services/podSnipsApi';

// Async thunk to fetch projects
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await podSnipsApi.fetchProjects();
      return response.projects; // Extract projects array from response
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearProjects: (state) => {
      state.items = [];
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
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProjects } = projectsSlice.actions;

// Selectors
export const selectProjects = (state) => state.projects.items;
export const selectProjectsLoading = (state) => state.projects.loading;
export const selectProjectsError = (state) => state.projects.error;

export default projectsSlice.reducer;
