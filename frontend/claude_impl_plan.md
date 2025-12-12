# Implementation Plan: React PodSnip Projects Viewer

## Overview
Build a simple React app that displays projects and tasks using an existing Flask backend API. Each project is a PodSnips instance for analyzing podcast episode insights and creating social media posts.

**Navigation Flow:**
- Home Page → Project Page → Task Page
- Each page is a separate route with its own content
- Simple card-based UI with Tailwind CSS

## Architecture Decisions

**Tech Stack:**
- React 19.2.3 (existing CRA setup)
- Redux Toolkit for state management
- React Router v7 for routing
- Axios for API calls
- Tailwind CSS for styling

**Backend Integration:**
- Use existing Flask API at `http://localhost:5000/api/v1`
- Server Port: 5000
- CORS already enabled on backend

**Available API Endpoints:**
- `GET /health` - Health check
- `GET /projects` - List all pending projects (status: "Not started")
- `GET /projects/<id>` - Get project details
- `GET /projects/<id>/tasks` - Get tasks (headings) for a project
- `GET /projects/<id>/transcript` - Get YouTube transcript for a project
- `POST /create` - Create snippet (download clip, upload to Canva)

**Key Patterns:**
- Simple page-based navigation (no split views)
- Feature-based folder organization
- Redux slices for projects and tasks
- Tailwind CSS utility classes
- No state persistence (always start at home page)

## Project Structure

```
frontend/src/
├── app/
│   └── store.js                    # Redux store
├── features/
│   ├── projects/
│   │   ├── projectsSlice.js        # Projects Redux slice
│   │   ├── ProjectCard.js          # Individual project card
│   │   └── ProjectDetails.js       # Project info display
│   └── tasks/
│       ├── tasksSlice.js           # Tasks Redux slice
│       ├── TaskListItem.js         # Task row component
│       └── TaskDetails.js          # Task info display
├── pages/
│   ├── HomePage.js                 # Route: / - Grid of project cards
│   ├── ProjectPage.js              # Route: /project/:id - Project details + task list
│   ├── TaskPage.js                 # Route: /project/:projectId/task/:taskId - Task details
│   └── ErrorPage.js                # 404 handler
├── services/
│   ├── api.js                      # Axios instance
│   └── podSnipsApi.js              # API functions
├── components/
│   ├── common/
│   │   ├── LoadingSpinner.js
│   │   ├── ErrorMessage.js
│   │   └── EmptyState.js
│   └── layout/
│       ├── Header.js
│       └── Layout.js
├── utils/
│   └── constants.js                # API_BASE_URL
├── App.js                          # Router setup
├── index.js                        # Redux Provider
└── index.css                       # Tailwind imports
```

## Redux State Design

### Projects Slice
```javascript
{
  projects: {
    items: [],        // Array of projects
    loading: false,
    error: null
  }
}
```

**Actions:** `fetchProjects` (async thunk)

### Tasks Slice
```javascript
{
  tasks: {
    tasksList: [],              // Tasks for current project
    tasksLoading: false,
    tasksError: null
  }
}
```

**Actions:**
- `fetchTasks(projectId)` - Get tasks for project via GET /projects/:id/tasks
- `clearTasks()` - Clear tasks when leaving project
- `getTaskById(taskId)` - Selector to find specific task from list

**Note:** Tasks are stored in a simple list. When viewing a specific task, we use a selector to find it by ID from the tasks list.

## Routes

```javascript
/ → HomePage (grid of project cards)
/project/:projectId → ProjectPage (project details + task list)
/project/:projectId/task/:taskId → TaskPage (task details)
* → ErrorPage (404)
```

## API Service Layer

**api.js:** Axios instance with base URL, timeout, interceptors

**podSnipsApi.js:**
```javascript
export const podSnipsApi = {
  // Fetch all pending projects
  fetchProjects: () => GET /projects
  // Response: { success: true, count: N, projects: [...] }

  // Fetch project details
  fetchProjectDetails: (projectId) => GET /projects/:projectId
  // Response: { success: true, project: {...} }

  // Fetch tasks for a project
  fetchProjectTasks: (projectId) => GET /projects/:projectId/tasks
  // Response: { success: true, project_id: "...", task_count: N, tasks: [...] }

  // Fetch transcript for a project
  fetchProjectTranscript: (projectId) => GET /projects/:projectId/transcript
  // Response: { success: true, project_id: "...", video_id: "...", transcript: {...} }

  // Create a snippet/clip
  createSnippet: (data) => POST /create
  // Body: { title: "...", video_id: "...", start: "00:10:30", end: "00:12:45" }
  // Response: { success: true, message: "...", canva_asset_id: "..." }
};
```

