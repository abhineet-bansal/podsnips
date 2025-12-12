#!/usr/bin/env python3
"""
Download YouTube clip and upload to Canva.
Combines video downloading and Canva upload functionality.

Usage:
    python video_design.py <url> <start_time> <end_time> [output_title]

    start_time and end_time can be in MM:SS or HH:MM:SS format
    output_title is optional - if not provided, uses the video title
"""

import sys
import os
import argparse
from pathlib import Path

from video_downloader import download_clip
from canva_automation import check_tokens, upload_video


def main():
    parser = argparse.ArgumentParser(
        description='Download a YouTube clip and upload to Canva.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
            Examples:
            python video_design.py "https://youtube.com/watch?v=..." 1:30 3:45
            python video_design.py "https://youtube.com/watch?v=..." 01:30:00 01:45:30 "my_clip"
                    '''
    )

    parser.add_argument('url', help='YouTube video URL')
    parser.add_argument('start_time', help='Start time (MM:SS or HH:MM:SS format)')
    parser.add_argument('end_time', help='End time (MM:SS or HH:MM:SS format)')
    parser.add_argument('output_title', nargs='?', default=None,
                        help='Optional output filename (without extension)')

    args = parser.parse_args()

    # Step 1: Check Canva tokens
    print("=" * 60)
    print("STEP 1: Validate Canva Authentication")
    print("=" * 60)
    if not check_tokens():
        print("\n✗ Token validation failed. Please authenticate with Canva first.")
        sys.exit(1)

    # Step 2: Create content directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    content_dir = os.path.join(script_dir, 'content')
    os.makedirs(content_dir, exist_ok=True)

    # Step 3: Download video
    print("\n" + "=" * 60)
    print("STEP 2: Downloading YouTube Clip")
    print("=" * 60)

    # Change to content directory for download
    original_dir = os.getcwd()
    os.chdir(content_dir)

    try:
        success = download_clip(args.url, args.start_time, args.end_time, args.output_title)

        if not success:
            print("\n✗ Video download failed")
            os.chdir(original_dir)
            sys.exit(1)

        # Find the downloaded file
        # It should be the most recently created .mp4 file
        mp4_files = sorted(
            Path(content_dir).glob('*.mp4'),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )

        if not mp4_files:
            print("\n✗ No video file found after download")
            os.chdir(original_dir)
            sys.exit(1)

        video_path = str(mp4_files[0])
        print(f"\n✓ Video downloaded: {os.path.basename(video_path)}")

    finally:
        os.chdir(original_dir)

    # Step 4: Upload to Canva
    print("\n" + "=" * 60)
    print("STEP 3: Uploading to Canva")
    print("=" * 60)

    asset_id = upload_video(video_path)

    if not asset_id:
        print("\n✗ Canva upload failed")
        print(f"   Video file saved at: {video_path}")
        sys.exit(1)

    # Step 5: Delete local file
    print("\n" + "=" * 60)
    print("STEP 4: Cleaning Up")
    print("=" * 60)

    try:
        os.remove(video_path)
        print(f"✓ Deleted local file: {os.path.basename(video_path)}")
    except Exception as e:
        print(f"⚠  Warning: Could not delete local file: {e}")
        print(f"   Please manually delete: {video_path}")

    # Success!
    print("\n" + "=" * 60)
    print("✓ COMPLETE!")
    print("=" * 60)

    sys.exit(0)


if __name__ == '__main__':
    main()
