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

## Sealed Secrets (Bitnami)

SystemCraft uses [Bitnami Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) to store encrypted secrets in Git. The sealed-secrets controller running in the cluster decrypts them into regular Kubernetes Secrets at deploy time.

### Why Sealed Secrets?

| Problem | Solution |
|---|---|
| `mongodb-secret` created manually via `kubectl create secret` — not in Git | Encrypted `SealedSecret` lives in the repo, version-controlled |
| Cluster rebuild loses all secrets | Secrets are restored automatically from Git |
| Breaks GitOps — ArgoCD can't manage what's not in Git | ArgoCD syncs sealed secrets like any other manifest |

### Prerequisites

1. **Install the Sealed Secrets controller** in your cluster:
   ```bash
   helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
   helm install sealed-secrets sealed-secrets/sealed-secrets \
     --namespace kube-system \
     --set-string fullnameOverride=sealed-secrets
   ```

2. **Install the `kubeseal` CLI** locally:
   ```bash
   # macOS
   brew install kubeseal

   # Linux
   wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.27.3/kubeseal-0.27.3-linux-amd64.tar.gz
   tar -xvzf kubeseal-*.tar.gz kubeseal
   sudo install -m 755 kubeseal /usr/local/bin/kubeseal

   # Windows (scoop)
   scoop install kubeseal
   ```

### Creating a Sealed Secret

**Step 1 — Generate a raw Secret (never committed):**
```bash
kubectl create secret generic systemcraft-secrets \
  --namespace default \
  --from-literal=mongodb-uri='mongodb+srv://user:password@cluster.mongodb.net/systemcraft' \
  --from-literal=openrouter-api-key='sk-or-v1-your-key' \
  --from-literal=firebase-service-account-key='{"type":"service_account",...}' \
  --dry-run=client -o yaml > /tmp/raw-secret.yaml
```

**Step 2 — Encrypt it with `kubeseal`:**
```bash
kubeseal \
  --controller-name sealed-secrets \
  --controller-namespace kube-system \
  --format yaml \
  < /tmp/raw-secret.yaml \
  > kubernetes/sealed-secrets/systemcraft-sealed-secret.yaml
```

**Step 3 — Clean up and commit:**
```bash
# Delete the plaintext — never commit this
rm /tmp/raw-secret.yaml

# Commit the encrypted version — safe for Git
git add kubernetes/sealed-secrets/systemcraft-sealed-secret.yaml
git commit -m "feat(secrets): add sealed secret for systemcraft"
```

### How It Works

```
┌─────────────┐     kubeseal      ┌──────────────────┐
│ Raw Secret  │ ──────────────▶  │  SealedSecret    │
│ (plaintext) │   encrypts with   │  (encrypted YAML)│
│ NEVER in Git│   cluster cert    │  ✅ Safe for Git  │
└─────────────┘                   └────────┬─────────┘
                                           │
                                    git push / ArgoCD sync
                                           │
                                           ▼
                               ┌───────────────────────┐
                               │ Sealed Secrets        │
                               │ Controller (in-cluster)│
                               │ Decrypts → K8s Secret │
                               └───────────────────────┘
```

### Rotating Secrets

To rotate a secret (e.g., new MongoDB password):

```bash
# 1. Create a new raw secret with updated values
kubectl create secret generic systemcraft-secrets \
  --namespace default \
  --from-literal=mongodb-uri='mongodb+srv://user:NEW_PASSWORD@...' \
  --from-literal=openrouter-api-key='sk-or-v1-...' \
  --from-literal=firebase-service-account-key='...' \
  --dry-run=client -o yaml > /tmp/raw-secret.yaml

# 2. Re-encrypt
kubeseal --controller-name sealed-secrets \
  --controller-namespace kube-system \
  --format yaml \
  < /tmp/raw-secret.yaml \
  > kubernetes/sealed-secrets/systemcraft-sealed-secret.yaml

# 3. Clean up, commit, and push
rm /tmp/raw-secret.yaml
git add kubernetes/sealed-secrets/systemcraft-sealed-secret.yaml
git commit -m "chore(secrets): rotate mongodb credentials"
git push

# 4. ArgoCD auto-syncs → controller decrypts → pods restart with new secret
```

### Helm Chart Integration

The Helm chart includes a conditional `SealedSecret` template. Enable it per-environment:

```bash
# Dev — uses plain secrets (create manually)
helm install systemcraft-dev ./helm/systemcraft \
  -f helm/systemcraft/values-dev.yaml

# Prod — uses sealed secrets (auto-decrypted)
helm install systemcraft-prod ./helm/systemcraft \
  -f helm/systemcraft/values-prod.yaml
```

In dev, create the secret manually:
```bash
kubectl create secret generic systemcraft-secrets \
  --from-literal=mongodb-uri='your-dev-connection-string' \
  --from-literal=openrouter-api-key='your-dev-key' \
  --from-literal=firebase-service-account-key='your-dev-sa-key'
```

### Backup: Export the Sealing Key

The sealed-secrets controller generates a sealing key pair. **If the cluster is destroyed, you need this key to decrypt existing sealed secrets.** Back it up:

```bash
kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml > sealing-key-backup.yaml
```

Store this backup securely (e.g., in a password manager or cloud KMS) — **never in Git**.

---

*This completes the full cycle: Dev -> Containerize -> Proxy -> Orchestrate -> Autoscale -> Monitor -> Alert -> Encrypt.*

