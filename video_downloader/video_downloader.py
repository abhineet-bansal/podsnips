#!/usr/bin/env python3
"""
Simple YouTube clip downloader.
Downloads specific time ranges from YouTube videos in 1080p.

Usage:
    python video_downloader.py <url> <start_time> <end_time> [output_title]

    start_time and end_time can be in MM:SS or HH:MM:SS format
    output_title is optional - if not provided, uses the video title
"""

import sys
import argparse
import yt_dlp
from yt_dlp.utils import download_range_func


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


def main():
    parser = argparse.ArgumentParser(
        description='Download a specific clip from a YouTube video.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python video_downloader.py "https://youtube.com/watch?v=..." 1:30 3:45
  python video_downloader.py "https://youtube.com/watch?v=..." 01:30:00 01:45:30 "my_clip"
  python video_downloader.py "https://youtube.com/watch?v=..." 90 180 "output_name"
        '''
    )

    parser.add_argument('url', help='YouTube video URL')
    parser.add_argument('start_time', help='Start time (MM:SS or HH:MM:SS format)')
    parser.add_argument('end_time', help='End time (MM:SS or HH:MM:SS format)')
    parser.add_argument('output_title', nargs='?', default=None,
                        help='Optional output filename (without extension)')

    args = parser.parse_args()

    success = download_clip(args.url, args.start_time, args.end_time, args.output_title)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()