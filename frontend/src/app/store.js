import { configureStore } from '@reduxjs/toolkit';

// Redux store configuration
// Reducers will be added here as we create slices
export const store = configureStore({
  reducer: {
    // projects: projectsReducer, // Will be added in Phase 2
    // tasks: tasksReducer,       // Will be added in Phase 3
  },
});
