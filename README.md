# Telehealth Patient Portal (Frontend)

[![React Build and Deploy](https://github.com/YourGitHubUsername/telehealth-frontend/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/YourGitHubUsername/telehealth-frontend/actions/workflows/deploy-frontend.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

This repository hosts the frontend React application for the Telehealth Patient Portal. Built with Vite and styled with Tailwind CSS, this application provides a responsive and intuitive user interface for managing patient records. It interacts with a separate ASP.NET Core API backend.

The application features:
* **User Authentication:** Secure login functionality.
* **Patient Management:** CRUD (Create, Read, Update, Delete) operations for patient data.
* **Search, Filter, Sort, and Pagination:** Efficient Browse of patient records.
* **Responsive Design:** Optimized for various screen sizes (desktop, tablet, mobile).
* **Intuitive UI/UX:** Modern design with collapsible forms and clear feedback.

## Live Demo

Experience the live application: [https://patients.kepekepe.com](https://patients.kepekepe.com)

**Demo Credentials:**
* **Email:** `demo@kepekepe.com`
* **Password:** `Demo@123`
*(Note: This is a read-only demo account to showcase functionality. Data modifications may not be saved or may be reset periodically.)*

## Technologies Used

* **Frontend Framework:** React 18+
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **HTTP Client:** Fetch API (native browser API)
* **State Management:** React Hooks (useState, useEffect, useContext)
* **Routing:** React Router DOM
* **Form Handling:** Controlled components
* **Authentication:** JWT token handling (client-side)

## Project Structure
telehealth-frontend/
├── public/              # Static assets (index.html, favicon)
├── src/
│   ├── assets/          # Images, icons
│   ├── components/      # Reusable UI components (PatientForm, PatientTable, LoginForm)
│   ├── context/         # React Context for global state (AuthContext, PatientContext)
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API integration logic (patientService.js, authService.js)
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Tailwind CSS directives and custom styles
├── .env                 # Environment variables (e.g., API_BASE_URL)
├── package.json         # Node.js project configuration
├── postcss.config.js    # PostCSS configuration for Tailwind CSS
├── tailwind.config.js   # Tailwind CSS configuration
├── vite.config.js       # Vite build configuration
└── ... (other standard React/Vite files)


## Setup and Development

### Prerequisites

* Node.js (LTS version recommended)
* npm or Yarn

### Configuration

1.  **API Base URL:**
    Create a `.env` file in the root of the `telehealth-frontend` directory (if it doesn't exist) and specify your backend API URL:
    ```
    VITE_API_BASE_URL=[https://patientsapi.kepekepe.com](https://patientsapi.kepekepe.com)
    ```
    *Note: `VITE_` prefix is required for environment variables to be exposed to the browser by Vite.*

### Running the Application Locally

1.  Navigate to the `telehealth-frontend` directory.
2.  Install dependencies:
    ```bash
    npm install
    # or yarn install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    # or yarn dev
    ```
    The application will typically run on `http://localhost:5173`.

### Building for Production

To create a production-ready build:
```bash
npm run build
# or yarn build
This will generate optimized static assets in the dist directory.

CI/CD Pipeline (GitHub Actions)
This repository includes a GitHub Actions workflow (.github/workflows/deploy-frontend.yml) that automates the build and deployment of the React application to your InterServer Plesk hosting.

Workflow Details:
Trigger: Pushes to the main branch.

Steps:

Checks out code.

Sets up Node.js.

Installs dependencies.

Builds the React application using Vite.

Deploys the dist directory contents via FTP/FTPS to patients.kepepe.com using ftp-deploy.

Secrets Used:

FTP_SERVER: Your FTP host (e.g., sXX.truehost.cloud)

FTP_USERNAME: Your FTP username for patients.kepepe.com

FTP_PASSWORD: Your FTP password for patients.kepepe.com

FTP_PORT: (Optional, usually 21 or 22 for SFTP, 990 for FTPS implicit)

FTP_TARGET_DIR: The target directory on your Plesk server (e.g., /httpdocs)

Troubleshooting
"Failed to fetch" errors:

Ensure the VITE_API_BASE_URL in your .env file (or build config) is correct (https://patientsapi.kepekepe.com).

Verify that the backend API (https://patientsapi.kepekepe.com) is running and accessible.

Check your browser's console for detailed CORS errors.

Blank page after deployment: Ensure your vite.config.js base property is set correctly if you're deploying to a sub-directory, or simply / for the root. For your setup, / is correct.

License
This project is licensed under the MIT License - see the LICENSE file for details.
