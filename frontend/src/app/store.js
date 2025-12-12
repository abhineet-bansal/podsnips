import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Uses localStorage
import { combineReducers } from '@reduxjs/toolkit';
import projectsReducer from '../features/projects/projectsSlice';
import tasksReducer from '../features/tasks/tasksSlice';

// Combine your reducers
const rootReducer = combineReducers({
  projects: projectsReducer,
  tasks: tasksReducer,
});

// Persist configuration
const persistConfig = {
  key: 'podsnips-root',
  version: 1,
  storage,
  whitelist: ['projects', 'tasks'], // Which slices to persist
  // blacklist: [], // Which slices NOT to persist
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
