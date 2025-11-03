# Docker Setup Guide

This project includes Docker support for both the backend and frontend services.

## Prerequisites

- Docker Engine 20.10+ 
- Docker Compose v2.0+

## Quick Start

Build and run both services:

```bash
docker-compose up --build
```

This will:
- Build the Spring Boot backend Docker image
- Build the React frontend Docker image with Nginx
- Start both containers
- Create a persistent volume for the H2 database

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

## Services

### Backend (url-shortener-backend)
- **Port**: 8080
- **Image**: Built from `Backend/Dockerfile`
- **Database**: H2 file database persisted in Docker volume
- **Health Check**: Checks `/urls` endpoint

### Frontend (url-shortener-frontend)
- **Port**: 3000 (mapped to container port 80)
- **Image**: Built from `Frontend/Dockerfile`
- **Web Server**: Nginx Alpine
- **API Proxy**: Nginx proxies `/api/*` to backend

## Docker Commands

### Build and start services
```bash
docker-compose up --build
```

### Start in detached mode
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend

# Follow logs
docker-compose logs -f
```

### Rebuild specific service
```bash
docker-compose build backend
docker-compose build frontend
```

### Execute commands in containers
```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh
```

## Development

For local development, you can still run the services directly:

### Backend
```bash
cd Backend
./gradlew bootRun
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

## Production Deployment

For production deployment:

1. Update environment variables in `docker-compose.yml`
2. Consider using environment-specific configuration files
3. Use a production database (PostgreSQL, MySQL) instead of H2
4. Configure proper SSL/TLS certificates
5. Set up reverse proxy (Traefik, Nginx) if needed

## Troubleshooting

### Port conflicts
If ports 3000 or 8080 are already in use, update them in `docker-compose.yml`:
```yaml
ports:
  - "3001:80"  # Frontend
  - "8081:8080"  # Backend
```

### Database data persistence
The H2 database is stored in a Docker volume `backend-data`. To reset:
```bash
docker-compose down -v
docker-compose up
```

### View container status
```bash
docker-compose ps
```

### Check container logs for errors
```bash
docker-compose logs backend
docker-compose logs frontend
```

