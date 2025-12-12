/**
 * Convert HH:MM:SS or MM:SS timestamp to total seconds
 * @param {string} timeString - Format "01:33:53" or "09:22"
 * @returns {number} Total seconds (e.g., 5633 or 562)
 */
export const timeToSeconds = (timeString) => {
  if (!timeString) return 0;

  const parts = timeString.split(':').map(Number);

  if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    // MM:SS format (no hours)
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  return 0; // Invalid format
};

/**
 * Convert seconds to HH:MM:SS format
 * @param {number} totalSeconds
 * @returns {string} Format "01:33:53"
 */
export const secondsToTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Get transcript segments within time window of task timestamp
 * @param {Array} transcript - Array of {start, duration, text}
 * @param {string} taskTimestamp - Task timestamp in HH:MM:SS
 * @param {number} beforeSeconds - start time prior to the task timestamp
 * @param {number} afterSeconds - end time post the task timestamp
 * @returns {Array} Filtered and sorted transcript segments
 */
export const getTranscriptSegments = (transcript, taskTimestamp, beforeSeconds = 60, afterSeconds = 60) => {
  if (!transcript || !Array.isArray(transcript) || !taskTimestamp) {
    return [];
  }

  const taskSeconds = timeToSeconds(taskTimestamp);
  const minTime = taskSeconds - beforeSeconds;
  const maxTime = taskSeconds + afterSeconds;

  return transcript
    .filter(segment => {
      const segmentStart = segment.start;
      const segmentEnd = segmentStart + (segment.duration || 0);
      // Include if segment overlaps with window
      return segmentEnd >= minTime && segmentStart <= maxTime;
    })
    .sort((a, b) => a.start - b.start); // Ensure chronological order
};

/**
 * Build YouTube video URL from video_id with optional timestamp
 * @param {string} videoId - YouTube video ID
 * @param {number} startSeconds - Optional start time in seconds
 * @returns {string} YouTube URL
 */
export const buildYouTubeUrl = (videoId, startSeconds = null) => {
  if (!videoId) return null;

  const baseUrl = `https://www.youtube.com/watch?v=${videoId}`;
  return startSeconds ? `${baseUrl}&t=${Math.floor(startSeconds)}s` : baseUrl;
};
