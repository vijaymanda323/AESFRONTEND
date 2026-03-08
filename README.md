# AES Frontend — Dynamic AES Encryption with LFSR-based Key Evolution

A React + Vite frontend for the **Dynamic AES Encryption with LFSR-based Key Evolution** cybersecurity project. This application provides an interactive UI for AES-128 encryption/decryption and cryptographic analysis, communicating with a FastAPI backend.

---

## Prerequisites

Make sure you have the following installed before proceeding:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher

---

## Installation

1. **Clone the repository** (or navigate into the project folder):

   ```bash
   git clone <repository-url>
   cd aesfrontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

---

## Available Scripts

### Start Development Server

Starts the app in development mode with Hot Module Replacement (HMR):

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

---

### Build for Production

Compiles and bundles the app for production:

```bash
npm run build
```

Output is placed in the `dist/` folder.

---

### Preview Production Build

Locally preview the production build before deploying:

```bash
npm run preview
```

---

### Lint

Run ESLint to check for code quality issues:

```bash
npm run lint
```

---

## Project Structure

```
aesfrontend/
├── public/           # Static assets
├── src/
│   ├── App.jsx       # Main application component
│   ├── App.css       # Application styles
│   └── index.css     # Global styles
├── index.html
├── package.json
└── vite.config.js
```

---

## Backend

This frontend connects to a **FastAPI** backend. Make sure the backend server is running before using encryption/decryption or analysis features.

> **Default backend URL:** `http://localhost:8000`