**API Response Format:**
All endpoints return JSON with a consistent structure:
```javascript
// Success
{ success: true, ...data }

// Error
{ success: false, error: "Error message" }
```

## Component Hierarchy

```
HomePage
└── ProjectCard (×N) - Grid layout with Tailwind

ProjectPage
├── ProjectDetails - Show project info
└── TaskListItem (×N) - Clickable task rows

TaskPage
└── TaskDetails - Show task info
```

## Implementation Steps

### Phase 1: Foundation

1. **Install Dependencies**
   ```bash
   cd /Users/abhineet/hustle/project-podsnips/frontend
   npm install @reduxjs/toolkit react-redux
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

2. **Configure Tailwind CSS**
   - Update `tailwind.config.js`:
     ```js
     content: ["./src/**/*.{js,jsx,ts,tsx}"]
     ```
   - Update `src/index.css`:
     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```

3. **Create folder structure**
   - app/, features/, pages/, services/, components/, utils/

4. **Setup Redux store**
   - Create `app/store.js` with empty reducers
   - Wrap App with `<Provider>` in `index.js`

5. **Setup API layer**
   - `utils/constants.js`: `API_BASE_URL = 'http://localhost:5000/api/v1'`
   - `services/api.js`: Axios instance
   - `services/podSnipsApi.js`: API functions

6. **Setup routing**
   - Configure routes in `App.js` with BrowserRouter
   - Create placeholder pages (HomePage, ProjectPage, TaskPage)

### Phase 2: Home Page (Projects List)

7. **Build projects Redux slice**
   - `features/projects/projectsSlice.js`
   - `fetchProjects` async thunk
   - Selectors for items, loading, error

8. **Build ProjectCard component**
   - Tailwind card styling
   - Display title, status, date, podcast info
   - Click handler navigates to `/project/:id`

