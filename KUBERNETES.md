# Kubernetes: The Infrastructure Finale

SystemCraft's journey started with **Docker** for isolation, moved to **Nginx** for reverse proxying, and now concludes with **Kubernetes** for robust orchestration.

## 📁 Manifests Structure
- `deployment.yaml`: Defing a 3-replica stateful-ready application with resource limits.
- `service.yaml`: Internal connectivity via `ClusterIP`.
- `ingress.yaml`: External routing via Nginx Ingress Controller (completing the Nginx journey).

## 🚀 Deployment Strategy
The CI/CD pipeline in `.github/workflows/ci.yml` is now integrated with these manifests:
1. **Validation**: Every PR dry-runs the manifests to ensure zero syntax errors.
2. **Build**: Docker images are pushed to GitHub Container Registry (GHCR).
3. **Deploy**: Push to `main` triggers the deployment notification.

## 🛠️ Local Testing (Minikube/Kind)
To test the manifests locally:

```bash
# Create namespace
kubectl create namespace system-craft

# Apply manifests
kubectl apply -f kubernetes/ -n system-craft

# Verify pods
kubectl get pods -n system-craft
```

---

*This completes the full cycle: Dev -> Containerize -> Proxy -> Orchestrate.*
