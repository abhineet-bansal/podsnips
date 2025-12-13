# Setup Guide

Complete installation and setup instructions for PodSnips.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Notion Setup](#notion-setup)
- [Canva Setup](#canva-setup)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Python 3.13+**
   ```bash
   python3.13 --version
   # Should output: Python 3.13.x or higher
   ```

   If not installed:
   - macOS: `brew install python@3.13`
   - Linux: `sudo apt install python3.13`
   - Windows: Download from [python.org](https://www.python.org/downloads/)

2. **Node.js 18+** and npm
   ```bash
   node --version  # Should be v18.x.x or higher
   npm --version
   ```

   If not installed:
   - Download from [nodejs.org](https://nodejs.org/)
   - Or use nvm: `nvm install 18`

3. **Git**
   ```bash
   git --version
   ```

### Required Accounts

You'll need accounts and API access for:
- **Notion** - For project management database
- **Canva** - For video upload and editing

## Backend Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd project-podsnips
```

### Step 2: Create Python Virtual Environment

```bash
cd backend

# Create virtual environment
python3.13 -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate

# On Windows:
.venv\Scripts\activate

# Your prompt should now show (.venv)
```

### Step 3: Install Python Dependencies

```bash
# With virtual environment activated:
pip install -r requirements.txt

# This installs:
# - notion-client (Notion API)
# - flask & flask-cors (API server)
# - yt-dlp (YouTube downloading)
# - youtube-transcript-api (Transcript extraction)
# - google-api-python-client (YouTube API)
# - requests (HTTP client)
# - python-dotenv (Environment variables)
# - instagrapi (Instagram API)
```

Alternatively, use the Makefile:
```bash
make install
```

### Step 4: Configure Environment Variables

1. Navigate to the backend_app directory:
   ```bash
   cd backend_app
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your credentials:
   ```bash
   nano .env
   # or use your preferred editor: vim, code, etc.
   ```

   Required variables (see [CONFIGURATION.md](./CONFIGURATION.md) for details):
   ```
   NOTION_API_KEY=your_notion_api_key
   SOURCE_DATABASE_ID=your_database_id
   CANVA_CLIENT_ID=your_canva_client_id
   CANVA_CLIENT_SECRET=your_canva_client_secret
   CANVA_REDIRECT_URI=http://localhost:8000/callback
   ```

### Step 5: Authenticate with Canva

Before running the application, you must authenticate with Canva:

```bash
# From the backend directory:
make canva_auth
```

This will:
1. Start a local OAuth server on port 8000
2. Open your browser to Canva's authorization page
3. Prompt you to authorize the application
4. Save OAuth tokens to `canva_tokens.json`

**Important:** Keep `canva_tokens.json` secure and do not commit it to version control.

### Step 6: Verify Backend Setup

Test that the backend is working:

```bash
# From the backend directory:
make run

# You should see:
# ============================================================
# Starting Flask server on http://localhost:5000
# ============================================================
```

Open another terminal and test the health endpoint:
```bash
curl http://localhost:5000/api/v1/health
# Expected response: {"status":"healthy","message":"API is running"}
```

Press `Ctrl+C` to stop the server.

## Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
cd frontend
# (from project root: cd ../frontend)
```

### Step 2: Install Dependencies

```bash
npm install

# This installs:
# - React 19 and React DOM
# - Redux Toolkit and React Redux
# - Redux Persist
# - React Router v7
# - Axios (HTTP client)
# - Vite (build tool)
# - Tailwind CSS v4
# - ESLint (linting)
```

This may take a few minutes depending on your internet connection.

### Step 3: Verify Frontend Setup

Start the development server:

```bash
npm run dev

# You should see:
#   VITE v7.x.x  ready in xxx ms
#
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: use --host to expose
```

Open `http://localhost:5173` in your browser. You should see the PodSnips interface.

**Note:** The frontend won't display any projects until the backend is running and properly configured.

## Notion Setup

### Step 1: Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Fill in the details:
   - Name: `PodSnips` (or any name you prefer)
   - Associated workspace: Select your workspace
   - Capabilities: Ensure **Read content**, **Update content**, and **Insert content** are checked
4. Click **"Submit"**
5. Copy the **Internal Integration Token** (this is your `NOTION_API_KEY`)

### Step 2: Create or Configure Your Database

1. Create a new database in Notion (or use an existing one)
2. Required properties:
   - **Name/Title** - Text (default)
   - **Status** - Select (with option "Not started")
   - **Episode** - Text
   - **Podcast Show** - Text
   - Any other custom properties you need

3. The database should contain your podcast episode projects

### Step 3: Share Database with Integration

1. Open your database in Notion
2. Click the **"..."** menu in the top-right
3. Scroll down and click **"Add connections"**
4. Search for and select your integration (e.g., "PodSnips")
5. Click **"Confirm"**

### Step 4: Get Database ID

From your database URL:
```
https://www.notion.so/workspace/abc123def456?v=...
                              ^^^^^^^^^^^^^
                              This is your database ID
```

Copy this ID and set it as `SOURCE_DATABASE_ID` in your `.env` file.

## Canva Setup

### Step 1: Create a Canva Integration

1. Go to [https://www.canva.com/developers/](https://www.canva.com/developers/)
2. Sign in with your Canva account
3. Click **"Create an integration"**
4. Fill in the details:
   - name: `PodSnips`
   - description: Video clip automation
5. Click **"Create integration"**

### Step 2: Configure OAuth Settings

1. In your app settings, find **"Authentication"** section
2. Add redirect URI: `http://localhost:8000/callback`
3. Set scopes:
   - `asset:read`
   - `asset:write`
   - `folder:read`
   - `folder:write`

### Step 3: Get OAuth Credentials

1. Copy the **Client ID** (set as `CANVA_CLIENT_ID`)
2. Copy the **Client Secret** (set as `CANVA_CLIENT_SECRET`)
3. Set redirect URI in `.env`: `CANVA_REDIRECT_URI=http://localhost:8000/callback`

### Step 4: Authenticate

Run the authentication command:
```bash
cd backend
make canva_auth
```

Follow the browser prompts to authorize the application.

## Verification

### Complete Setup Verification

1. **Start the backend:**
   ```bash
   cd backend
   source .venv/bin/activate  # if not already activated
   make run
   ```

   Should start on `http://localhost:5000`

2. **In a new terminal, start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

   Should start on `http://localhost:5173`

3. **Open your browser:**
   ```
   http://localhost:5173
   ```

4. **Test the full flow:**
   - Home page should display projects from your Notion database
   - If no projects appear, check:
     - Backend is running and accessible
     - Notion credentials are correct
     - Database has projects with status "Not started"
     - Database is shared with the integration

5. **Test API endpoints:**
   ```bash
   # Health check
   curl http://localhost:5000/api/v1/health

   # List projects
   curl http://localhost:5000/api/v1/projects
   ```
