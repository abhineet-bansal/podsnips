"""
YouTube Utilities
Functions for working with YouTube videos, including transcript fetching
"""

import re
from typing import List, Dict, Optional
from youtube_transcript_api import YouTubeTranscriptApi
import yt_dlp
from yt_dlp.utils import download_range_func

def get_video_transcript(video_id: str) -> Dict:
    """
    Fetch the transcript for a YouTube video.

    Returns:
        Dictionary with transcript data:
        {
            "success": bool,
            "video_id": str,
            "transcript": List[Dict],
            "error": str (only if success=False)
        }

    Raises:
        Various exceptions from youtube_transcript_api if not handled
    """
    if not video_id:
        return {
            "success": False,
            "video_id": None,
            "error": "Invalid YouTube URL or video ID"
        }

    # Fetch transcript
    try:
        ytt_api = YouTubeTranscriptApi()
        transcript = ytt_api.fetch(video_id)
        raw_transcript = transcript.to_raw_data()
        return {
            "success": True,
            "video_id": video_id,
            "transcript": raw_transcript
        }
    except Exception as e:
        return {
            "success": False,
            "video_id": video_id,
            "error": str(e)
        }


def search_youtube_video(search_query: str):
    """
    Search for a YouTube video using yt-dlp and return the most probable URL.
    Optimized for finding podcast episodes from official channels.

    Returns: Video ID of the best result
    """
    # Configure yt-dlp options for search
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,  # Don't download, just get metadata
        'default_search': 'ytsearch',  # Use YouTube search
    }

    # Search for videos
    search_url = f"ytsearch3:{search_query}"

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        search_results = ydl.extract_info(search_url, download=False)

    if not search_results or 'entries' not in search_results:
        return {
            "success": False,
            "error": "No search results found"
        }

    entries = search_results['entries']
    if not entries:
        return {
            "success": False,
            "error": "No videos found for the search query"
        }

    # Process all results
    all_results = []
    for entry in entries:
        if entry:  # Skip None entries
            result = {
                "video_id": entry.get('id'),
                "url": f"https://www.youtube.com/watch?v={entry.get('id')}",
                "title": entry.get('title', ''),
                "channel": entry.get('channel', entry.get('uploader', '')),
                "duration": entry.get('duration', 0),
                "view_count": entry.get('view_count', 0),
                "upload_date": entry.get('upload_date', ''),
            }
            all_results.append(result)

    # Get the most probable result (first result, as it's most relevant)
    best_result = all_results[0]

    return best_result["video_id"]


def download_clip(url, start_time, end_time, output_title=None):
    """Download a YouTube clip between start_time and end_time."""

    # Convert timestamps to seconds
    start_sec = timestamp_to_seconds(start_time)
    end_sec = timestamp_to_seconds(end_time)

    if start_sec >= end_sec:
        print("Error: Start time must be before end time")
        return False

    print(f"Downloading clip from {start_time} to {end_time}")
    print(f"Duration: {end_sec - start_sec} seconds\n")

    # Configure output template
    if output_title:
        output_template = f'{output_title}.%(ext)s'
    else:
        output_template = '%(title)s_clip.%(ext)s'

    # Configure yt-dlp
    ydl_opts = {
        'format': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best',
        'merge_output_format': 'mp4',
        'download_ranges': download_range_func(None, [(start_sec, end_sec)]),
        'force_keyframes_at_cuts': True,
        'outtmpl': output_template,
    }

    # Download the clip
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        print("\nDownload complete!")
        return True

    except Exception as e:
        print(f"\nDownload failed: {e}")
        return False


"""
PRIVATE METHODS
"""

def extract_video_id(url: str) -> Optional[str]:
    """
    Extract YouTube video ID from various URL formats.

    Supported formats:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://www.youtube.com/v/VIDEO_ID

    Args:
        url: YouTube video URL or video ID

    Returns:
        Video ID if found, None otherwise
    """
    # If it's already just a video ID (11 characters, alphanumeric with dashes/underscores)
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url

    # Try various YouTube URL patterns
    patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})',
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    return None


def timestamp_to_seconds(timestamp):
    """Convert MM:SS or HH:MM:SS to seconds."""
    parts = timestamp.split(':')

    if len(parts) == 2:
        # MM:SS format
        minutes, seconds = map(int, parts)
        return minutes * 60 + seconds
    elif len(parts) == 3:
        # HH:MM:SS format
        hours, minutes, seconds = map(int, parts)
        return hours * 3600 + minutes * 60 + seconds
    else:
        raise ValueError(f"Invalid timestamp format: {timestamp}. Use MM:SS or HH:MM:SS")
