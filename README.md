# AI Study Assistant

A local-first, privacy-conscious learning application that allows users to master complex topics through iterative testing. It leverages Generative AI (Gemini) to create increasingly difficult challenges based on existing performance.

## 🚀 Quick Start

1. **Start the Application**:
   Type `tutoring` in your terminal (if you've sourced your `~/.zshrc`) or run:
   ```bash
   ./start.sh
   ```

2. **Access the App**:
   Open [http://localhost:5173/](http://localhost:5173/) in your browser.

## 🛠 Features

- **Local-First Storage**: All tests, history, and notes are stored locally in the `data/` directory.
- **AI Prompt Generator**: Create custom prompts for Gemini to generate high-quality tests for any topic.
- **Iterative Testing**: Track your progress with visual charts and compare current scores with your personal bests.
- **Library Management**: Rename topics, archive old versions, or delete tests permanently.
- **Detailed Feedback**: Review correct and incorrect answers with an accordion-style summary.

## 🏗 Architecture

- **Frontend**: React, TypeScript, Vite, Tailwind CSS 4, Recharts, Lucide-React.
- **Backend**: Node.js, Express, TypeScript.
- **Data**: JSON-based file persistence.

## 📁 Directory Structure

- `frontend/`: React application logic and UI.
- `backend/`: Express server and API endpoints.
- `data/`: Local storage for tests, history, and notes (Git ignored).
- `goal.md`: Project manifesto and roadmap.

## 📝 Development

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

---
*Created on June 10, 2026*
