#!/usr/bin/env python3
"""
Social Media Publisher
Publishes YouTube Shorts and Instagram Reels
"""

import os
import sys
from pathlib import Path

# Import the individual uploaders
from youtube_shorts_publisher import YouTubeShortsUploader
from instagram_reel_publisher import InstagramReelsUploader


def main():
    """Main function to publish to social media platforms"""
    print("""
╔════════════════════════════════════════════╗
║  Social Media Publisher v1.0               ║
║  YouTube Shorts + Instagram Reels          ║
╚════════════════════════════════════════════╝
    """)

    # Get file prefix from user
    print("Enter the file prefix (without extension):")
    print("Example: 'my_video' will look for:")
    print("  - my_video.mp4 (video)")
    print("  - my_video.txt (description/caption)")
    print("  - my_video.png (thumbnail)")
    file_prefix = input("File prefix: ").strip()

    # Validate prefix provided
    if not file_prefix:
        print("\n✗ No file prefix provided. Exiting...")
        return

    # Build file paths
    video_path = f"{file_prefix}.mp4"
    text_file_path = f"{file_prefix}.txt"
    thumbnail_path = f"{file_prefix}.png"

    # Check if video exists (required)
    if not os.path.exists(video_path):
        print(f"\n✗ Video file not found: {video_path}")
        print("Please ensure the video file exists with .mp4 extension")
        return

    print(f"✓ Found video: {video_path}")

    # Load text content from .txt file if it exists
    text_content = ""
    if os.path.exists(text_file_path):
        try:
            with open(text_file_path, 'r', encoding='utf-8') as f:
                text_content = f.read().strip()
            print(f"✓ Loaded text from: {text_file_path}")
        except Exception as e:
            print(f"⚠ Warning: Could not read text file: {e}")
            print("Continuing without text content...")
    else:
        print(f"ℹ No text file found ({text_file_path}), continuing without text content")

    # Check if thumbnail exists
    thumbnail_exists = os.path.exists(thumbnail_path)
    if thumbnail_exists:
        print(f"✓ Found thumbnail: {thumbnail_path}")
    else:
        print(f"ℹ No thumbnail file found ({thumbnail_path})")

    # Get title for YouTube (required)
    print("\n" + "="*60)
    print("Enter title for YouTube Short:")
    title = input("Title: ").strip()

    if not title:
        print("\n✗ Title is required for YouTube. Exiting...")
        return

    print("="*60)

    results = {
        'youtube': None,
        'instagram': None
    }

    # ========== PUBLISH TO YOUTUBE ==========
    print("\n" + "="*60)
    print("PUBLISHING TO YOUTUBE")
    print("="*60)

    try:
        # Initialize YouTube uploader
        youtube_uploader = YouTubeShortsUploader()

        # Authenticate
        if not youtube_uploader.authenticate():
            print("✗ YouTube authentication failed")
            results['youtube'] = False
        else:
            # Upload to YouTube
            result = youtube_uploader.upload_video(
                video_path=video_path,
                title=title,
                description=text_content,
                thumbnail_path=thumbnail_path if thumbnail_exists else None
            )

            results['youtube'] = result is not None

            if results['youtube']:
                print("✓ YouTube upload successful!")
            else:
                print("✗ YouTube upload failed")

    except Exception as e:
        print(f"✗ YouTube upload error: {e}")
        results['youtube'] = False

    # ========== PUBLISH TO INSTAGRAM ==========
    print("\n" + "="*60)
    print("PUBLISHING TO INSTAGRAM")
    print("="*60)

    try:
        # Initialize Instagram uploader
        instagram_uploader = InstagramReelsUploader(debug=False)

        # Login
        if not instagram_uploader.login():
            print("✗ Instagram authentication failed")
            results['instagram'] = False
        else:
            # Upload to Instagram
            result = instagram_uploader.upload_reel(
                video_path=video_path,
                caption=text_content,
                thumbnail_path=thumbnail_path if thumbnail_exists else None
            )

            results['instagram'] = result is not None

            if results['instagram']:
                print("✓ Instagram upload successful!")
            else:
                print("✗ Instagram upload failed")

    except ValueError as e:
        print(f"✗ Instagram configuration error: {e}")
        print("\nMake sure you have a .env file with:")
        print("INSTAGRAM_USERNAME=your_username")
        print("INSTAGRAM_PASSWORD=your_password")
        results['instagram'] = False
    except Exception as e:
        print(f"✗ Instagram upload error: {e}")
        results['instagram'] = False

    # ========== SUMMARY ==========
    print("\n" + "="*60)
    print("PUBLISHING SUMMARY")
    print("="*60)

    youtube_status = "✓ SUCCESS" if results['youtube'] else "✗ FAILED"
    instagram_status = "✓ SUCCESS" if results['instagram'] else "✗ FAILED"

    print(f"YouTube:   {youtube_status}")
    print(f"Instagram: {instagram_status}")
    print("="*60)

    # Overall result
    if results['youtube'] and results['instagram']:
        print("\n✓ All uploads completed successfully!")
    elif results['youtube'] or results['instagram']:
        print("\n⚠ Some uploads failed. Check the errors above.")
    else:
        print("\n✗ All uploads failed. Check the errors above.")


if __name__ == "__main__":
    main()
