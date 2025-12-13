# PodSnips

PodSnips is a full-stack web application that streamlines my workflow of creating short video clips from podcast episodes. I listen to podcasts on Snipd, and import my snips to Notion. PodSnips integrates with Notion for fetching snips, YouTube for video content, and Canva for video editing and export.

## Overview

PodSnips helps me by:
- Fetching snips from Notion
- Match the podcast snips with the official Youtube video
- Transcript based editing of video clips - quickly identify the sections of the podcast that I want to share with my audience
- Download precise time-range clips from YouTube
- Upload clips directly to Canva for editing

## Tech Stack

### Backend
- **Python 3.13** - Core language
- **Flask** - REST API server
- **Notion API** - Snip data fetch
- **YouTube Data API** - Video search and metadata
- **yt-dlp** - Video downloading
- **youtube-transcript-api** - Transcript extraction
- **Canva API** - Video upload and management

### Frontend
- **React 19** - UI framework
- **Redux Toolkit** - State management with persistence
- **React Router v7** - Client-side routing
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Styling
- **Axios** - HTTP client

## Quick Start

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd project-podsnips
   ```

2. Set up the backend:
   ```bash
   cd backend
   python3.13 -m venv .venv
   make venv
   make install
   ```

3. Configure environment variables (see [CONFIGURATION.md](./CONFIGURATION.md)):
   ```bash
   cd backend_app
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. Authenticate with Canva:
   ```bash
   cd backend
   make canva_auth
   ```

5. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
make run
# Server starts at http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App opens at http://localhost:5173
```

Visit `http://localhost:5173` in your browser to use the application.

## Features

### Task Management
- View all tasks (snips) for each project
- Progressive loading with pagination
- Filter tasks by status: All, Pending, Completed
- Mark tasks as completed or rejected
- Navigate between tasks with Previous/Next buttons

### Clip Creation Workflow
1. Select a podcast episode from the home page
2. Choose a snip to create a clip for
3. View the video transcript (-15/+45 seconds around snip timestamp)
4. Select START and END segments from the transcript
5. Enter a clip title
6. Create the clip:
   - Downloads from YouTube (precise time range)
   - Uploads to Canva automatically
   - Updates task status

PS Canva Connect API doesn't currently allow Mobile Video type design creation, or to add video assets to a design -> those are future improvements.

### Data Persistence
- Redux state persisted to browser localStorage
- Smart caching prevents unnecessary API calls
- State maintained across page refreshes

## Project Structure

```
podsnips/
├── backend/                    # Flask API server
│   ├── app.py                  # Main API application
│   ├── backend_app/            # Core business logic
│   │   ├── notion_parser.py    # Notion integration
│   │   ├── youtube_util.py     # YouTube integration
│   │   ├── canva_upload_video.py
│   │   └── canva_auth.py       # Canva OAuth
│   ├── requirements.txt        # Python dependencies
│   ├── Makefile                # Backend commands
│   ├── content/                # Temporary video storage
│   └── <other dirs>/           # Ignore for this project - they are python scripts meant to be run manually; will be deleted in the future
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── features/           # Feature-based modules
│   │   │   ├── projects/       # Projects Redux slice
│   │   │   └── tasks/          # Tasks Redux slice
│   │   ├── pages/              # Page components
│   │   ├── services/           # API client
│   │   ├── components/         # Reusable UI components
│   │   └── app/store.js        # Redux store
│   ├── package.json
│   └── vite.config.js
│
├── README.md                   # This file
├── SETUP.md                    # Detailed setup guide
├── CONFIGURATION.md            # Environment configuration
└── API.md                      # API documentation
```

## Documentation

- **[SETUP.md](./SETUP.md)** - Detailed installation and setup instructions
- **[CONFIGURATION.md](./CONFIGURATION.md)** - Environment variables and configuration
- **[API.md](./API.md)** - REST API endpoint reference
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture (coming soon)

## Workflow

```
Snipd
    ↓
Notion Database (Snips)
    ↓
Backend API (Flask)
    ↓
Frontend (React + Redux)
    ↓
User selects transcript range
    ↓
Backend downloads from YouTube (yt-dlp)
    ↓
Backend uploads to Canva
    ↓
User edits in Canva (manually)
```

## API Endpoints

The Flask backend exposes these REST endpoints:

- `GET /api/v1/health` - Health check
- `GET /api/v1/projects` - List pending projects
- `GET /api/v1/projects/:id` - Get project details
- `GET /api/v1/projects/:id/tasks` - Get tasks (paginated)
- `GET /api/v1/projects/:id/transcript` - Get video transcript
- `POST /api/v1/create` - Create and upload clip

See [API.md](./API.md) for complete documentation.

## Development

### Backend Commands
```bash
make install      # Install Python dependencies
make run          # Start Flask server (port 5000)
make canva_auth   # Authenticate with Canva
```

### Frontend Commands
```bash
npm run dev       # Start dev server (Vite)
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Configuration

Key environment variables (see [CONFIGURATION.md](./CONFIGURATION.md) for details):

**Backend:**
- `NOTION_API_KEY` - Notion integration token
- `SOURCE_DATABASE_ID` - Notion database ID
- `CANVA_CLIENT_ID` - Canva OAuth client ID
- `CANVA_CLIENT_SECRET` - Canva OAuth secret
- `CANVA_REDIRECT_URI` - OAuth redirect URI

**Frontend:**
- Connects to backend at `http://localhost:5000`


## Acknowledgments

Built with Flask, React, and integrations with Notion, YouTube, and Canva APIs.
