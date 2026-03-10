# SystemCraft Docker Guide

SystemCraft is fully containerized using a highly optimized, multi-stage Next.js Dockerfile constraint to `node:20-alpine`.

## Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed and running on your local machine.
- A populated `.env` file in the root directory (copy from `.env.example`). Your Next.js static build requires the `NEXT_PUBLIC_FIREBASE_*` variables to be present during the build process.

## Running Locally

The easiest way to build and run the application is using Docker Compose.

1. **Start the application (Builds if necessary):**
   ```bash
   docker-compose up --build -d
   ```
   *The `-d` flag runs the container in the background (detached mode).*

2. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`.

3. **Stop the application:**
   ```bash
   docker-compose down
   ```

4. **View live logs:**
   If you ran the container in detached mode, you can still view the server logs:
   ```bash
   docker-compose logs -f
   ```

## Production Architecture Notes

- **Standalone Mode:** The `next.config.ts` is configured with `output: "standalone"`. This prevents Docker from copying the entire bulk of `node_modules` into the final runner image, drastically saving space.
- **Environment Variables:** During the `builder` stage, Next.js "bakes" `NEXT_PUBLIC_` variables into the static frontend files. Ensure your `.env` is properly populated before running `docker-compose build`. If you change your `.env` file, you **must rebuild** the image for those changes to take effect on the client side.
- **Secret Management:** Server-side secrets (like MongoDB connections) are passed at runtime by `docker-compose.yml` reading the local `.env` file.
