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

  // Find current task index and calculate previous/next
  const currentTaskIndex = tasks.findIndex((t) => t.id === decodedTaskId);
  const hasPrevious = currentTaskIndex > 0;
  const hasNext = currentTaskIndex < tasks.length - 1;
  const previousTask = hasPrevious ? tasks[currentTaskIndex - 1] : null;
  const nextTask = hasNext ? tasks[currentTaskIndex + 1] : null;

  const handlePrevious = () => {
    if (previousTask) {
      navigate(`/project/${projectId}/task/${encodeURIComponent(previousTask.id)}`);
    }
  };

  const handleNext = () => {
    if (nextTask) {
      navigate(`/project/${projectId}/task/${encodeURIComponent(nextTask.id)}`);
    }
  };

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
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
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

          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
              disabled={!hasPrevious}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                hasPrevious
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!hasNext}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                hasNext
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <TaskDetails task={task} />
      </div>
    </div>
  );
};

export default TaskPage;
