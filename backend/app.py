"""
Flask API for Notion Project Manager
Wraps existing Notion automation code into REST API endpoints
"""

from flask import Flask, jsonify
from flask_cors import CORS
from backend_app import get_pending_projects, get_project_tasks

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


if __name__ == '__main__':
    print("=" * 60)
    print(f"\nStarting Flask server on http://localhost:{SERVER_PORT}")
    print("=" * 60)
    
    app.run(debug=True, port=SERVER_PORT)