import React from 'react';
import { useNavigate } from 'react-router-dom';

const TaskListItem = ({ task, projectId }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/project/${projectId}/task/${encodeURIComponent(task.id)}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {task.title || 'Untitled Task'}
          </h4>
          {task.summary && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {task.summary}
            </p>
          )}
          {task.timestamp && (
            <span className="text-xs text-gray-500">
              {task.timestamp}
            </span>
          )}
        </div>
        <svg
          className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  );
};

export default TaskListItem;
