# URL Shortener

A full-stack URL shortener application built with Spring Boot (Java) backend and React (TypeScript) frontend.

## Features

- ✅ Accept a full URL and return a shortened URL
- ✅ Persist shortened URLs across restarts (H2 file database)
- ✅ Customize shortened URLs with user-provided aliases
- ✅ Decoupled React frontend with modern UI
- ✅ RESTful API matching OpenAPI specification
- ✅ Delete shortened URLs via API
- ✅ Comprehensive test coverage
- ✅ Docker containerization for easy deployment

## Technology Stack

### Backend
- **Java 17** - Programming language
- **Spring Boot 3.5.7** - Framework
- **Spring Data JPA** - Database persistence
- **H2 Database** - Embedded file-based database
- **Gradle** - Build tool

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework
- **Nginx** - Production web server (Docker)

## Prerequisites

- **Java 17+** (for backend)
- **Node.js 20+** and npm (for frontend)
- **Docker & Docker Compose** (optional, for containerized deployment)

## Project Structure

```
.
├── Backend/                 # Spring Boot backend application
│   ├── src/
│   │   ├── main/java/      # Java source code
│   │   └── resources/      # Configuration files
│   └── src/test/           # Test source code
├── Frontend/                # React frontend application
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # React components
│   │   └── __tests__/      # Test files
│   └── dist/               # Built static files (after build)
├── docker-compose.yml       # Docker orchestration
├── openapi.yaml             # API specification
└── README.md               # This file
```

## Quick Start

### Option 1: Docker (Recommended)

The easiest way to run the entire application:

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

To stop:
```bash
docker-compose down
```

For detailed Docker instructions, see [DOCKER.md](./DOCKER.md) if available.

### Option 2: Local Development

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd Backend
```

2. Run the application:
```bash
# Windows
.\gradlew bootRun

# Linux/Mac
./gradlew bootRun
```

The backend will start on http://localhost:8080

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on http://localhost:3000

**Note**: The frontend uses a Vite dev proxy configured to forward `/api/*` requests to `http://localhost:8080/*`, so make sure the backend is running first.

## Building for Production

### Backend

```bash
cd Backend
./gradlew build
```

The JAR file will be created in `Backend/build/libs/`

### Frontend

```bash
cd Frontend
npm run build
```

The production build will be in `Frontend/dist/`

## API Usage

The API follows the OpenAPI specification in `openapi.yaml`. Here are some examples:

### Shorten a URL

```bash
curl -X POST http://localhost:8080/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "fullUrl": "https://example.com/very/long/url"
  }'
```

Response:
```json
{
  "shortUrl": "http://localhost:8080/abc123"
}
```

### Shorten with Custom Alias

```bash
curl -X POST http://localhost:8080/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "fullUrl": "https://example.com/very/long/url",
    "customAlias": "my-custom-alias"
  }'
```

### List All URLs

```bash
curl http://localhost:8080/urls
```

Response:
```json
[
  {
    "alias": "my-custom-alias",
    "fullUrl": "https://example.com/very/long/url",
    "shortUrl": "http://localhost:8080/my-custom-alias"
  }
]
```

### Redirect to Full URL

```bash
curl -L http://localhost:8080/my-custom-alias
```

This will redirect to the original URL.

### Delete a Shortened URL

```bash
curl -X DELETE http://localhost:8080/my-custom-alias
```

## Frontend Usage

1. Open http://localhost:3000 in your browser
2. Enter a full URL in the "Shorten a URL" form
3. Optionally provide a custom alias
4. Click "Shorten URL"
5. Copy the generated short URL using the copy button
6. View all shortened URLs in the table below
7. Delete URLs using the delete button in the table

## Testing

### Backend Tests

```bash
cd Backend
./gradlew test
```

### Frontend Tests

```bash
cd Frontend
npm test
```

## Configuration

### Backend Configuration

The backend uses `application.properties` for configuration:
- Database: H2 file-based database stored in `Backend/data/`
- Port: 8080 (default)
- H2 Console: Available at http://localhost:8080/h2-console (when enabled)

### Frontend Configuration

- Development: Uses Vite dev proxy for API requests
- Production: Uses environment variable `VITE_API_BASE_URL` or defaults to `/api` (nginx proxy)

## Notes and Assumptions

1. **Database**: Uses H2 file-based database for simplicity. Data persists in `Backend/data/` directory. For production, consider using PostgreSQL or MySQL.

2. **Alias Generation**: Auto-generated aliases are 6 characters long (alphanumeric). Custom aliases can be any valid string.

3. **URL Validation**: Both backend and frontend validate URL format. URLs must include protocol (http:// or https://).

4. **CORS**: In Docker setup, Nginx handles CORS by proxying requests. In local development, Vite proxy handles this.

5. **Error Handling**: 
   - 400: Invalid input or alias already exists
   - 404: Alias not found
   - Proper error messages are returned in JSON format

6. **Security**: 
   - Input validation on both client and server
   - URL encoding for special characters in aliases
   - Security headers in production (Nginx)

7. **Persistence**: H2 database file is persisted in Docker volume or `Backend/data/` directory.

## Development

### Backend Development

- Main application: `Backend/src/main/java/com/tpx/urlshortener/BackendApplication.java`
- API Controller: `Backend/src/main/java/com/tpx/urlshortener/controller/UrlController.java`
- Service layer: `Backend/src/main/java/com/tpx/urlshortener/service/`
- Tests: `Backend/src/test/java/`

### Frontend Development

- Entry point: `Frontend/src/main.tsx`
- Main component: `Frontend/src/App.tsx`
- API client: `Frontend/src/api/client.ts`
- Components: `Frontend/src/components/`
- Tests: `Frontend/src/**/__tests__/`

## Troubleshooting

### Port Already in Use

If port 8080 or 3000 is already in use:
- **Backend**: Change `server.port` in `application.properties`
- **Frontend**: Change port in `vite.config.ts` or use `docker-compose.yml` port mapping
- **Docker**: Update port mappings in `docker-compose.yml`

### Database Issues

To reset the database:
```bash
# Local
rm -rf Backend/data/*

# Docker
docker-compose down -v
docker-compose up
```

### Frontend Not Connecting to Backend

- Ensure backend is running on port 8080
- Check browser console for errors
- Verify Vite proxy configuration in `vite.config.ts`
- In Docker, ensure both services are on the same network

## License

This project is part of a coding task/assessment.

## Author

Built as part of a URL Shortener coding task implementation.
