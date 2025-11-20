import os
import sys
import pickle
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent.absolute()

# Constants
SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
API_SERVICE_NAME = 'youtube'
API_VERSION = 'v3'
CLIENT_SECRETS_FILE = str(SCRIPT_DIR / 'client_secrets.json')
TOKEN_FILE = str(SCRIPT_DIR / 'token.pickle')
VIDEOS_FOLDER = 'videos'

class YouTubeShortsUploader:
    def __init__(self):
        self.youtube = None
        
    def authenticate(self):
        """Authenticate with YouTube using OAuth 2.0"""
        print("Authenticating with YouTube...")
        
        credentials = None
        
        # Load saved credentials if they exist
        if os.path.exists(TOKEN_FILE):
            print("Loading saved credentials...")
            with open(TOKEN_FILE, 'rb') as token:
                credentials = pickle.load(token)
        
        # If credentials are invalid or don't exist, get new ones
        if not credentials or not credentials.valid:
            if credentials and credentials.expired and credentials.refresh_token:
                print("Refreshing access token...")
                credentials.refresh(Request())
            else:
                # Check if client_secrets.json exists
                if not os.path.exists(CLIENT_SECRETS_FILE):
                    print(f"\n✗ Error: {CLIENT_SECRETS_FILE} not found!")
                    print("\nYou need to:")
                    print("1. Go to https://console.cloud.google.com/")
                    print("2. Create a project and enable YouTube Data API v3")
                    print("3. Create OAuth 2.0 credentials (Desktop App)")
                    print("4. Download the JSON file and save it as 'client_secrets.json'")
                    print("\nSee README.md for detailed instructions.")
                    return False
                
                print("\n" + "="*60)
                print("FIRST TIME AUTHENTICATION")
                print("="*60)
                print("A browser window will open for you to authorize this app.")
                print("1. Select your Google account")
                print("2. Click 'Allow' to grant permissions")
                print("3. You can close the browser after seeing 'authentication successful'")
                print("="*60 + "\n")
                
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        CLIENT_SECRETS_FILE, SCOPES)
                    credentials = flow.run_local_server(port=0)
                except Exception as e:
                    print(f"\n✗ Authentication failed: {e}")
                    return False
            
            # Save credentials for next time
            with open(TOKEN_FILE, 'wb') as token:
                pickle.dump(credentials, token)
            print("✓ Credentials saved for future use")
        
        # Build YouTube service
        self.youtube = build(API_SERVICE_NAME, API_VERSION, credentials=credentials)
        print("✓ Successfully authenticated with YouTube\n")
        return True
    
    def validate_video(self, video_path):
        """Validate video meets YouTube requirements"""
        print(f"Validating video: {video_path}")
        
        # Check if file exists
        if not os.path.exists(video_path):
            print(f"✗ Video file not found: {video_path}")
            return False
        
        # Check file extension
        valid_extensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv']
        file_ext = Path(video_path).suffix.lower()
        if file_ext not in valid_extensions:
            print(f"✗ Invalid file format: {file_ext}")
            print(f"Valid formats: {', '.join(valid_extensions)}")
            return False
        
        # Check file size (YouTube limit is 256GB, but 128GB for unverified)
        file_size_mb = os.path.getsize(video_path) / (1024 * 1024)
        file_size_gb = file_size_mb / 1024
        
        if file_size_gb > 128:
            print(f"✗ File too large: {file_size_gb:.2f} GB")
            print("Max: 128 GB (or 256 GB for verified accounts)")
            return False
        
        print(f"✓ File size: {file_size_mb:.2f} MB ({file_size_gb:.3f} GB)")
        print(f"✓ Format: {file_ext}")
        print("✓ Video validation passed\n")
        return True
    

    def upload_thumbnail(self, video_id, thumbnail_path):
        """Upload custom thumbnail for video"""
        try:
            print(f"\nUploading thumbnail: {thumbnail_path}")
            
            # Validate thumbnail exists
            if not os.path.exists(thumbnail_path):
                print(f"✗ Thumbnail file not found: {thumbnail_path}")
                return False
            
            # Check file size (max 2MB)
            file_size_mb = os.path.getsize(thumbnail_path) / (1024 * 1024)
            if file_size_mb > 2:
                print(f"✗ Thumbnail too large: {file_size_mb:.2f} MB (max 2 MB)")
                return False
            
            # Check file extension
            valid_extensions = ['.jpg', '.jpeg', '.png']
            file_ext = Path(thumbnail_path).suffix.lower()
            if file_ext not in valid_extensions:
                print(f"✗ Invalid thumbnail format: {file_ext}")
                print(f"Valid formats: {', '.join(valid_extensions)}")
                return False
            
            # Upload thumbnail
            request = self.youtube.thumbnails().set(
                videoId=video_id,
                media_body=MediaFileUpload(thumbnail_path)
            )
            response = request.execute()
            
            print("✓ Thumbnail uploaded successfully")
            return True
            
        except HttpError as e:
            print(f"✗ Thumbnail upload failed: {e}")
            return False
        except Exception as e:
            print(f"✗ Unexpected error uploading thumbnail: {e}")
            return False


    def upload_video(self, video_path, title, description="", category="22", thumbnail_path=None):
        """Upload video to YouTube as a Short"""
        print("="*60)
        print("UPLOADING TO YOUTUBE")
        print("="*60 + "\n")

        # Validate video
        if not self.validate_video(video_path):
            return None
        
        # Prepare video metadata
        body = {
            'snippet': {
                'title': title,
                'description': description,
                'categoryId': category
            },
            'status': {
                'privacyStatus': 'public',
                'selfDeclaredMadeForKids': False
            }
        }
        
        # Create MediaFileUpload object
        media = MediaFileUpload(
            video_path,
            chunksize=-1,  # Upload in a single request
            resumable=True
        )
        
        try:
            print("Uploading video...")
            print(f"Title: {title}")
            print(f"Privacy: public")
            print(f"Category: {category}")
            if description:
                print(f"Description: {description[:100]}...")
            print()
            
            # Execute upload
            request = self.youtube.videos().insert(
                part=','.join(body.keys()),
                body=body,
                media_body=media
            )
            
            response = None
            while response is None:
                status, response = request.next_chunk()
                if status:
                    progress = int(status.progress() * 100)
                    print(f"Upload progress: {progress}%", end='\r')
            
            print("\n")  # New line after progress
            
            # Extract video info
            video_id = response['id']
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            shorts_url = f"https://www.youtube.com/shorts/{video_id}"

            print("="*60)
            print("✓ SUCCESS! VIDEO UPLOADED")
            print("="*60)
            print(f"Video ID: {video_id}")
            print(f"Title: {title}")
            print(f"Status: public")
            print(f"\nRegular URL: {video_url}")
            print(f"Shorts URL: {shorts_url}")
            print("="*60)

            # Upload thumbnail if provided
            if thumbnail_path:
                self.upload_thumbnail(video_id, thumbnail_path)
            
            return response
            
        except HttpError as e:
            print(f"\n✗ Upload failed: {e}")
            if e.resp.status == 403:
                print("\nPossible reasons:")
                print("- API quota exceeded (10,000 units/day)")
                print("- YouTube Data API not enabled")
                print("- Invalid OAuth credentials")
            elif e.resp.status == 400:
                print("\nPossible reasons:")
                print("- Invalid video format")
                print("- Video too long (max 15 min for unverified accounts)")
                print("- Invalid metadata")
            return None
        except Exception as e:
            print(f"\n✗ Unexpected error: {e}")
            return None


