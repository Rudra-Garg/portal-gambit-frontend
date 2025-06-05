# Portal Gambit: Frontend - A Revolutionary Chess Experience ♟️🌀

**Live Demo:** [(portal-gambit.web.app) ](https://portal-gambit.web.app/) 

**Backend Repository:**  [github.com/Rudra-Garg/portal-gambit-backend](https://github.com/Rudra-Garg/Portal-Gambit-Backend)

---

## 🌟 Overview

Portal Gambit is not just another chess game; it's a dynamic and strategic evolution of the classic. This project brings an innovative twist to traditional chess by introducing **player-controlled portals**, allowing pieces to teleport across the board, opening up a universe of new tactical possibilities and mind-bending strategies.

This repository hosts the **frontend** of Portal Gambit, a responsive and engaging web application built with **React, Vite, and Tailwind CSS**, featuring real-time gameplay powered by **Firebase**. It seamlessly connects to a FastAPI backend for user management, game history, and more.

Whether you're a chess aficionado looking for a fresh challenge, a strategy game enthusiast, or a developer interested in modern web technologies, Portal Gambit offers a unique and exciting experience.

---

## 🚀 Project Highlights 

*   **🥇 Innovative Gameplay Logic:**
    *   Developed a custom chess engine (`CustomChessEngine.js`) extending `chess.js` to implement unique portal mechanics, including piece teleportation, path blocking, and simultaneous piece presence.
    *   Complex state management for portal placement, piece movement through portals, and game rules.
*   **🌐 Real-time Multiplayer Experience:**
    *   Leveraged **Firebase Realtime Database** for instant synchronization of game state (FEN, portal locations, turns, timers) between players.
    *   Implemented real-time in-game chat (text) and experimental voice chat using **PeerJS** and Firebase for signaling, enhancing player interaction.
*   **💻 Modern & Performant Frontend Stack:**
    *   Built with **React** and **Vite** for a fast development experience and optimized production builds.
    *   Styled with **Tailwind CSS** for a utility-first, responsive, and customizable UI.
    *   Enhanced user experience with smooth animations and transitions using **Framer Motion**.
*   **🔥 Firebase Ecosystem Integration:**
    *   Secure user authentication (email/password & Google OAuth) managed by **Firebase Authentication**.
    *   Real-time data persistence and synchronization for game sessions.
*   **🔧 Advanced React Development:**
    *   Extensive use of **custom React hooks** to encapsulate complex game logic, state management (game state, chat, voice chat, timers, lost pieces, move history, rematch handling, archiving), and side effects, promoting code reusability and separation of concerns.
    *   Strong component-based architecture for a modular and maintainable codebase.
*   **🔄 CI/CD & Deployment:**
    *   Automated build and deployment pipelines to **Firebase Hosting** using **GitHub Actions**.
    *   Separate workflows for deploying to a live channel on `main` branch merges and preview channels for pull requests.
*   **🔒 Secure Environment Variable Management:**
    *   Client-side Firebase configurations managed via `.env` files and securely injected into CI/CD pipelines using GitHub Secrets.
*   **🎨 Custom UI Elements:**
    *   Designed and implemented custom SVG chess pieces for a unique visual identity.
    *   Dynamic chessboard styling to visually represent portals and available moves.

---

## ✨ Key Features

*   **Portal Chess Mechanics:** Players can place pairs of portals on empty squares, costing a turn. Pieces moving through a portal exit from its linked counterpart.
*   **Standard Chess Rules:** Adheres to fundamental chess movements and capture rules, with portals adding a new layer.
*   **User Authentication:** Secure sign-up and login with email/password and Google.
*   **Real-time Gameplay:** See opponent's moves and portal placements instantly.
*   **Game Timers:** Timed matches with individual clocks for each player.
*   **In-Game Chat:** Communicate with your opponent via text chat.
*   **Voice Chat (Experimental):** Opt-in voice communication with opponents using PeerJS.
*   **Game Lobbies & Matchmaking:** Create new games with custom settings (time control, portal limits) or join existing ones.
*   **Player Profiles & Match History:** (Displayed from backend data) View your stats and past games.
*   **Lost Pieces Display:** Track captured pieces for both players.
*   **Interactive UI:** Animated piece movements, portal placements, and UI transitions with Framer Motion.
*   **Responsive Design:** Playable across various screen sizes, from desktop to mobile.
*   **Visual Feedback:** Clear indicators for selected pieces, valid moves, portal locations, and active portal placement mode.
*   **Rematch Functionality:** Option to request and accept rematches after a game concludes.
*   **Game Archiving:** Finished games are archived for history and analytics.

---

## 🛠️ Tech Stack

*   **Frontend:** React (v18), Vite
*   **Language:** JavaScript (ES6+)
*   **Styling:** Tailwind CSS (v4)
*   **Animation:** Framer Motion
*   **State Management:** React Context API, Custom Hooks
*   **Real-time Database & Auth:** Firebase (Realtime Database, Authentication)
*   **Routing:** React Router (v7)
*   **Chess Logic:** chess.js (extended with `CustomChessEngine.js`)
*   **Build Tool:** Vite
*   **Deployment:** Firebase Hosting
*   **CI/CD:** GitHub Actions
*   **Voice Chat (P2P):** PeerJS
*   **Linting:** ESLint

---

## 🖼️ Demo GIFs
**Landing Page**
![Landing](https://github.com/Rudra-Garg/portal-gambit-frontend/blob/main/media/Landing.gif)

**Profile and Game Page**
![game](https://github.com/Rudra-Garg/portal-gambit-frontend/blob/main/media/game.gif)

---

## 📁 Project Structure

A brief overview of the frontend directory structure:
Use code with caution.
```Markdown
portal-gambit-frontend/
├── .github/workflows/ # CI/CD workflows for Firebase deployment
├── public/ # Static assets (favicons, custom piece SVGs)
├── src/
│ ├── assets/ # Other static assets used in components
│ ├── components/ # React components
│ │ ├── auth/ # Authentication related components (LoginModal, SignupModal)
│ │ ├── common/ # Reusable common components (Modal)
│ │ ├── game/ # Core game components (PortalChessGame, ChessboardWrapper, etc.)
│ │ │ ├── components/ # Sub-components for the game screen
│ │ │ ├── hooks/ # Custom hooks for game logic
│ │ │ └── utils/ # Utility functions for the game
│ │ └── profile/ # User profile and game setup components
│ ├── contexts/ # React Context (AuthContext)
│ ├── firebase/ # Firebase configuration (config.js)
│ ├── utils/ # General utility functions (animations, profileUtils)
│ ├── App.jsx # Main application component with routing
│ ├── config.js # Backend URL configuration
│ ├── main.jsx # Entry point of the React application
│ └── index.css # Main CSS file (imports Tailwind)
├── .env.example # Example environment variables file
├── .firebaserc # Firebase project configuration
├── firebase.json # Firebase hosting configuration
├── package.json # Project dependencies and scripts
├── vite.config.js # Vite configuration
└── tailwind.config.js # Tailwind CSS configuration
```
---

## ⚙️ Environment Variables

This project uses environment variables for Firebase configuration. Create a `.env` file in the root directory by copying `.env.example` (if provided) or by using the following template:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
VITE_FIREBASE_DATABASE_URL=your_firebase_database_url
VITE_BACKEND_URL=http://localhost:8080 # Or your deployed backend URL
```
Replace your_firebase_... with your actual Firebase project credentials. These variables are loaded by Vite during development and build. For deployment via GitHub Actions, these are configured as repository secrets.

🚀 Setup & Installation
Clone the repository:
```bash
git clone [Your Frontend Repository URL]
cd portal-gambit-frontend
```

Install Node.js and npm/yarn:
Ensure you have Node.js (v18 or later recommended) and npm (or yarn) installed.
Install dependencies:
```
npm install
# or
yarn install
```
Set up environment variables:

Create a .env file in the root directory as described in the "Environment Variables" section above and populate it with your Firebase project details and backend URL.
▶️ Running the Application
Development Mode:
To start the development server with hot reloading:
```
npm run dev
```
This will typically open the application at http://localhost:5173 (or the next available port). The --host flag in the dev script allows access from other devices on your local network.
Production Build:
To create an optimized production build:
```
npm run build
```
The built files will be in the dist/ directory.
Preview Production Build:
To preview the production build locally:
```
npm run preview
```
☁️ Deployment

This frontend is configured for deployment to Firebase Hosting.
CI/CD with GitHub Actions:

The .github/workflows/firebase-hosting-merge.yml workflow automatically builds and deploys the main branch to the live Firebase Hosting channel.

The .github/workflows/firebase-hosting-pull-request.yml workflow automatically builds and deploys pull requests to a preview channel on Firebase Hosting, allowing for easy review before merging.

Firebase Configuration:
.firebaserc specifies the default Firebase project (portal-gambit).
firebase.json configures Firebase Hosting to serve the dist directory and handle single-page application (SPA) routing.
