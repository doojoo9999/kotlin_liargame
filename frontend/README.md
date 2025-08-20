# Liar Game Frontend

This is the frontend for the real-time Liar Game web application, rebuilt from the ground up with a modern, scalable architecture.

## ✨ Core Philosophy

- **Modularity**: Built using Feature-Sliced Design to ensure features are independent, loosely coupled, and highly reusable.
- **Clear Separation of Concerns**: Each file and folder has a single, clear responsibility (e.g., UI, business logic, API calls).
- **Predictable State Management**: Server state and client state are strictly separated for clarity and maintainability.

## 🚀 Tech Stack

| Category          | Library                                                     | Purpose                                       |
| ----------------- | ----------------------------------------------------------- | --------------------------------------------- |
| **Environment**   | Vite                                                        | Build tool and development server             |
| **UI Framework**  | React, Mantine                                              | Component-based UI and design system          |
| **Styling**       | styled-components, Framer Motion                            | Custom styling and animations                 |
| **Server State**  | TanStack Query v5                                           | Data fetching, caching, and synchronization   |
| **Client State**  | Zustand                                                     | Global UI state management                    |
| **Routing**       | React Router v7                                             | Client-side routing and data loading          |
| **Forms**         | React Hook Form, Zod                                        | Form state management and validation          |
| **Networking**    | Axios, STOMP.js, SockJS                                     | HTTP and WebSocket communication              |
| **Icons**         | Lucide-React, Tabler Icons                                  | Icon library                                  |

## 📂 Project Structure (Feature-Sliced Design)

The codebase is organized into four main slices:

-   `src/app`: Global settings, providers, styles, and application entry point.
-   `src/pages`: Thin container components that assemble features into complete pages.
-   `src/features`: Core application features (e.g., `auth`, `chat`, `game-play`). Each feature is a self-contained module.
-   `src/shared`: Common modules shared across the entire application (e.g., `apiClient`, UI components, utility hooks).

## ⚙️ Getting Started

### Prerequisites

-   Node.js (v18 or higher recommended)
-   npm

### 1. Environment Variables

Create a `.env.local` file in the `frontend` directory and add the following variables. Adjust the URLs to match your backend server configuration.

```env
# The base URL for the backend REST API
VITE_API_BASE_URL=http://localhost:8080

# The base URL for the WebSocket server
VITE_WS_BASE_URL=http://localhost:8080/ws
```

### 2. Installation

Navigate to the frontend directory and install the dependencies:

```bash
cd frontend
npm install
```

### 3. Running the Development Server

To start the local development server, run:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port).

### 4. Building for Production

To create a production-ready build, run:

```bash
npm run build
```

The optimized static files will be generated in the `frontend/dist` directory.

### 5. Linting

To check for code quality and style issues, run:

```bash
npm run lint
```