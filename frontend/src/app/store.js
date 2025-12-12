import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from '../features/projects/projectsSlice';
import tasksReducer from '../features/tasks/tasksSlice';

// Redux store configuration
export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    tasks: tasksReducer,
  },
});