9. **Build HomePage**
   - Dispatch `fetchProjects` on mount
   - Handle loading/error states
   - Grid layout with Tailwind (grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
   - Map over projects and render ProjectCard components

10. **Add common components**
    - LoadingSpinner (Tailwind spinner)
    - ErrorMessage (Tailwind alert)
    - EmptyState (Tailwind empty state)

### Phase 3: Project Page

11. **Build tasks Redux slice**
    - `features/tasks/tasksSlice.js`
    - `fetchTasks` async thunk
    - Simple state: tasksList, loading, error
    - `getTaskById` selector

12. **Build ProjectDetails component**
    - Display project information (title, episode, podcast show, etc.)
    - Tailwind card styling

13. **Build TaskListItem component**
    - Clickable row with Tailwind hover effects
    - Display task title, heading level
    - Click navigates to `/project/:projectId/task/:taskId`

14. **Build ProjectPage**
    - Get projectId from URL params
    - Dispatch `fetchTasks(projectId)` on mount
    - Render ProjectDetails at top
    - Render list of TaskListItem components
    - Add "Back to Projects" button

### Phase 4: Task Page

15. **Build TaskDetails component**
    - Display task information (title, content, etc.)
    - Tailwind card styling
    - Render task content blocks if available

16. **Build TaskPage**
    - Get projectId and taskId from URL params
    - Use Redux selector to find task by ID
    - Render TaskDetails
    - Add "Back to Project" button
    - Handle case where task not found

### Phase 5: Polish

17. **Add Header component**
    - App title with Tailwind styling
    - Consistent across all pages

18. **Add Layout component**
    - Wrap all pages with Header
    - Container with max-width and padding

19. **Create ErrorPage**
    - 404 message with "Go Home" button
    - Tailwind styling

20. **Polish Tailwind styling**
    - Consistent color scheme
    - Hover states and transitions
    - Mobile responsive breakpoints
    - Loading states with skeleton screens

21. **Error handling**
    - Retry buttons on errors
    - User-friendly error messages with Tailwind alerts

22. **Testing**
    - Test full flow: Home → Project → Task
    - Test navigation: Back buttons work correctly
    - Test edge cases: empty lists, API errors
    - Test refresh (should maintain current page)

## Critical Files to Create/Modify

**Core Setup:**
- `/Users/abhineet/hustle/project-podsnips/frontend/src/app/store.js`
- `/Users/abhineet/hustle/project-podsnips/frontend/src/index.js` (modify to add Provider)

**Redux Slices:**
- `/Users/abhineet/hustle/project-podsnips/frontend/src/features/projects/projectsSlice.js`
- `/Users/abhineet/hustle/project-podsnips/frontend/src/features/tasks/tasksSlice.js`

**API Layer:**
- `/Users/abhineet/hustle/project-podsnips/frontend/src/utils/constants.js`
- `/Users/abhineet/hustle/project-podsnips/frontend/src/services/api.js`
- `/Users/abhineet/hustle/project-podsnips/frontend/src/services/podSnipsApi.js`

**Pages:**
- `/Users/abhineet/hustle/project-podsnips/frontend/src/App.js` (modify for routing)
- `/Users/abhineet/hustle/project-podsnips/frontend/src/pages/HomePage.js`
- `/Users/abhineet/hustle/project-podsnips/frontend/src/pages/ProjectDetailPage.js`

**Key Components:**
- `/Users/abhineet/hustle/project-podsnips/frontend/src/features/projects/ProjectCard.js`
- `/Users/abhineet/hustle/project-podsnips/frontend/src/features/projects/ProjectDetails.js`
- `/Users/abhineet/hustle/project-podsnips/frontend/src/features/tasks/TaskListItem.js`
- `/Users/abhineet/hustle/project-podsnips/frontend/src/features/tasks/TaskDetails.js`

## Key Implementation Notes

**Tailwind Grid Layout (HomePage):**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
  {projects.map(project => <ProjectCard key={project.id} project={project} />)}
</div>
```

**Navigation Pattern:**
- Home → Project: `navigate(/project/${projectId})`
- Project → Task: `navigate(/project/${projectId}/task/${taskId})`
- Use `useNavigate()` from react-router-dom for programmatic navigation

**Tasks Slice:**
- Simple list of tasks for current project
- When viewing a task, use selector to find it by ID from the list
- No need to store "selected" task in Redux state

**Important:** Tasks are returned with all their data from the /projects/:id/tasks endpoint. Task page retrieves the task from Redux using a selector.

**API Response Handling:**
Backend returns nested objects; extract needed data in Redux thunks:
```javascript
const response = await podSnipsApi.fetchProjects();
return response.projects; // Extract projects array
```

**Tailwind Styling Tips:**
- Use consistent color scheme (e.g., `bg-blue-500`, `text-blue-600`)
- Hover effects: `hover:bg-gray-100`, `hover:shadow-lg`
- Card styling: `bg-white rounded-lg shadow-md p-6`
- Responsive: Use `md:` and `lg:` breakpoints
- Loading spinner: Use Tailwind spin animation

**Performance:**
- Use React.memo on ProjectCard and TaskListItem
- useCallback for click handlers
- No virtualization needed unless lists are 100+ items

## Development Workflow

**Terminal 1 - Backend:**
```bash
cd /Users/abhineet/hustle/project-podsnips/backend
python app.py
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd /Users/abhineet/hustle/project-podsnips/frontend
npm start
# Runs on http://localhost:3000
```

## Success Criteria

- [ ] Home page displays grid of project cards with Tailwind styling
- [ ] Clicking project card navigates to project page
- [ ] Project page shows project details and list of tasks
- [ ] Clicking task row navigates to task page
- [ ] Task page shows task details
- [ ] Back buttons work correctly (Task → Project → Home)
- [ ] Loading states display with Tailwind spinners
- [ ] Errors display with Tailwind alerts and retry buttons
- [ ] Mobile responsive with Tailwind breakpoints
- [ ] Clean, modern UI with Tailwind CSS

## Additional Features (Optional)

The backend also provides these endpoints that can be integrated later:
- **Transcript Viewer**: GET /projects/:id/transcript - Display YouTube transcript for the project
- **Snippet Creator**: POST /create - Create and upload video snippets to Canva
