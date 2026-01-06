# ProjectHub API

**ProjectHub** is a **production-grade, team-based project management backend API**, inspired by tools like **Jira** and **Trello**. It enables teams to collaborate efficiently through structured project, task, and discussion management, backed by strong authentication, role-based authorization, and detailed activity tracking.

This repository represents the **final, production-ready version** of ProjectHub, consolidating early design intentions with the completed system architecture and features.

---

## 🧠 What is ProjectHub?

ProjectHub is designed as a **scalable collaboration platform** where:

- Teams work inside **projects**
- Work is tracked using **tasks**
- Discussions happen via **comments**
- Every important action is captured via **activity logs**

The API demonstrates **real-world backend engineering practices** rather than basic CRUD operations.

📄 API Documentation: Full request/response documentation is available via Postman Docs.

🔗 Documentation Link: https://documenter.getpostman.com/view/28528757/2sBXVcnZLp

---

## 🚀 Key Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Secure signup, login, logout
- Forgot / reset password flow
- Middleware-driven route protection

### 🧑‍💼 Roles System

**Global Roles** (API-level):

- `admin`
- `member`
- `guest`

**Project Roles** (project-scoped):

- `owner`
- `manager`
- `member`

This two-layer RBAC model mirrors real enterprise systems.

---

## 🛠 Tech Stack

| Category        | Technology            |
| --------------- | --------------------- |
| Backend         | Node.js, Express.js   |
| Database        | PostgreSQL            |
| ORM             | Drizzle ORM           |
| Authentication  | JWT                   |
| Authorization   | Role-based middleware |
| Validation      | Zod                   |
| Documentation   | Postman Docs          |
| Version Control | Git & GitHub          |

---

## 🧱 Architecture Highlights

- RESTful API design
- Nested routing for strict data ownership
- Separation of concerns (Auth, Users, Admin, Projects, Tasks, Comments, Activities)
- Soft delete strategy for safer recovery
- Hard delete restricted to admin operations
- Clean middleware-driven authorization

---

## 👤 User & Auth Module

### User Responsibilities

| Responsibility      | Controller | Access        | Description          |
| ------------------- | ---------- | ------------- | -------------------- |
| `registerUser`      | Auth       | Public        | New user signup      |
| `loginUser`         | Auth       | Public        | User login           |
| `getProfile`        | User       | Authenticated | Fetch own profile    |
| `updateUserDetails` | User       | Authenticated | Update name / avatar |
| `changePassword`    | User       | Authenticated | Change password      |
| `getAllUsers`       | Admin      | Admin         | View all users       |
| `deleteUser`        | Admin      | Admin         | Delete user          |

---

## 🧭 Project Management Module

This module powers **team collaboration**, enforcing strict authorization and ownership rules.

### 🔒 Project Role-Based Permissions

| Role        | View Project | Edit Project | Manage Members | Soft Delete Project |
| ----------- | ------------ | ------------ | -------------- | ------------------- |
| **Owner**   | ✅           | ✅           | ✅             | ✅                  |
| **Manager** | ✅           | ✅           | ✅             | ❌                  |
| **Member**  | ✅           | ❌           | ❌             | ❌                  |

---

### ⚙️ Project Lifecycle Endpoints

| Step            | Endpoint                   | Method | Description                | Access         |
| --------------- | -------------------------- | ------ | -------------------------- | -------------- |
| Create Project  | `/projects`                | POST   | Create new project         | Admin          |
| Add Members     | `/projects/:id/members`    | POST   | Add users to project       | Owner, Manager |
| Update Project  | `/projects/:id`            | PUT    | Update project details     | Owner, Manager |
| Soft Delete     | `/projects/:id/deactivate` | PUT    | Deactivate project         | Owner          |
| Restore Project | `/projects/:id/restore`    | PUT    | Restore project            | Owner          |
| Hard Delete     | `/projects/:id`            | DELETE | Permanently delete project | Admin          |

---

## ✅ Task Management Module

Tasks represent actionable work items within projects.

### Task Endpoints

| Route                                            | Description        | Access                   |
| ------------------------------------------------ | ------------------ | ------------------------ |
| POST `/projects/:projectId/tasks`                | Create task        | Owner, Manager           |
| GET `/projects/:projectId/tasks`                 | Fetch all tasks    | All members              |
| GET `/projects/:projectId/tasks/:taskId`         | Fetch task details | All members              |
| PUT `/projects/:projectId/tasks/:taskId`         | Update task        | Owner, Manager           |
| PUT `/projects/:projectId/tasks/:taskId/status`  | Update task status | Owner, Manager, Assignee |
| PUT `/projects/:projectId/tasks/:taskId/delete`  | Soft delete task   | Owner, Manager           |
| PUT `/projects/:projectId/tasks/:taskId/restore` | Restore task       | Owner, Manager           |
| DELETE `/projects/:projectId/tasks/:taskId`      | Hard delete task   | Admin                    |

---

## 💬 Comments, Likes & Reactions

- Comments are scoped to tasks
- Supports edit, soft delete, and hard delete
- Like toggle per user
- Emoji-style reactions
- Aggregated reaction summaries per comment

---

## 📊 Activity Logs & Auditing

ProjectHub automatically records activities at multiple levels:

- User activities
- Project activities
- Task activities

This enables:

- Auditing
- Change tracking
- Historical insights

---

## 📈 Pagination, Filtering & Statistics

- Pagination support for list endpoints
- Filtering tasks by status (`todo`, `in-progress`, `done`)
- Project-level task statistics (count by status)

---

## ❤️ System Health

```
GET /health
```

Returns API status and server uptime. Used for monitoring and deployment verification.

---

## 📊 API Scale

- **Total Endpoints:** 45+
- Covers auth, RBAC, CRUD, nested resources, activity tracking, and moderation flows

---

## 📌 Use Cases

- Team collaboration platforms
- Project & task management systems
- Internal productivity tools
- Portfolio-grade backend demonstration

---

## ✨ Final Note

ProjectHub is **not a toy project**. It reflects how real-world backend systems are planned, secured, and scaled. The architecture, authorization model, and documentation are intentionally designed to match production-level standards.
