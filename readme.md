1️⃣ ProjectHub – Team-based Project Management API Think: A lightweight alternative to Jira or Trello.
Key Features:
🧑‍💼 Authentication (JWT or session)
🧠 Roles: admin, member, guest
📁 Projects (created by admins)
🗂️ Tasks (assigned to users)
💬 Comments per task
📊 Project statistics (count tasks by status)
📈 Pagination, filtering (status = “in-progress”, “done”, etc.)
✅ Activity logs (auditing)
👀 Optional: Webhook or email notifications on task update

user and auth routes:
| Responsibility | Controller | Access | Description |
| ------------------- | ---------- | ------------- | ------------------ |
| `registerUser` | Auth | Public | New user signup |
| `loginUser` | Auth | Public | User login |
| `getProfile` | User | Authenticated | Fetch own profile |
| `updateUserDetails` | User | Authenticated | Update name/avatar |
| `changePassword` | User | Authenticated | Change password |
| `getAllUsers` | User | Admin | View all users |
| `deleteUser` | User | Admin | Delete user |

## 🧭 Project Management Module — ProjectHub API

This module powers the team collaboration features within **ProjectHub**, providing a robust, structured, and role-based access system for creating, managing, and collaborating on projects. It's designed to be a production-grade backend solution, demonstrating clean modular architecture and advanced role-based authorization.

---

## 🚀 Key Features

- **Project Lifecycle Management:** Full CRUD operations supporting project creation, soft-deletion, and restoration.
- **Role-Based Access Control (RBAC):** Implements a two-layer authorization system:
  1.  **Global Role** (`admin`, `member`, `guest`) for API endpoint access.
  2.  **Project Role** (`owner`, `manager`, `member`) for in-project permissions.
- **Structured Collaboration:** Enables project owners and managers to invite members and assign specific project roles.
- **Integrated Membership:** Manages project members, their roles, and access rights within the project scope.
- **Security & Data Integrity:** Uses comprehensive middleware to enforce access control based on user status, project status, and project-specific role permissions.

---

## 🔒 Project Role-Based Permissions

Project roles strictly define what a user can do within a specific project. The access matrix is as follows:

| Role        | `RoleView` (View Project Details) | `ProjectEdit` (Edit Metadata) | `ProjectManage Members` | `Delete Project` (Soft Delete) |
| :---------- | :-------------------------------- | :---------------------------- | :---------------------- | :----------------------------- |
| **Owner**   | ✅                                | ✅                            | ✅                      | ✅                             |
| **Manager** | ✅                                | ✅                            | ✅                      | ❌                             |
| **Member**  | ✅                                | ❌                            | ❌                      | ❌                             |

---

## ⚙️ API Endpoints & Project Lifecycle

The Project Management module supports the following core project lifecycle endpoints:

| Step                   | Endpoint                          | Method | Description                                                                 | Authorization      |
| :--------------------- | :-------------------------------- | :----- | :-------------------------------------------------------------------------- | :----------------- |
| **1. Create Project**  | `/projects`                       | `POST` | Creates a new project and automatically assigns the creator as the `owner`. | Authenticated User |
| **2. Add Members**     | `/projects/:id/members`           | `POST` | Adds new users to the project.                                              | `owner`, `manager` |
| **3. Manage Roles**    | `/projects/:id/members/:memberId` | `PUT`  | Promotes, demotes, or removes a member from the project.                    | `owner`, `manager` |
| **4. Soft Delete**     | `/projects/:id/delete`            | `PUT`  | Marks the project as inactive in the database.                              | `owner`            |
| **5. Restore Project** | `/projects/:id/restore`           | `PUT`  | Reactivates a soft-deleted project.                                         | `owner`            |

---

## 🧩 Data Relationships (Simplified Schema)

The module relies on a relational structure to manage users, projects, and collaboration data:

- **User** (Global Role) $\rightarrow$ **Project** (`ownerId` $\rightarrow$ `User.id`)
- **Project** $\rightarrow$ **ProjectMembers** (`userId`, `projectId`, `projectRole`)
- **Project** $\rightarrow$ **Tasks** (Upcoming) $\rightarrow$ **Comments** (Future)

### Database Entities (Preview)

#### `projects`

| Column        | Type                    | Description     |
| :------------ | :---------------------- | :-------------- |
| `id`          | `UUID`                  | Primary key     |
| `name`        | `String`                | Project name    |
| `description` | `Text`                  | Project summary |
| `ownerId`     | `UUID` (FK: `users.id`) | Project creator |
| `isActive`    | `Boolean`               | Project status  |
| `createdAt`   | `Timestamp`             | Creation date   |

#### `project_members`

| Column      | Type                            | Description           |
| :---------- | :------------------------------ | :-------------------- |
| `id`        | `UUID`                          | Primary key           |
| `projectId` | `UUID` (FK: `projects.id`)      | Associated project    |
| `userId`    | `UUID` (FK: `users.id`)         | Member user           |
| `role`      | `Enum (owner, manager, member)` | Project-specific role |
| `joinedAt`  | `Timestamp`                     | When the user joined  |

---

## 🛠 Tech Stack

| Category              | Technologies Used                            |
| :-------------------- | :------------------------------------------- |
| **Backend Framework** | Node.js + Express                            |
| **Database**          | Drizzle ORM + PostgreSQL                     |
| **Security**          | JWT Authentication, Role-Based Authorization |
| **Validation**        | Zod                                          |
| **Architecture**      | Modular Controller-Service-Model Pattern     |

---

## 🔜 Future Enhancements

- **Task Management:** Full CRUD operations for tasks, including assignment, status tracking, and deadlines.
- **Comments:** Dedicated comment threads for tasks to facilitate better collaboration.
- **Audit Trail:** Logging of all significant actions (e.g., project creation, role updates) for activity history and admin monitoring.

⚙️ Controllers We’ll Be Building for the Project Module

Here’s the logical flow and responsibilities for each:

1. createProjectController

Who can access: admin only

Responsibilities:

Validate input (projectName, description, optional members[])

Create a new project entry in projectsTable

Add the creator (admin) as the "owner" in projectMembersTable

Add additional members (if provided) as "manager" or "member"

Return project + members data

2. getAllProjectsController

Who can access: admin (can see all) / member (only their projects)

Responsibilities:

Support pagination & filters (status, owner, etc.)

Return a clean list with metadata (totalCount, etc.)

3. getProjectByIdController

Who can access: owner, manager, or member of that project

Responsibilities:

Fetch single project by ID

Include project members and roles

Restrict access if not part of that project

4. updateProjectController

Who can access: owner or manager

Responsibilities:

Update name, description, or status

Restrict non-owners from updating ownership or deleting

5. addMembersToProjectController

Who can access: owner or manager

Responsibilities:

Accept an array of users + roles

Validate if they’re existing users

Prevent duplicate members

6. removeMemberController

Who can access: owner or manager

Responsibilities:

Remove a member (except owner)

Restrict manager from removing other managers or owner

7. softDeleteProjectController

Who can access: admin only

Responsibilities:

Mark project as inactive

Optionally cascade soft-delete tasks (later step)

8. restoreProjectController

Who can access: admin only

Responsibilities:

Reactivate a previously soft-deleted project

9. (Later) hardDeleteProjectController

Who can access: admin only

Responsibilities:

Permanently delete project & members association
