import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectTranscript, selectVideoId, addClipToTask, rejectTask } from './tasksSlice';
import { getTranscriptSegments, secondsToTime, buildYouTubeUrl, timeToSeconds } from '../../utils/timeUtils';
import { podSnipsApi } from '../../services/podSnipsApi';

const TaskDetails = ({ task }) => {
  const dispatch = useDispatch();
  const transcript = useSelector(selectTranscript);
  const videoId = useSelector(selectVideoId);

  // Range selection state
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [clipTitle, setClipTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleReject = () => {
    dispatch(rejectTask({ taskId: task.id }));
  };

  const hasClip = task.clips && task.clips.length > 0;
  const isRejected = task.rejected === true;

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

  // Handle segment click for range selection
  const handleSegmentClick = (index) => {
    if (rangeStart === null) {
      // First click - set start
      setRangeStart(index);
      setRangeEnd(null);
    } else if (rangeEnd === null) {
      // Second click - set end
      if (index >= rangeStart) {
        setRangeEnd(index);
      } else {
        // If clicked before start, swap them
        setRangeEnd(rangeStart);
        setRangeStart(index);
      }
    } else {
      // Range already selected - reset and start new selection
      setRangeStart(index);
      setRangeEnd(null);
      setClipTitle('');
    }
  };

  // Determine if a segment is in the selected/previewed range
  const isInRange = (index) => {
    if (rangeStart === null) return false;
    if (rangeEnd !== null) {
      // Final selection
      return index >= rangeStart && index <= rangeEnd;
    }
    // Preview while hovering
    if (hoveredIndex !== null && hoveredIndex >= rangeStart) {
      return index >= rangeStart && index <= hoveredIndex;
    }
    return index === rangeStart;
  };

  const isStartSegment = (index) => index === rangeStart;
  const isEndSegment = (index) => index === rangeEnd;

  // Handle create clip
  const handleCreateClip = async () => {
    if (rangeStart === null || rangeEnd === null || !clipTitle.trim()) return;

    const startSegment = transcriptSegments[rangeStart];
    const endSegment = transcriptSegments[rangeEnd];
    const startTime = secondsToTime(Math.round(startSegment.start));
    const endTime = secondsToTime(Math.round(endSegment.start + endSegment.duration));
    const videoUrl = buildYouTubeUrl(videoId);

    setIsCreating(true);
    setCreateError(null);

    try {
      const payload = {
        title: clipTitle,
        video_id: videoId,
        start: startTime,
        end: endTime,
        video: videoUrl,
      };

      console.log('Creating clip with payload:', payload);

      const response = await podSnipsApi.createSnippet(payload);

      console.log('✅ Clip created successfully:', response);

      // Save clip to task in Redux
      dispatch(addClipToTask({
        taskId: task.id,
        clip: {
          title: clipTitle,
          startTime: startTime,
          endTime: endTime,
          createdAt: new Date().toISOString(),
        }
      }));

      // Reset selection after successful creation
      setRangeStart(null);
      setRangeEnd(null);
      setClipTitle('');

      // Show success message
      alert(`✅ Clip created successfully: "${clipTitle}"`);
    } catch (error) {
      console.error('❌ Failed to create clip:', error);
      setCreateError(error.message || 'Failed to create clip');
    } finally {
      setIsCreating(false);
    }
  };

  const hasValidRange = rangeStart !== null && rangeEnd !== null;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${isRejected ? 'opacity-75 bg-gray-50' : ''}`}>
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-3xl font-bold text-gray-900">
            {task.title || 'Untitled Task'}
          </h2>
          {!hasClip && !isRejected && (
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium border border-red-200"
            >
              Reject Task
            </button>
          )}
          {isRejected && (
            <span className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium border border-gray-300">
              ❌ Rejected
            </span>
          )}
        </div>
        {task.timestamp && (
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            {task.timestamp}
          </span>
        )}
      </div>

      {/* Created Clip (show first clip only) */}
      {task.clips && task.clips.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Created Clip</h3>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">
              {task.clips[0].title}
            </h4>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>⏱️ {task.clips[0].startTime} → {task.clips[0].endTime}</span>
            </div>
          </div>
        </div>
      )}

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
            <p className="text-xs text-gray-500 italic mb-3">
              💡 Click to select start, then click another to select end (creates a range)
            </p>
            {transcriptSegments.map((segment, index) => {
              const inRange = isInRange(index);
              const isStart = isStartSegment(index);
              const isEnd = isEndSegment(index);

              return (
                <div
                  key={index}
                  onClick={() => handleSegmentClick(index)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`
                    flex items-start gap-3 pl-4 py-2 cursor-pointer transition-all
                    border-l-4
                    ${inRange && rangeEnd !== null ? 'bg-blue-50 border-blue-600' :
                      inRange ? 'bg-blue-50/50 border-blue-400' :
                      'border-gray-300 hover:border-blue-300 hover:bg-gray-100'}
                    ${isStart ? 'ring-2 ring-green-400' : ''}
                    ${isEnd ? 'ring-2 ring-red-400' : ''}
                  `}
                >
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 font-mono font-semibold mr-2">
                      {secondsToTime(Math.round(segment.start))}
                      {isStart && <span className="ml-2 text-green-600 font-bold">START</span>}
                      {isEnd && <span className="ml-2 text-red-600 font-bold">END</span>}
                    </span>
                    <span className="text-gray-700 text-sm leading-relaxed">
                      {segment.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create Clip Section */}
          {hasValidRange && (() => {
            const startSegment = transcriptSegments[rangeStart];
            const endSegment = transcriptSegments[rangeEnd];
            const durationSeconds = Math.round(
              (endSegment.start + endSegment.duration) - startSegment.start
            );
            const minutes = Math.floor(durationSeconds / 60);
            const seconds = durationSeconds % 60;
            const durationDisplay = `${minutes}:${String(seconds).padStart(2, '0')}`;

            return (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  Create Clip ({durationDisplay} duration)
                </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clip Title
                  </label>
                  <input
                    type="text"
                    value={clipTitle}
                    onChange={(e) => setClipTitle(e.target.value)}
                    placeholder="Enter a title for your clip..."
                    disabled={isCreating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {createError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      ❌ {createError}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateClip}
                    disabled={!clipTitle.trim() || isCreating}
                    className={`
                      flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
                      ${clipTitle.trim() && !isCreating
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    {isCreating ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Clip'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setRangeStart(null);
                      setRangeEnd(null);
                      setClipTitle('');
                      setCreateError(null);
                    }}
                    disabled={isCreating}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
            );
          })()}
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
