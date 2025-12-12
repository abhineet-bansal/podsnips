import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { rejectTask } from './tasksSlice';

const TaskListItem = ({ task, projectId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleClick = () => {
    navigate(`/project/${projectId}/task/${encodeURIComponent(task.id)}`);
  };

  const handleReject = (e) => {
    e.stopPropagation(); // Prevent navigation when clicking reject button
    dispatch(rejectTask({ taskId: task.id }));
  };

  const hasClip = task.clips && task.clips.length > 0;
  const isRejected = task.rejected === true;

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300 ${
        isRejected ? 'opacity-50 bg-gray-50' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Left two-thirds: Task info */}
        <div className="flex-1 min-w-0">
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

        {/* Right third: Clip info or Reject button */}
        <div className="w-1/3 flex items-center justify-end gap-2">
          {hasClip ? (
            <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-right">
              <div className="text-xs font-semibold text-purple-900 mb-1 truncate">
                🎬 {task.clips[0].title}
              </div>
              <div className="text-xs text-purple-700">
                {task.clips[0].startTime} → {task.clips[0].endTime}
              </div>
            </div>
          ) : isRejected ? (
            <div className="text-xs text-gray-500 italic font-medium">
              ❌ Rejected
            </div>
          ) : (
            <button
              onClick={handleReject}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium border border-red-200"
            >
              Reject
            </button>
          )}
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
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
    </div>
  );
};

export default TaskListItem;
