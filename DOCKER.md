# Running SystemCraft with Docker

SystemCraft provides a fully configured Docker environment for easy local development, testing, and deployment.

## Prerequisites

Before getting started, ensure you have the following installed on your system:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

You also must have your environment variables configured. Create a `.env` file in the root directory (you can copy the provided `.env.example` file and fill in your values).

```bash
cp .env.example .env
```

---

## Quick Start

### 1. Build and Start

To build your containers and start the application in detached mode (running in the background), run:

```bash
docker-compose up --build -d
```

### 2. Access the Application

Once the containers are successfully running, the web application will be accessible in your localized environment.

Open your browser and navigate to:
[http://localhost:3000](http://localhost:3000)

---

## Useful Docker Commands

Here are some helpful commands for managing your SystemCraft Docker environment:

- **View live logs:**
  ```bash
  docker-compose logs -f
  ```

- **Stop all containers:**
  ```bash
  docker-compose down
  ```

- **Stop containers and remove associated volumes** (useful for a complete reset):
  ```bash
  docker-compose down -v
  ```

- **Rebuild specific services without cache:**
  ```bash
  docker-compose build --no-cache
  ```

---

## Troubleshooting

- **Port Conflicts:** If `http://localhost:3000` is already in use by another application, you can modify the port mapping in the `docker-compose.yml` file under the `web` service ports configuration (e.g., `"8080:3000"`).
- **Environment Variables:** If you encounter authentication or database errors on boot, ensure your `.env` contains the required keys (`NEXT_PUBLIC_FIREBASE_API_KEY`, `MONGODB_URL`, etc.). The Docker configuration automatically injects these public variables at build time and secret variables at runtime.
