import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import { podSnipsApi } from '../../services/podSnipsApi';

// Async thunk to fetch first page of tasks and transcript
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (projectId, { rejectWithValue, dispatch }) => {
    try {
      console.log('🌐 Fetching first page of tasks & transcript from BACKEND for project:', projectId);
      // Fetch first page of tasks and transcript in parallel
      const [tasksResponse, transcriptResponse] = await Promise.all([
        podSnipsApi.fetchProjectTasks(projectId, 1, 10),
        podSnipsApi.fetchProjectTranscript(projectId)
      ]);

      // Add ID to each task using timestamp as unique identifier
      const tasksWithIds = tasksResponse.tasks.map((task) => ({
        ...task,
        id: task.timestamp, // Use timestamp as unique ID
      }));

      console.log('✅ Loaded', tasksWithIds.length, 'tasks from BACKEND (page 1)');
      console.log('✅ Loaded transcript with', transcriptResponse.transcript?.length || 0, 'segments from BACKEND');

      // If there are more pages, start fetching them in the background
      if (tasksResponse.has_next) {
        console.log('📥 More tasks available, loading in background...');
        dispatch(fetchRemainingTasks({ projectId, startPage: 2 }));
      }

      // Return both datasets
      return {
        tasks: tasksWithIds,
        transcript: transcriptResponse.transcript || [],
        videoId: transcriptResponse.video_id,
        hasMore: tasksResponse.has_next,
      };
    } catch (error) {
      console.error('❌ Failed to fetch tasks from backend:', error.message);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to fetch remaining pages of tasks
export const fetchRemainingTasks = createAsyncThunk(
  'tasks/fetchRemainingTasks',
  async ({ projectId, startPage }, { rejectWithValue, dispatch }) => {
    try {
      let page = startPage;
      let hasNext = true;
      let allNewTasks = [];

      while (hasNext) {
        const response = await podSnipsApi.fetchProjectTasks(projectId, page, 10);

        // Add ID to each task
        const tasksWithIds = response.tasks.map((task) => ({
          ...task,
          id: task.timestamp,
        }));

        allNewTasks = [...allNewTasks, ...tasksWithIds];
        console.log(`✅ Loaded page ${page} with ${tasksWithIds.length} tasks`);

        // Dispatch action to append these tasks immediately
        dispatch(appendTasks(tasksWithIds));

        hasNext = response.has_next;
        page++;
      }

      console.log(`✅ Finished loading all remaining tasks (${allNewTasks.length} total)`);
      return { tasks: allNewTasks };
    } catch (error) {
      console.error('❌ Failed to fetch remaining tasks:', error.message);
      return rejectWithValue(error.message);
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasksList: [],
    tasksLoading: false,
    loadingMoreTasks: false, // Track if we're loading additional pages
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
      state.loadingMoreTasks = false;
    },
    addClipToTask: (state, action) => {
      const { taskId, clip } = action.payload;
      const task = state.tasksList.find((t) => t.id === taskId);
      if (task) {
        if (!task.clips) {
          task.clips = [];
        }
        task.clips.push(clip);
      }
    },
    rejectTask: (state, action) => {
      const { taskId } = action.payload;
      const task = state.tasksList.find((t) => t.id === taskId);
      if (task) {
        task.rejected = true;
        task.rejectedAt = new Date().toISOString();
      }
    },
    appendTasks: (state, action) => {
      // Append new tasks to the existing list, avoiding duplicates
      const existingIds = new Set(state.tasksList.map(t => t.id));
      const newTasks = action.payload.filter(task => !existingIds.has(task.id));
      state.tasksList = [...state.tasksList, ...newTasks];
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
      })
      // Handle fetching remaining tasks
      .addCase(fetchRemainingTasks.pending, (state) => {
        state.loadingMoreTasks = true;
      })
      .addCase(fetchRemainingTasks.fulfilled, (state) => {
        state.loadingMoreTasks = false;
      })
      .addCase(fetchRemainingTasks.rejected, (state, action) => {
        state.loadingMoreTasks = false;
        console.error('Failed to load remaining tasks:', action.payload);
      })
      .addCase(REHYDRATE, (state, action) => {
        // Handle rehydration from localStorage
        if (action.payload && action.payload.tasks) {
          const tasksFromStorage = action.payload.tasks.tasksList || [];
          const transcriptFromStorage = action.payload.tasks.transcript || [];
          if (tasksFromStorage.length > 0) {
            console.log('💾 Loaded', tasksFromStorage.length, 'tasks from STORAGE');
          }
          if (transcriptFromStorage.length > 0) {
            console.log('💾 Loaded transcript with', transcriptFromStorage.length, 'segments from STORAGE');
          }
          if (action.payload.tasks.currentProjectId) {
            console.log('💾 Restored project context:', action.payload.tasks.currentProjectId);
          }
        }
      });
  },
});

export const { clearTasks, addClipToTask, rejectTask, appendTasks } = tasksSlice.actions;

// Selectors
export const selectTasks = (state) => state.tasks.tasksList;
export const selectTasksLoading = (state) => state.tasks.tasksLoading;
export const selectLoadingMoreTasks = (state) => state.tasks.loadingMoreTasks;
export const selectTasksError = (state) => state.tasks.tasksError;
export const selectCurrentProjectId = (state) => state.tasks.currentProjectId;
export const selectTranscript = (state) => state.tasks.transcript;
export const selectVideoId = (state) => state.tasks.videoId;
export const selectTaskById = (taskId) => (state) =>
  state.tasks.tasksList.find((task) => task.id === taskId);

export default tasksSlice.reducer;
