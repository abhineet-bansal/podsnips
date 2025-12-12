import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTasks,
  selectTasks,
  selectTasksLoading,
  selectTasksError,
} from '../features/tasks/tasksSlice';
import { selectProjects } from '../features/projects/projectsSlice';
import ProjectDetails from '../features/projects/ProjectDetails';
import TaskListItem from '../features/tasks/TaskListItem';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const projects = useSelector(selectProjects);
  const tasks = useSelector(selectTasks);
  const loading = useSelector(selectTasksLoading);
  const error = useSelector(selectTasksError);

  // Find the current project from the projects list
  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    dispatch(fetchTasks(projectId));
  }, [dispatch, projectId]);

  const handleRetry = () => {
    dispatch(fetchTasks(projectId));
  };

  const handleBackToProjects = () => {
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={handleBackToProjects}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
      >
        <svg
          className="w-5 h-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
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
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tasks</h2>

        {loading && <LoadingSpinner message="Loading tasks..." />}

        {error && <ErrorMessage message={error} onRetry={handleRetry} />}

        {!loading && !error && tasks.length === 0 && (
          <EmptyState message="No tasks found for this project." />
        )}

        {!loading && !error && tasks.length > 0 && (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskListItem key={task.id} task={task} projectId={projectId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectPage;
