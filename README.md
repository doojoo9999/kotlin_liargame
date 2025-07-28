# Kotlin Liar Game Monorepo

This project is structured as a monorepo containing a Kotlin backend and a Vue 3 frontend.

## Project Structure

```
kotlin_liargame/
戍式式 frontend/             # Vue 3 frontend application
弛   戍式式 public/           # Static assets
弛   戍式式 src/              # Vue source code
弛   弛   戍式式 assets/       # Frontend assets (CSS, images)
弛   弛   戍式式 components/   # Vue components
弛   弛   戍式式 App.vue       # Main Vue component
弛   弛   戌式式 main.js       # Vue application entry point
弛   戍式式 package.json      # Frontend dependencies
弛   戌式式 vite.config.js    # Vite configuration
戍式式 src/                  # Kotlin backend source code
弛   戍式式 main/             # Main source code
弛   戌式式 test/             # Test source code
戍式式 package.json          # Root package.json for monorepo configuration
戍式式 build.gradle.kts      # Gradle build configuration
戌式式 settings.gradle.kts   # Gradle settings
```

## Frontend

The frontend is a Vue 3 application built with Vite. It's located in the `frontend/` directory and can be managed using npm commands.

### Development

To run the frontend development server:

```bash
# From the root directory
npm run frontend:dev

# Or directly from the frontend directory
cd frontend
npm run dev
```

### Building for Production

To build the frontend for production:

```bash
# From the root directory
npm run frontend:build

# Or directly from the frontend directory
cd frontend
npm run build
```

### Preview Production Build

To preview the production build:

```bash
# From the root directory
npm run frontend:preview

# Or directly from the frontend directory
cd frontend
npm run preview
```

## Backend

The backend is a Kotlin application using Spring Boot. It's managed using Gradle.

To run the backend:

```bash
./gradlew bootRun
```

To build the backend:

```bash
./gradlew build
```

## Monorepo Structure

This project uses npm workspaces to manage the monorepo structure. The root `package.json` file defines the frontend directory as a workspace, which allows for efficient dependency management.

The project follows the standard npm workspace monorepo structure:
- There is only one `package-lock.json` file at the root level, which manages dependencies for all workspaces
- Dependencies are hoisted to the root `node_modules` directory when possible
- The frontend has its own `package.json` file for its specific dependencies

## Recommendations for Future Development

1. **Add TypeScript**: Consider adding TypeScript to the frontend for better type safety and developer experience.

2. **Add Vue Router**: If the application requires multiple pages, add Vue Router for client-side routing.

3. **Add Pinia or Vuex**: For state management, consider adding Pinia (recommended for Vue 3) or Vuex.

4. **Improve Backend-Frontend Integration**: Consider adding API client generation or shared types between backend and frontend.

5. **Add ESLint and Prettier**: For consistent code style in the frontend.

6. **Add CI/CD Pipeline**: Set up continuous integration and deployment for both frontend and backend.

7. **Add Documentation**: Add more detailed documentation for both frontend and backend components.

8. **Add End-to-End Tests**: Consider adding end-to-end tests using tools like Cypress or Playwright.