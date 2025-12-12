import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTasks,
  selectTasks,
  selectTasksLoading,
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

  const projects = useSelector(selectProjects);
  const tasks = useSelector(selectTasks);
  const tasksLoading = useSelector(selectTasksLoading);
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

          {tasksLoading && <LoadingSpinner message="Loading tasks..." />}

          {tasksError && (
            <ErrorMessage message={tasksError} onRetry={handleRetry} />
          )}

          {!tasksLoading && !tasksError && tasks.length === 0 && (
            <EmptyState message="No tasks found for this project" icon="📋" />
          )}

          {!tasksLoading && !tasksError && tasks.length > 0 && (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskListItem key={task.id} task={task} projectId={projectId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
