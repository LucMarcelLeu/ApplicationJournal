# ApplicationJournal

A personal job-application tracker built to manage applications in one place and keep a clear record of the job-search process.

ApplicationJournal was created as a practical alternative to maintaining a spreadsheet. It includes application tracking, document management, and PDF import support for application records.

## Features

- **Application overview** — view and manage job applications in a table.
- **Application status** — update the status of each application.
- **Application details** — store company, position, location, application date, notes, and status.
- **Document management** — upload, download, and delete related documents, such as job advertisements, cover letters, CVs, and correspondence.
- **PDF import preview** — extract application records from a RAV activity-report PDF and review the parsed results before importing.
- **Duplicate prevention** — support for checking imported applications to help avoid duplicate records.
- **Database health endpoint** — check whether the API can connect to the database.
- **Container-ready setup** — Docker-based database and frontend/API deployment configuration.

## Tech stack

| Area | Technology |
|---|---|
| Backend | ASP.NET Core Web API, .NET 10 |
| Data access | Entity Framework Core |
| Database | PostgreSQL 17 |
| Frontend | React, TypeScript, Vite |
| UI components | Material UI (MUI) |
| PDF text extraction | PdfPig |
| Containers / web server | Docker, nginx |

## Architecture

The project is split into a frontend and a backend API:

- `frontend/` — React application built with Vite and Material UI.
- `ApplicationJournal.Api/` — ASP.NET Core Web API and application logic.
- PostgreSQL — stores application data.
- Docker / nginx configuration — supports running the application in containers.

> Folder names and paths may differ slightly depending on the local checkout.

## Getting started

The exact commands depend on your local folder structure and Docker Compose configuration. The following is a general outline.

### Prerequisites

- .NET 10 SDK
- Node.js and npm
- PostgreSQL 17, or Docker with Docker Compose
- Git

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ApplicationJournal
```

### 2. Start the database

If the project includes a Docker Compose configuration for PostgreSQL, start the database from the directory containing that configuration:

```bash
docker compose up -d
```

Check the Compose file and application configuration for the database name, username, password, and port. Do not commit real passwords or other secrets.

### 3. Run the API

Open a terminal in the API project directory and run:

```bash
dotnet restore
dotnet build
dotnet run
```

Use the API URL printed by `dotnet run`. The development API has been configured to use port `5132` in the current local setup.

### 4. Run the frontend

Open another terminal in the frontend directory:

```bash
npm install
npm run dev
```

Vite normally prints the local frontend URL in the terminal. In the current development setup, this is `http://localhost:5173`.

Make sure the frontend's API base URL matches the API URL used by your local environment.

## PDF import

ApplicationJournal can preview application records extracted from a RAV activity-report PDF before importing them. The current parser recognises dates in the report format and returns a preview for review.

Import results can depend on the PDF layout. Review the preview before confirming an import, and verify the duplicate-checking behaviour against your own sample files.

## API

The API exposes endpoints for application records, status updates, document handling, PDF import preview, and database health checks.

Examples from the current implementation:

- `GET /api/applications` — retrieve applications.
- `PATCH /api/applications/{id}/status` — update an application's status.
- `POST /api/applications/import/text-preview` — preview records parsed from a PDF.
- `GET /api/health/database` — check database connectivity.

Confirm the full route definitions in the source code before relying on these examples; additional endpoints may be available.

## Configuration and security

Before publishing or deploying the project:

- Keep passwords, tokens, connection strings, and other secrets out of Git.
- Use environment variables or an untracked local configuration file for secrets.
- Check `.env` files, `appsettings*.json`, Docker Compose files, and frontend environment files for credentials.
- Do not publish real job-application documents or personal information.
- Configure production CORS, HTTPS, database access, and upload limits before exposing the app publicly.

## Project status

ApplicationJournal is an actively developed personal portfolio project. The core application workflow, document handling, database health check, and PDF import preview have been implemented. Features and setup instructions may evolve as development continues.

## License

No license has been specified yet. Unless a license is added, normal copyright restrictions apply and others should not assume they have permission to reuse or redistribute the code.
