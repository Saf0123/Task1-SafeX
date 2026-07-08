# SafeX Weekly Task Tracker

This project was developed as part of the SafeX Internship Program. It is a frontend module for the SafeX Intern Candidate Management Portal that allows managers to create, assign, organize, and track weekly tasks for interns.

The application is built using React and Vite and currently uses localStorage for data persistence. The project is structured so that it can be connected to an ASP.NET Core backend in the future.

---

## Features

### Dashboard
- View weekly task statistics
- Monitor task completion progress
- View intern workload
- Display overdue task alerts

### Task Management
- Create, edit, and delete tasks
- Duplicate and archive tasks
- Assign and reassign interns
- Search, filter, and sort tasks
- Bulk task actions
- Manage task status and priority
- View task details

### Kanban Board
- Drag and drop tasks between different statuses
- Automatically update task progress

### Calendar
- Month and week views
- View upcoming and overdue tasks
- Open task details directly from the calendar

### Activity Log
- Track task-related activities
- Search and filter activity history
- View timestamps for all actions

---

## Technologies Used

- React
- Vite
- React Router
- Context API
- useReducer
- CSS
- localStorage

---

## Project Structure

```text
src/
├── components/
├── contexts/
├── reducers/
├── services/
├── pages/
├── styles/
├── utils/
├── mock/
├── App.jsx
└── main.jsx
```

---

## Getting Started

Clone the repository and install the dependencies.

```bash
npm install
```

Start the development server.

```bash
npm run dev
```

Then open:

```
http://localhost:5173
```

---

## Future Improvements

Some features that can be added in future versions include:

- ASP.NET Core backend integration
- SQL Server database
- User authentication
- Role-based access
- Email notifications
- Report generation
- File attachments
- Dark mode

---

## About

This project was created as part of the SafeX Internship Program to practice building a scalable React application using reusable components, centralized state management, and a modular project structure.
