# Smart Campus Platform 🎓

A comprehensive Smart Campus management system built with a robust Spring Boot backend and a modern React frontend. This platform streamlines campus operations, facility bookings, event management, and student/staff interactions.

---

## 🚀 Features

- **Facility Booking**: Seamlessly book campus resources like halls, labs, and equipment.
- **Event Management**: Organize and track campus events with QR code integration.
- **Dashboard & Analytics**: Real-time insights using dynamic charts and data visualization.
- **Google Authentication**: Secure login via Google OAuth 2.0.
- **Role-Based Access Control**: Managed permissions for Admins, Technicians, and Students.
- **Interactive UI**: Premium glassmorphism design with responsive layouts.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Spring Boot 4.0.5
- **Language**: Java 25
- **Database**: MySQL
- **Security**: Spring Security & JWT (OAuth2 Resource Server)
- **Utilities**: Lombok, ZXing (QR Codes)
- **Build Tool**: Maven

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack Query (React Query)
- **Icons & Charts**: Lucide React, Recharts
- **HTTP Client**: Axios
- **Authentication**: React OAuth Google

---

## ⚙️ Setup & Installation

### Prerequisites
- **Java**: JDK 25 or higher
- **Node.js**: v18.0.0 or higher
- **MySQL**: v8.0 or higher
- **Maven**: (Optional, if not using the provided wrapper)

### 1. Database Setup
1. Create a MySQL database named `campusflow`:
   ```sql
   CREATE DATABASE campusflow;
   ```
2. Ensure your MySQL server is running on `localhost:3306`.

### 2. Backend Configuration
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Open `src/main/resources/application.properties` and update your database credentials if different:
   ```properties
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```
3. Run the backend application:
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend will start on `http://localhost:9094`.

### 3. Frontend Configuration
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create or verify the `.env` file:
   ```env
   VITE_API_BASE=http://localhost:9094
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173` (or the port shown in your terminal).

---

## 📁 Project Structure

```text
smart-campus/
├── backend/          # Spring Boot Application
│   ├── src/          # Source code
│   └── pom.xml       # Maven dependencies
├── frontend/         # React Application (Vite)
│   ├── src/          # React components and logic
│   └── package.json  # Frontend dependencies
└── uploads/          # Directory for stored files/images
```

---

## 🤝 Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---


