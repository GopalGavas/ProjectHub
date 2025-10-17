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
