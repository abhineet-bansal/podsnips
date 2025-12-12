import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from '../features/projects/projectsSlice';

// Redux store configuration
export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    // tasks: tasksReducer,       // Will be added in Phase 3
  },
});
