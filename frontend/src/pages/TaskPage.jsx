import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTasks,
  selectTaskById,
  selectTasksLoading,
  selectTasks,
  selectCurrentProjectId,
} from '../features/tasks/tasksSlice';
import TaskDetails from '../features/tasks/TaskDetails';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TaskPage = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Decode the taskId in case it's URL encoded
  const decodedTaskId = decodeURIComponent(taskId);

  const tasks = useSelector(selectTasks);
  const task = useSelector(selectTaskById(decodedTaskId));
  const tasksLoading = useSelector(selectTasksLoading);
  const currentProjectId = useSelector(selectCurrentProjectId);

  // Only fetch tasks if they're not already loaded for this project
  useEffect(() => {
    if (currentProjectId !== projectId) {
      dispatch(fetchTasks(projectId));
    }
  }, [dispatch, projectId, currentProjectId]);

  if (tasksLoading || (tasks.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner message="Loading task details..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(`/project/${projectId}`)}
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
          Back to Project
        </button>

        <TaskDetails task={task} />
      </div>
    </div>
  );
};

export default TaskPage;
