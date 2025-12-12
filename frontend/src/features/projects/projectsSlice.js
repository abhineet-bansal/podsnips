import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import { podSnipsApi } from '../../services/podSnipsApi';

// Async thunk to fetch projects
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🌐 Fetching projects from BACKEND...');
      const response = await podSnipsApi.fetchProjects();
      console.log('✅ Loaded', response.projects.length, 'projects from BACKEND');
      return response.projects; // Extract projects array from response
    } catch (error) {
      console.error('❌ Failed to fetch projects from backend:', error.message);
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
      })
      .addCase(REHYDRATE, (state, action) => {
        // Handle rehydration from localStorage
        if (action.payload && action.payload.projects) {
          const projectsFromStorage = action.payload.projects.items || [];
          if (projectsFromStorage.length > 0) {
            console.log('💾 Loaded', projectsFromStorage.length, 'projects from STORAGE');
          }
        }
      });
  },
});

export const { clearProjects } = projectsSlice.actions;

// Selectors
export const selectProjects = (state) => state.projects.items;
export const selectProjectsLoading = (state) => state.projects.loading;
export const selectProjectsError = (state) => state.projects.error;

export default projectsSlice.reducer;
