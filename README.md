# Blackpoint Accounting - Employee Tracking System

A modern, sleek employee tracking system built with React and Node.js for Blackpoint Accounting. This application allows employees to clock in/out and manage their daily tasks.

🌐 **Live at:** https://blackpointtax.com

## Features

✅ **Time Clock**
- Clock in/out functionality
- Real-time clock display
- Automatic time tracking
- View time history by date

✅ **Daily Task List**
- **Auto-populated default tasks** appear every day
- Add custom tasks as needed
- Check off tasks to mark complete
- Visual progress tracking with completion percentage
- Task descriptions
- Default tasks are marked with "Daily" badge
- Persistent task storage in SQLite

✅ **Modern UI**
- Clean, professional design
- Responsive layout for mobile and desktop
- Real-time updates
- Intuitive user interface

## Technology Stack

**Frontend:**
- React 18
- Axios for API calls
- Modern CSS with CSS variables

**Backend:**
- Node.js with Express
- SQLite database (better-sqlite3)
- RESTful API architecture

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup Instructions

1. **Install all dependencies**
   ```bash
   cd "/Users/bigdog/Desktop/Blackpoint Tracking System"
   npm run install-all
   ```

   This will install dependencies for the root, server, and client.

2. **Start the application**
   ```bash
   npm run dev
   ```

   This starts both the backend server (port 5000) and frontend (port 3000) concurrently.

3. **Access the application**
   - Open your browser to `http://localhost:3000`
   - Enter your employee name to sign in
   - Start tracking your time and tasks!

## Manual Setup (Alternative)

If you prefer to run frontend and backend separately:

### Backend Server
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:5000`

### Frontend Client
```bash
cd client
npm install
npm start
```
Client runs on `http://localhost:3000`

## Usage

### Clocking In/Out
1. Sign in with your employee name
2. Click "Clock In" to start your work session
3. The timer will show your elapsed work time
4. Click "Clock Out" when finished

### Managing Tasks
1. Click "+ Add Task" to create a new task
2. Enter task name and optional description
3. Check the checkbox to mark tasks as complete
4. Click the "×" button to delete tasks
5. View your progress bar to track completion

### Viewing Time History
- Select a date using the date picker
- View all time entries for that day
- See total hours worked

## Project Structure

```
Blackpoint Tracking System/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── TimeClock.js
│   │   │   ├── TaskList.js
│   │   │   └── TimeEntries.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
├── server/                # Node.js backend
│   ├── server.js         # Express server & API
│   ├── blackpoint.db     # SQLite database (auto-created)
│   └── package.json
├── package.json          # Root package file
└── README.md
```

## API Endpoints

### Time Tracking
- `POST /api/clock-in` - Clock in an employee
- `POST /api/clock-out` - Clock out an employee
- `GET /api/status/:employeeName` - Get current clock status
- `GET /api/time-entries` - Get time entries (filter by date/employee)

### Tasks
- `GET /api/tasks` - Get tasks for a date
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/:id` - Update task completion status
- `DELETE /api/tasks/:id` - Delete a task

## Database

The application uses SQLite for data storage. The database file (`blackpoint.db`) is automatically created in the `server` directory on first run.

**Tables:**
- `time_entries` - Stores clock in/out records
- `tasks` - Stores daily tasks

## Customization

### Changing Colors
Edit CSS variables in `client/src/App.css`:
```css
:root {
  --primary-color: #2563eb;
  --success-color: #10b981;
  /* ... more colors */
}
```

### Changing Port Numbers
- Backend: Edit `PORT` in `server/server.js`
- Frontend: Create `.env` file in client folder with `PORT=3001`

## Support

For issues or questions, please contact your system administrator.

## License

Private - Blackpoint Accounting Internal Use Only
