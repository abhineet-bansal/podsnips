# API Documentation

Complete REST API reference for the PodSnips backend.

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [List Projects](#list-projects)
  - [Get Project Details](#get-project-details)
  - [Get Project Tasks](#get-project-tasks)
  - [Get Project Transcript](#get-project-transcript)
  - [Create Snippet](#create-snippet)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Overview

The PodSnips API is a RESTful JSON API that provides endpoints for managing podcast projects, tasks, and creating video clips. All endpoints return JSON responses with a consistent structure.

**Version:** v1
**Protocol:** HTTP/HTTPS
**Data Format:** JSON

## Base URL

### Development
```
http://localhost:5000/api/v1
```

### Production
```
https://your-domain.com/api/v1
```

All endpoints are prefixed with `/api/v1`.

## Authentication

Currently, the API does not require authentication for most endpoints, as it's designed for local/internal use. Notion and Canva authentication is handled server-side via environment variables.

**Future considerations:**
- API key authentication for production deployments
- JWT tokens for user-specific access

## Response Format

All API responses follow a consistent JSON structure:

### Success Response
```json
{
  "success": true,
  "data_field": "...",
  "another_field": "..."
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Error Handling

### HTTP Status Codes

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| `200` | OK | Successful request |
| `400` | Bad Request | Missing required parameters |
| `401` | Unauthorized | Canva authentication failed |
| `404` | Not Found | Resource not found |
| `500` | Internal Server Error | Server-side error |

### Error Response Example

```json
{
  "success": false,
  "error": "Project not found"
}
```

## Endpoints

### Health Check

Check if the API server is running and healthy.

**Endpoint:** `GET /api/v1/health`

**Parameters:** None

**Response:**
```json
{
  "status": "healthy",
  "message": "API is running"
}
```

**Example:**
```bash
curl http://localhost:5000/api/v1/health
```

---

### List Projects

Get all pending projects from the Notion database (status: "Not started").

**Endpoint:** `GET /api/v1/projects`

**Parameters:** None

**Response:**
```json
{
  "success": true,
  "count": 3,
  "projects": [
    {
      "id": "abc123-def456-...",
      "episode": "How to Build Great Products",
      "podcast_show": "The Startup Show",
      "snip_count": 12
    },
    {
      "id": "xyz789-uvw012-...",
      "episode": "The Future of AI",
      "podcast_show": "Tech Talk Daily",
      "snip_count": 8
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:5000/api/v1/projects
```

**Notes:**
- Only returns projects with status "Not started"
- Projects are fetched from the Notion database specified in `SOURCE_DATABASE_ID`
- `snip_count` indicates the number of tasks/headings in the project

---

### Get Project Details

Get detailed information about a specific project.

**Endpoint:** `GET /api/v1/projects/:project_id`

**Parameters:**

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `project_id` | string | Path | Yes | Notion page ID |

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "abc123-def456-...",
    "episode": "How to Build Great Products",
    "podcast_show": "The Startup Show",
    "snip_count": 8
  }
}
```

**Error Responses:**

```json
{
  "success": false,
  "error": "Project not found"
}
```

**Example:**
```bash
curl http://localhost:5000/api/v1/projects/abc123-def456
```

---

### Get Project Tasks

Get paginated list of tasks (headings) for a specific project.

**Endpoint:** `GET /api/v1/projects/:project_id/tasks`

**Parameters:**

| Parameter | Type | Location | Required | Default | Description |
|-----------|------|----------|----------|---------|-------------|
| `project_id` | string | Path | Yes | - | Notion page ID |
| `page` | integer | Query | No | 1 | Page number (1-indexed) |
| `page_size` | integer | Query | No | 10 | Items per page (1-100) |

**Response:**
```json
{
  "success": true,
  "project_id": "abc123-def456-...",
  "page": 1,
  "page_size": 10,
  "total_count": 25,
  "total_pages": 3,
  "has_next": true,
  "has_previous": false,
  "tasks": [
    {
      "title": "Introduction to the episode",
      "timestamp": "00:02:30",
      "summary": "Discussion about the main topic..."
    },
    {
      "title": "Key insight #1",
      "timestamp": "00:05:45",
      "summary": "First major point discussed..."
    }
  ]
}
```

**Query String Examples:**
```bash
# Get first page (default)
curl http://localhost:5000/api/v1/projects/abc123/tasks

# Get second page with 20 items per page
curl http://localhost:5000/api/v1/projects/abc123/tasks?page=2&page_size=20

# Get all tasks (use large page_size)
curl http://localhost:5000/api/v1/projects/abc123/tasks?page_size=100
```

**Pagination Notes:**
- `page` starts at 1 (not 0)
- `page_size` is capped at 100
- Invalid values default to: page=1, page_size=10
- `has_next` indicates if there are more pages
- `has_previous` indicates if there are previous pages

---

### Get Project Transcript

Get the YouTube video transcript for a project.

**Endpoint:** `GET /api/v1/projects/:project_id/transcript`

**Parameters:**

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `project_id` | string | Path | Yes | Notion page ID |

**Process:**
1. Fetches project details from Notion
2. Searches YouTube for video using episode name + podcast show
3. Extracts transcript using youtube-transcript-api

**Response:**
```json
{
  "success": true,
  "project_id": "abc123-def456-...",
  "video_id": "dQw4w9WgXcQ",
  "transcript": {
    "segments": [
      {
        "text": "Welcome to the show",
        "start": 0.0,
        "duration": 2.5
      },
      {
        "text": "Today we're talking about building products",
        "start": 2.5,
        "duration": 3.2
      },
      {
        "text": "Let's dive right in",
        "start": 5.7,
        "duration": 1.8
      }
    ],
    "language": "en"
  }
}
```

**Transcript Segment Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Transcript text for this segment |
| `start` | float | Start time in seconds |
| `duration` | float | Duration of segment in seconds |

**Error Responses:**

```json
{
  "success": false,
  "error": "Video not found on YouTube"
}
```

```json
{
  "success": false,
  "error": "Transcript not available for this video"
}
```

**Example:**
```bash
curl http://localhost:5000/api/v1/projects/abc123/transcript
```

**Notes:**
- YouTube search uses: `"{episode} {podcast_show}"`
- Returns first matching video
- Some videos may not have transcripts available
- Transcripts are auto-generated by YouTube or uploaded by creators

---

### Create Snippet

Create a video clip by downloading a segment from YouTube and uploading to Canva.

**Endpoint:** `POST /api/v1/create`

**Content-Type:** `application/json`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Name for the video clip |
| `video_id` | string | Yes | YouTube video ID |
| `start` | string | Yes | Start time (format: HH:MM:SS or MM:SS) |
| `end` | string | Yes | End time (format: HH:MM:SS or MM:SS) |

**Request Example:**
```json
{
  "title": "Key Insight - Product Market Fit",
  "video_id": "dQw4w9WgXcQ",
  "start": "00:05:30",
  "end": "00:06:45"
}
```

**Time Format:**
- `HH:MM:SS` - Hours:Minutes:Seconds (e.g., "01:23:45")
- `MM:SS` - Minutes:Seconds (e.g., "05:30")
- `SS` - Seconds (e.g., "90" for 1 minute 30 seconds)

**Response (Success):**
```json
{
  "success": true,
  "message": "Snippet created successfully",
  "canva_asset_id": "DAFa1b2c3d4e5f"
}
```

**Response (Error - Missing Fields):**
```json
{
  "success": false,
  "error": "Missing required fields: title, start"
}
```

**Response (Error - Authentication):**
```json
{
  "success": false,
  "error": "Canva authentication failed. Please authenticate first."
}
```

**Response (Error - Download Failed):**
```json
{
  "success": false,
  "error": "Video download failed"
}
```

**Response (Error - Upload Failed):**
```json
{
  "success": false,
  "error": "Canva upload failed",
  "video_path": "/path/to/downloaded/video.mp4"
}
```

**Process Steps:**
1. **Validate Canva Authentication** - Checks if tokens are valid
2. **Download YouTube Clip** - Uses yt-dlp to download specified segment
3. **Upload to Canva** - Uploads video file to Canva via API
4. **Cleanup** - Deletes local video file
5. **Return Asset ID** - Returns Canva asset ID for uploaded video

**Example:**
```bash
curl -X POST http://localhost:5000/api/v1/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Product Market Fit Discussion",
    "video_id": "dQw4w9WgXcQ",
    "start": "00:05:30",
    "end": "00:06:45"
  }'
```

**Example with curl (formatted):**
```bash
curl -X POST http://localhost:5000/api/v1/create \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "title": "Key Insight - Product Market Fit",
  "video_id": "dQw4w9WgXcQ",
  "start": "00:05:30",
  "end": "00:06:45"
}
EOF
```

**Notes:**
- Requires Canva authentication (run `make canva_auth` first)
- Downloads are stored temporarily in `backend/content/`
- Local files are deleted after successful upload
- Upload includes polling for Canva processing completion
- Typical processing time: 10-60 seconds depending on clip length

---


## Rate Limiting

Currently, there is no rate limiting implemented on the API. However, be aware of:

**Third-party API limits:**
- **Notion API:** 3 requests per second per integration
- **YouTube API:** 10,000 units per day (if using API key)
- **Canva API:** Rate limits vary by endpoint (typically 10-100 req/min)
- **yt-dlp:** No official limits, but respect YouTube's ToS

**Recommended practices:**
- Cache project and task data in the frontend (using Redux Persist)
- Avoid rapid repeated requests
- Use pagination for large task lists
- Handle 429 (Too Many Requests) responses gracefully

## Examples

### Complete Workflow Example

```bash
# 1. Check API health
curl http://localhost:5000/api/v1/health

# 2. List all projects
curl http://localhost:5000/api/v1/projects

# 3. Get tasks for a project
PROJECT_ID="abc123-def456"
curl "http://localhost:5000/api/v1/projects/$PROJECT_ID/tasks?page=1&page_size=10"

# 4. Get transcript
curl "http://localhost:5000/api/v1/projects/$PROJECT_ID/transcript"

# 5. Create a clip
curl -X POST http://localhost:5000/api/v1/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Great Product Insight",
    "video_id": "dQw4w9WgXcQ",
    "start": "00:05:30",
    "end": "00:06:45"
  }'
```

---

**Last Updated:** 2025-01-15
**API Version:** v1
