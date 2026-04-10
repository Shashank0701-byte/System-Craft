# Kubernetes: The Infrastructure Finale

SystemCraft's journey started with **Docker** for isolation, moved to **Nginx** for reverse proxying, and now concludes with **Kubernetes** for robust orchestration.

## Manifests Structure
- `deployment.yaml`: Runs the SystemCraft web app with resource requests and limits.
- `service.yaml`: Exposes the app internally with a `ClusterIP` service.
- `ingress.yaml`: Routes external traffic through the Nginx Ingress Controller.
- `hpa.yaml`: Adds a `Horizontal Pod Autoscaler (HPA)` so Kubernetes can scale pods based on CPU utilization.

## Horizontal Pod Autoscaler (HPA)
The HPA watches the `system-craft` deployment and adjusts the replica count automatically.

- Minimum replicas: `3`
- Maximum replicas: `10`
- CPU target: `70%` average utilization

This works best when the cluster has the Metrics Server installed, since HPA depends on resource metrics to make scaling decisions.

## Deployment Strategy
The CI/CD pipeline in `.github/workflows/ci.yml` is designed to work with these manifests:
1. **Validation**: Every PR can dry-run the manifests to catch syntax issues early.
2. **Build**: Docker images are pushed to GitHub Container Registry (GHCR).
3. **Deploy**: Changes to `main` can be rolled out through the Kubernetes manifests.

## Local Testing (Minikube/Kind)
To test the manifests locally:

```bash
# Create namespace
kubectl create namespace system-craft

# Apply manifests
kubectl apply -f kubernetes/ -n system-craft

# Verify pods
kubectl get pods -n system-craft

# Verify autoscaler
kubectl get hpa -n system-craft
```

## Notes
- The fixed replica count in `deployment.yaml` becomes the HPA baseline.
- If you want HPA to work in a local cluster, install Metrics Server first.
- CPU-based autoscaling is a solid starting point, but memory or custom metrics can be added later.

---

*This completes the full cycle: Dev -> Containerize -> Proxy -> Orchestrate -> Autoscale.*
