# Liar Game Frontend

This is the frontend for the Liar Game application, built with React and Material UI.

## Project Structure

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── GameInfoDisplay.jsx
│   │   └── PlayerProfile.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Components

### App.jsx
The main application component that sets up the layout with player profiles in the corners and the game information display in the center.

### PlayerProfile.jsx
Displays a player's avatar and nickname. Highlights the current player's turn with a visual indicator.

### GameInfoDisplay.jsx
Shows the central game information, including the current round, topic, and game status.

## Setup Instructions

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Technologies Used

- React.js (Vite-based)
- Material UI (MUI) v5
- Material Icons (@mui/icons-material)

## Features

- Responsive layout with player profiles positioned in the corners
- Central game information display
- Visual highlighting for the current player's turn
- Dummy data for testing and development