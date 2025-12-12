import React from 'react';

const TaskDetails = ({ task }) => {
  if (!task) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">Task not found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {task.title || 'Untitled Task'}
        </h2>
        {task.timestamp && (
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            {task.timestamp}
          </span>
        )}
      </div>

      {task.summary && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Summary</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {task.summary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;
