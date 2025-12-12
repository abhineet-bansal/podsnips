import React from 'react';
import { useSelector } from 'react-redux';
import { selectTranscript, selectVideoId } from './tasksSlice';
import { getTranscriptSegments, secondsToTime, buildYouTubeUrl, timeToSeconds } from '../../utils/timeUtils';

const TaskDetails = ({ task }) => {
  const transcript = useSelector(selectTranscript);
  const videoId = useSelector(selectVideoId);

  if (!task) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">Task not found</p>
      </div>
    );
  }

  // Get transcript segments within ±60 seconds of task timestamp
  const transcriptSegments = task.timestamp && transcript
    ? getTranscriptSegments(transcript, task.timestamp, 15, 45)
    : [];

  // Build YouTube URL with timestamp
  const youtubeUrl = videoId && task.timestamp
    ? buildYouTubeUrl(videoId, timeToSeconds(task.timestamp))
    : null;

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

      {/* Transcript Section */}
      {transcriptSegments.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-700">
              Transcript Excerpt ({transcriptSegments.length} segments)
            </h3>
            {youtubeUrl && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Watch on YouTube
              </a>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
            {transcriptSegments.map((segment, index) => (
              <div
                key={index}
                className="flex items-start gap-3 border-l-4 border-blue-400 pl-4 py-2"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-xs text-gray-500 font-mono font-semibold mr-2">
                    {secondsToTime(Math.round(segment.start))}
                  </span>
                  <span className="text-gray-700 text-sm leading-relaxed">
                    {segment.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {transcriptSegments.length === 0 && transcript && Array.isArray(transcript) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Transcript</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              No transcript segments found within ±1 minute of this timestamp.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;
