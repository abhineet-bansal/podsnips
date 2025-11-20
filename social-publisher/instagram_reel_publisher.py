import os
import sys
from pathlib import Path
from instagrapi import Client
from instagrapi.exceptions import LoginRequired, ChallengeRequired, PleaseWaitFewMinutes
from dotenv import load_dotenv
import json
import logging

# Load environment variables
load_dotenv()

# Constants
SESSION_FILE = "session.json"
VIDEOS_FOLDER = "videos"

class InstagramReelsUploader:
    def __init__(self, debug=False):
        self.client = Client()
        self.username = os.getenv("INSTAGRAM_USERNAME")
        self.password = os.getenv("INSTAGRAM_PASSWORD")

        if not self.username or not self.password:
            raise ValueError("Please set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD in .env file")

        # Enable debug logging if requested
        if debug:
            logging.basicConfig(level=logging.DEBUG)
            self.client.logger.setLevel(logging.DEBUG)
    
    def login(self):
        """Login to Instagram with session persistence"""
        print(f"Logging in as {self.username}...")
        
        # Try to load existing session
        if os.path.exists(SESSION_FILE):
            try:
                print("Loading saved session...")
                self.client.load_settings(SESSION_FILE)
                self.client.login(self.username, self.password)
                print("✓ Logged in using saved session")
                return True
            except Exception as e:
                print(f"Saved session failed: {e}")
                print("Logging in fresh...")
        
        # Fresh login
        try:
            self.client.login(self.username, self.password)
            
            # Save session for next time
            self.client.dump_settings(SESSION_FILE)
            print("✓ Logged in successfully and session saved")
            return True
            
        except ChallengeRequired as e:
            print("⚠ Instagram requires verification (Challenge)")
            print("Please complete the challenge on Instagram app/website")
            return False
            
        except PleaseWaitFewMinutes as e:
            print("⚠ Instagram is rate limiting. Wait a few minutes and try again")
            return False
            
        except Exception as e:
            print(f"✗ Login failed: {e}")
            return False
    
    def validate_video(self, video_path):
        """Validate video meets Instagram Reels requirements"""
        print(f"\nValidating video: {video_path}")
        
        # Check if file exists
        if not os.path.exists(video_path):
            print(f"✗ Video file not found: {video_path}")
            return False
        
        # Check file extension
        valid_extensions = ['.mp4', '.mov']
        file_ext = Path(video_path).suffix.lower()
        if file_ext not in valid_extensions:
            print(f"✗ Invalid file format. Must be .mp4 or .mov, got {file_ext}")
            return False
        
        # Check file size (warn if > 1GB)
        file_size_mb = os.path.getsize(video_path) / (1024 * 1024)
        if file_size_mb > 1024:
            print(f"⚠ Warning: File size is {file_size_mb:.2f} MB (recommended < 1GB)")
        else:
            print(f"✓ File size: {file_size_mb:.2f} MB")
        
        print("✓ Video validation passed")
        return True
    
    def upload_reel(self, video_path, caption="", thumbnail_path=None):
        """Upload video as Instagram Reel with optional thumbnail

        Args:
            video_path: Path to the video file to upload
            caption: Caption text for the reel
            thumbnail_path: Optional path to thumbnail image (JPG/PNG)
        """
        print(f"\n{'='*50}")
        print(f"Uploading Reel...")
        print(f"{'='*50}")

        # Validate video first
        if not self.validate_video(video_path):
            return None

        # Validate thumbnail if provided
        if thumbnail_path:
            if not os.path.exists(thumbnail_path):
                print(f"⚠ Warning: Thumbnail not found: {thumbnail_path}")
                print("Continuing without thumbnail...")
                thumbnail_path = None
            else:
                print(f"✓ Using thumbnail: {thumbnail_path}")

        try:
            # Upload the reel
            print("\nUploading to Instagram...")
            media = self.client.clip_upload(
                video_path,
                caption=caption,
                thumbnail=thumbnail_path
            )

            print("\n" + "="*50)
            print("✓ SUCCESS! Reel uploaded")
            print("="*50)
            print(f"Media ID: {media.id}")
            print(f"Media Code: {media.code}")
            print(f"URL: https://www.instagram.com/reel/{media.code}/")
            print(f"Caption: {caption[:50]}..." if len(caption) > 50 else f"Caption: {caption}")
            if thumbnail_path:
                print(f"Thumbnail: {thumbnail_path}")

            return media

        except Exception as e:
            print(f"\n✗ Upload failed: {e}")

            # Print the last API response for debugging
            if hasattr(self.client, 'last_json') and self.client.last_json:
                print("\n" + "="*50)
                print("Last Instagram API Response:")
                print("="*50)
                print(json.dumps(self.client.last_json, indent=2))

            return None


def main():
    """Main function to run the uploader"""
    print("""
╔═══════════════════════════════════════╗
║  Instagram Reels Uploader v1.0        ║
╚═══════════════════════════════════════╝
    """)
    
    # Initialize uploader with debug mode
    try:
        # Set debug=True to see detailed API responses
        uploader = InstagramReelsUploader(debug=True)
    except ValueError as e:
        print(f"✗ Configuration Error: {e}")
        print("\nCreate a .env file with:")
        print("INSTAGRAM_USERNAME=your_username")
        print("INSTAGRAM_PASSWORD=your_password")
        return
    
    # Login
    if not uploader.login():
        print("\n✗ Could not login. Exiting...")
        return
    
    # Get file prefix from user
    print("\n" + "-"*50)
    print("Enter the file prefix (without extension):")
    print("Example: 'my_video' will look for:")
    print("  - my_video.mp4 (video)")
    print("  - my_video.txt (caption)")
    print("  - my_video.png (thumbnail)")
    file_prefix = "/Users/abhineet/hustle/project-podsnips/social-publisher/content/17Nov-DOACTimFerriss-2" #input("File prefix: ").strip()

    # Validate prefix provided
    if not file_prefix:
        print("\n✗ No file prefix provided. Exiting...")
        return

    # Build file paths
    video_path = f"{file_prefix}.mp4"
    caption_file_path = f"{file_prefix}.txt"
    thumbnail_path = f"{file_prefix}.png"

    # Check if video exists (required)
    if not os.path.exists(video_path):
        print(f"\n✗ Video file not found: {video_path}")
        print("Please ensure the video file exists with .mp4 extension")
        return

    print(f"✓ Found video: {video_path}")

    # Load caption from .txt file if it exists
    caption = ""
    if os.path.exists(caption_file_path):
        try:
            with open(caption_file_path, 'r', encoding='utf-8') as f:
                caption = f.read().strip()
            print(f"✓ Loaded caption from: {caption_file_path}")
        except Exception as e:
            print(f"⚠ Warning: Could not read caption file: {e}")
            print("Continuing without caption...")
    else:
        print(f"ℹ No caption file found ({caption_file_path}), continuing without caption")

    # Check if thumbnail exists
    if not os.path.exists(thumbnail_path):
        print(f"ℹ No thumbnail file found ({thumbnail_path}), will auto-generate")
        thumbnail_path = None
    else:
        print(f"✓ Found thumbnail: {thumbnail_path}")

    # Upload the reel
    result = uploader.upload_reel(video_path, caption, thumbnail_path)
    
    if result:
        print("\n✓ All done! Check your Instagram profile.")
    else:
        print("\n✗ Upload failed. Check the errors above.")


if __name__ == "__main__":
    main()