import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { podSnipsApi } from '../../services/podSnipsApi';

// Async thunk to fetch tasks and transcript for a project
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (projectId, { rejectWithValue }) => {
    try {
      // Fetch both tasks and transcript in parallel
      const [tasksResponse, transcriptResponse] = await Promise.all([
        podSnipsApi.fetchAllProjectTasks(projectId),
        podSnipsApi.fetchProjectTranscript(projectId)
      ]);

      // Add ID to each task using timestamp as unique identifier
      const tasksWithIds = tasksResponse.tasks.map((task) => ({
        ...task,
        id: task.timestamp, // Use timestamp as unique ID
      }));

      // Return both datasets
      // Note: transcriptResponse is already the full response object {success, transcript, video_id}
      return {
        tasks: tasksWithIds,
        transcript: transcriptResponse.transcript || [], // Extract array from response
        videoId: transcriptResponse.video_id,
      };
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
    transcript: null,        // Array of transcript segments
    videoId: null,           // YouTube video ID
  },
  reducers: {
    clearTasks: (state) => {
      state.tasksList = [];
      state.tasksError = null;
      state.currentProjectId = null;
      state.transcript = null;
      state.videoId = null;
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
        state.tasksList = action.payload.tasks;
        state.transcript = action.payload.transcript;
        state.videoId = action.payload.videoId;
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
export const selectTranscript = (state) => state.tasks.transcript;
export const selectVideoId = (state) => state.tasks.videoId;
export const selectTaskById = (taskId) => (state) =>
  state.tasks.tasksList.find((task) => task.id === taskId);

export default tasksSlice.reducer;
