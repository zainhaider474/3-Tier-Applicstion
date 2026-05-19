# 📋 Task Manager — Docker Compose Practice App

A full three-tier web application built for Docker learning.

```
Frontend (React + Nginx)  →  Backend (Node.js + Express)  →  Database (PostgreSQL)
      :3000                          :5000                          :5432
```

---

## 📁 Project Structure

```
taskmanager/
├── frontend/
│   ├── src/
│   │   ├── App.js          ← React UI (Kanban board)
│   │   ├── index.js        ← React entry point
│   │   └── index.css       ← Styles
│   ├── public/
│   │   └── index.html
│   ├── nginx.conf          ← Nginx config (serves React + proxies /api)
│   ├── Dockerfile          ← Multi-stage: build React → serve with Nginx
│   └── package.json
│
├── backend/
│   ├── index.js            ← Express API with full CRUD
│   ├── Dockerfile          ← Node.js container
│   └── package.json
│
├── docker-compose.yml      ← Orchestrates all 3 tiers
└── README.md
```

---

## 🎯 PHASE 1 — Run containers individually (no Compose)

This phase helps you understand how Docker containers work before using Compose.

### Step 1: Create a Docker network

Containers need a network to talk to each other:

```bash
docker network create taskmanager-net
```

### Step 2: Start the Database container

```bash
docker run -d \
  --name db \
  --network taskmanager-net \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=taskmanager \
  -p 5432:5432 \
  postgres:15-alpine
```

### Step 3: Build and run the Backend container

```bash
# Navigate into backend folder
cd backend

# Build the image
docker build -t taskmanager-backend .

# Run the container
docker run -d \
  --name backend \
  --network taskmanager-net \
  -e DB_HOST=db \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=taskmanager \
  -p 5000:5000 \
  taskmanager-backend
```

**Test the backend:**
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok","message":"Backend is running!"}

curl http://localhost:5000/api/tasks
# Should return: []
```

### Step 4: Build and run the Frontend container

```bash
# Navigate into frontend folder (from project root)
cd frontend

# Build the image
docker build -t taskmanager-frontend .

# Run the container
docker run -d \
  --name frontend \
  --network taskmanager-net \
  -p 3000:80 \
  taskmanager-frontend
```

**Open in browser:** http://localhost:3000

> ⚠️ Note: In this phase, the frontend uses Nginx to proxy `/api` to the `backend`
> service name. This works because both containers are on the same Docker network.

### Step 5: Clean up Phase 1 containers

```bash
docker stop frontend backend db
docker rm frontend backend db
docker network rm taskmanager-net
```

---

## 🚀 PHASE 2 — Run everything with Docker Compose

Now let Docker Compose handle networking, ordering, and configuration automatically.

### Start all services

```bash
# From the project root (where docker-compose.yml is)
docker compose up --build
```

- `--build` forces Docker to rebuild images
- All three services start in the correct order (db → backend → frontend)

### Access the app

| Service  | URL                              |
|----------|----------------------------------|
| Frontend | http://localhost:3000            |
| Backend  | http://localhost:5000/api/tasks  |
| Database | localhost:5432 (use a DB client) |

### Run in background (detached mode)

```bash
docker compose up --build -d
```

### View logs

```bash
docker compose logs            # All services
docker compose logs backend    # Just backend
docker compose logs -f         # Follow live logs
```

### Stop everything

```bash
docker compose down            # Stop and remove containers
docker compose down -v         # Also delete the database volume (fresh start)
```

---

## 🔌 API Reference

| Method | Endpoint          | Description        |
|--------|-------------------|--------------------|
| GET    | /api/health       | Health check       |
| GET    | /api/tasks        | List all tasks     |
| GET    | /api/tasks/:id    | Get one task       |
| POST   | /api/tasks        | Create a task      |
| PUT    | /api/tasks/:id    | Update a task      |
| DELETE | /api/tasks/:id    | Delete a task      |

**Example POST body:**
```json
{
  "title": "Learn Docker",
  "description": "Practice with this app",
  "status": "todo"
}
```

---

## 🧪 Useful Docker Commands to Practice

```bash
# List running containers
docker ps

# List all images
docker images

# Inspect a container
docker inspect backend

# See container logs
docker logs backend

# Execute a command inside a running container
docker exec -it backend sh
docker exec -it db psql -U postgres -d taskmanager

# Inside psql, try:
# \dt                    — list tables
# SELECT * FROM tasks;   — see all tasks
# \q                     — quit

# Check Docker Compose service status
docker compose ps
```

---

## 💡 Key Concepts Demonstrated

| Concept              | Where to see it                                      |
|----------------------|------------------------------------------------------|
| Multi-stage build    | `frontend/Dockerfile` (build → nginx)                |
| Service discovery    | Backend uses `DB_HOST=db` (service name as hostname) |
| Health checks        | `docker-compose.yml` → db service                    |
| Volume persistence   | `postgres-data` volume keeps DB data after restart   |
| Nginx reverse proxy  | `frontend/nginx.conf` proxies `/api` to backend      |
| Env variables        | All config passed via `environment:` in Compose      |
| depends_on           | Startup order: db → backend → frontend               |
| Bridge network       | `app-network` lets services communicate              |