def main():
    """Main function"""
    print("""
╔════════════════════════════════════════════╗
║  YouTube Shorts Uploader v1.0 (API)        ║
║  Using Official YouTube Data API v3        ║
╚════════════════════════════════════════════╝
    """)

    # Initialize uploader
    uploader = YouTubeShortsUploader()

    # Authenticate
    if not uploader.authenticate():
        print("\n✗ Authentication failed. Exiting...")
        return

    print("-"*60)

    # Get file prefix from user
    print("Enter the file prefix (without extension):")
    print("Example: 'my_video' will look for:")
    print("  - my_video.mp4 (video)")
    print("  - my_video.txt (description)")
    print("  - my_video.png (thumbnail)")
    file_prefix = input("File prefix: ").strip()

    # Validate prefix provided
    if not file_prefix:
        print("\n✗ No file prefix provided. Exiting...")
        return

    # Build file paths
    video_path = f"{file_prefix}.mp4"
    description_file_path = f"{file_prefix}.txt"
    thumbnail_path = f"{file_prefix}.png"

    # Check if video exists (required)
    if not os.path.exists(video_path):
        print(f"\n✗ Video file not found: {video_path}")
        print("Please ensure the video file exists with .mp4 extension")
        return

    print(f"✓ Found video: {video_path}")

    # Load description from .txt file if it exists
    description = ""
    if os.path.exists(description_file_path):
        try:
            with open(description_file_path, 'r', encoding='utf-8') as f:
                description = f.read().strip()
            print(f"✓ Loaded description from: {description_file_path}")
        except Exception as e:
            print(f"⚠ Warning: Could not read description file: {e}")
            print("Continuing without description...")
    else:
        print(f"ℹ No description file found ({description_file_path}), continuing without description")

    # Check if thumbnail exists
    if not os.path.exists(thumbnail_path):
        print(f"ℹ No thumbnail file found ({thumbnail_path}), will auto-generate")
        thumbnail_path = None
    else:
        print(f"✓ Found thumbnail: {thumbnail_path}")
 
    # Get title (required for YouTube)
    print("\nEnter title for your video:")
    title = input("Title: ").strip()

    if not title:
        print("\n✗ Title is required. Exiting...")
        return
    
    # Upload
    print()
    result = uploader.upload_video(
        video_path=video_path,
        title=title,
        description=description,
        thumbnail_path=thumbnail_path
    )

    if result:
        print("\n✓ All done! Check your YouTube channel.")
        print("\nNote: YouTube may take a few minutes to process and")
        print("classify your video as a Short in the Shorts feed.")
    else:
        print("\n✗ Upload failed. Check the errors above.")


if __name__ == "__main__":
    main()