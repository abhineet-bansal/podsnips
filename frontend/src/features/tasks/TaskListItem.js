import React from 'react';
import { useNavigate } from 'react-router-dom';

function TaskListItem({ task, projectId }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/project/${projectId}/task/${task.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-800 mb-1">
            {task.title || 'Untitled Task'}
          </h3>
          {task.heading_level && (
            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              Heading Level: {task.heading_level}
            </span>
          )}
        </div>
        <svg
          className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
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
}

export default React.memo(TaskListItem);
