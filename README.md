# 🔬 Lab Command CRM

A premium Dental Lab Management System with a modern UI and robust Express + Prisma backend. Designed for seamless tracking of dental cases, client management, and accounting.

## 🚀 Getting Started

Follow these steps to get the system up and running on your local machine.

### 1. Prerequisites
- **Node.js** (v16 or higher recommended)
- **MySQL** or any other database supported by Prisma (configured in `.env`)

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Run migrations if database is not set up:
   ```bash
   npx prisma migrate dev
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```
   The server will run on **http://localhost:5000**.

### 3. Frontend Access
The frontend consists of static HTML, CSS, and JS files. You can access it in two ways:

#### Option A: Open directly (Recommended for quick view)
Simply open the `index.html` file located in the root directory in any modern web browser.
- Path: `c:\Users\vaibh_1mm1mpt\Desktop\crm\index.html`

#### Option B: Using a Live Server
If you use VS Code, you can use the "Live Server" extension to serve the root directory.

---

## 📂 Project Structure

- `/` (Root): Contains all Frontend HTML files (`index.html`, `orders.html`, etc.) and `styles.css`.
- `/backend`: The Node.js Express server and Prisma ORM configuration.
- `/backend/test_api.js`: A utility script to seed initial test data into the system.
- `/pages`, `/client`, `/orders`, `/home`: Contain reference screenshots and design inspiration.

## 🛠️ Tech Stack
- **Frontend**: Vanilla HTML5, CSS3 (Custom Design System), JavaScript (Fetch API).
- **Icons**: FontAwesome 6.4.
- **Backend**: Node.js, Express.js.
- **Database**: Prisma ORM with MySQL/PostgreSQL.

## 💡 Quick Tips
- To add test data quickly, run `node test_api.js` inside the `backend` folder.
- Ensure the backend is running before opening the frontend to see live stats and data.
