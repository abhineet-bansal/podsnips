"""
Flask API for Notion Project Manager
Wraps existing Notion automation code into REST API endpoints
"""

import os
import sys
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from backend_app import (
    check_tokens, upload_video,
    get_pending_projects, get_project_details, get_project_tasks,
    search_youtube_video, get_video_transcript, download_clip)

API_BASE_URL = '/api/v1'
SERVER_PORT = 5000

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend


@app.route(API_BASE_URL + '/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "API is running"})


@app.route(API_BASE_URL + '/projects', methods=['GET'])
def get_projects():
    """
    Get pending projects (with status "Not started") from the Notion database
    Returns: List of pending projects with their basic info
    """
    print("=" * 40)
    print("/projects")
    print("=" * 40)

    try:
        # Get pending pages (status "Not started") from the source database
        projects = get_pending_projects()
        
        return jsonify({
            "success": True,
            "count": len(projects),
            "projects": projects
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route(API_BASE_URL + '/projects/<project_id>', methods=['GET'])
def get_project_detail(project_id):
    """
    Get detailed content of a specific project including all headings
    Returns: Project details with list of headings as tasks
    """
    print("=" * 40)
    print(f"/projects/{project_id}")
    print("=" * 40)

    try:
        project_details = get_project_details(project_id)
        
        return jsonify({
            "success": True,
            "project": project_details
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route(API_BASE_URL + '/projects/<project_id>/tasks', methods=['GET'])
def get_project_tasks(project_id):
    """
    Get detailed tasks of a specific project including all headings
    Returns: Project details with list of headings as tasks
    """
    print("=" * 40)
    print(f"/projects/{project_id}/tasks")
    print("=" * 40)

    try:
        # Extract headings as tasks
        tasks = get_project_tasks(project_id)

        return jsonify({
            "success": True,
            "project_id": project_id,
            "task_count": len(tasks),
            "tasks": tasks
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route(API_BASE_URL + '/projects/<project_id>/transcript', methods=['GET'])
def get_project_transcript(project_id):
    """
    Get detailed transcript for a specific project
    """
    print("=" * 40)
    print(f"/projects/{project_id}/transcript")
    print("=" * 40)

    try:
        project_details = get_project_details(project_id)
        search_query = f"{project_details["episode"]} {project_details["podcast_show"]}"
        video_id = search_youtube_video(search_query)

        # Extract Transcript of video
        transcript = get_video_transcript(video_id)

        return jsonify({
            "success": True,
            "project_id": project_id,
            "video_id": video_id,
            "transcript": transcript
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route(API_BASE_URL + '/create', methods=['POST'])
def create_snippet():
    """
    Create a new snippet/clip
    Expects JSON body with: title, video_id, start, end
    """
    print("=" * 40)
    print("/create")
    print("=" * 40)

    try:
        # Get JSON data from request body
        data = request.get_json()

        # Validate required fields
        required_fields = ['title', 'video_id', 'start', 'end']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400

        # Extract parameters
        title = data['title']
        video_id = data['video_id']
        start = data['start']
        end = data['end']

        print(f"Creating snippet:")
        print(f"  Title: {title}")
        print(f"  Video ID: {video_id}")
        print(f"  Start: {start}")
        print(f"  End: {end}")

        # Step 1: Check Canva tokens
        print("=" * 30)
        print("STEP 1: Validate Canva Authentication")
        print("=" * 30)
        if not check_tokens():
            print("\n✗ Token validation failed. Please authenticate with Canva first.")
            return jsonify({
                "success": False,
                "error": "Canva authentication failed. Please authenticate first."
            }), 401

        # Step 2: Create content directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        content_dir = os.path.join(script_dir, 'content')
        os.makedirs(content_dir, exist_ok=True)

        # Step 3: Download video
        print("\n" + "=" * 30)
        print("STEP 2: Downloading YouTube Clip")
        print("=" * 30)

        # Construct YouTube URL from video_id
        video_url = f"https://www.youtube.com/watch?v={video_id}"

        # Change to content directory for download
        original_dir = os.getcwd()
        os.chdir(content_dir)

        try:
            success = download_clip(video_url, start, end, title)

            if not success:
                print("\n✗ Video download failed")
                os.chdir(original_dir)
                return jsonify({
                    "success": False,
                    "error": "Video download failed"
                }), 500

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
                return jsonify({
                    "success": False,
                    "error": "No video file found after download"
                }), 500

            video_path = str(mp4_files[0])
            print(f"\n✓ Video downloaded: {os.path.basename(video_path)}")

        finally:
            os.chdir(original_dir)

        # Step 4: Upload to Canva
        print("\n" + "=" * 30)
        print("STEP 3: Uploading to Canva")
        print("=" * 30)

        asset_id = upload_video(video_path)

        if not asset_id:
            print("\n✗ Canva upload failed")
            print(f"   Video file saved at: {video_path}")
            return jsonify({
                "success": False,
                "error": "Canva upload failed",
                "video_path": video_path
            }), 500

        # Step 5: Delete local file
        print("\n" + "=" * 30)
        print("STEP 4: Cleaning Up")
        print("=" * 30)

        try:
            os.remove(video_path)
            print(f"✓ Deleted local file: {os.path.basename(video_path)}")
        except Exception as e:
            print(f"⚠  Warning: Could not delete local file: {e}")
            print(f"   Please manually delete: {video_path}")

        # Success!
        print("\n" + "=" * 30)
        print("✓ COMPLETE!")
        print("=" * 30)

        return jsonify({
            "success": True,
            "message": "Snippet created successfully",
            "canva_asset_id": asset_id
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == '__main__':
    print("=" * 60)
    print(f"\nStarting Flask server on http://localhost:{SERVER_PORT}")
    print("=" * 60)
    
    app.run(debug=True, port=SERVER_PORT)