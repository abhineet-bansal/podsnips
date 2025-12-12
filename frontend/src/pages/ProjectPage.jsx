import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTasks,
  selectTasks,
  selectTasksLoading,
  selectLoadingMoreTasks,
  selectTasksError,
  selectCurrentProjectId,
} from '../features/tasks/tasksSlice';
import { selectProjects } from '../features/projects/projectsSlice';
import ProjectDetails from '../features/projects/ProjectDetails';
import TaskListItem from '../features/tasks/TaskListItem';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeFilter, setActiveFilter] = useState('all');

  const projects = useSelector(selectProjects);
  const tasks = useSelector(selectTasks);
  const tasksLoading = useSelector(selectTasksLoading);
  const loadingMoreTasks = useSelector(selectLoadingMoreTasks);
  const tasksError = useSelector(selectTasksError);
  const currentProjectId = useSelector(selectCurrentProjectId);

  // Find the current project from the projects list
  const project = projects.find((p) => p.id === projectId);

  // Only fetch tasks if they're not already loaded for this project
  useEffect(() => {
    if (currentProjectId !== projectId) {
      console.log('📋 No tasks for project', projectId, 'in Redux, fetching from backend...');
      dispatch(fetchTasks(projectId));
    } else {
      console.log('⚡ Using', tasks.length, 'tasks from REDUX CACHE for project', projectId, '(no fetch needed)');
    }
  }, [dispatch, projectId, currentProjectId, tasks.length]);

  const handleRetry = () => {
    dispatch(fetchTasks(projectId));
  };

  // Filter tasks based on active filter
  const filteredTasks = tasks.filter((task) => {
    const hasClip = task.clips && task.clips.length > 0;
    const isRejected = task.rejected === true;

    switch (activeFilter) {
      case 'all':
        return true;
      case 'pending':
        return !isRejected && !hasClip;
      case 'completed':
        return hasClip;
      default:
        return true;
    }
  });

  // Calculate counts for each filter
  const allCount = tasks.length;
  const pendingCount = tasks.filter(
    (t) => !t.rejected && !(t.clips && t.clips.length > 0)
  ).length;
  const completedCount = tasks.filter((t) => t.clips && t.clips.length > 0).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Projects
        </button>

        <ProjectDetails project={project} />

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Tasks</h3>

          {/* Filter Tabs */}
          {!tasksLoading && !tasksError && tasks.length > 0 && (
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                  activeFilter === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                All ({allCount})
              </button>
              <button
                onClick={() => setActiveFilter('pending')}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                  activeFilter === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setActiveFilter('completed')}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                  activeFilter === 'completed'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>
          )}

          {tasksLoading && <LoadingSpinner message="Loading tasks..." />}

          {tasksError && (
            <ErrorMessage message={tasksError} onRetry={handleRetry} />
          )}

          {!tasksLoading && !tasksError && tasks.length === 0 && (
            <EmptyState message="No tasks found for this project" icon="📋" />
          )}

          {!tasksLoading && !tasksError && tasks.length > 0 && filteredTasks.length === 0 && (
            <EmptyState
              message={`No ${activeFilter === 'all' ? '' : activeFilter} tasks found`}
              icon="🔍"
            />
          )}

          {!tasksLoading && !tasksError && filteredTasks.length > 0 && (
            <>
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <TaskListItem key={task.id} task={task} projectId={projectId} />
                ))}
              </div>
              {loadingMoreTasks && (
                <div className="mt-4 flex items-center justify-center text-sm text-gray-600">
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading more tasks...
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
