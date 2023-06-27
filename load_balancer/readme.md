Setup Load Balancer (development)

```bash
kind create cluster --config=kind-config.yml --name algorint
# Apply metallb
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.13.7/config/manifests/metallb-native.yaml

# Check the pods are ready
kubectl wait --namespace metallb-system \
                --for=condition=ready pod \
                --selector=app=metallb \
                --timeout=90s

# Inspect available IP address
docker network inspect -f '{{.IPAM.Config}}' kind

# Change the IP address range available in the metallb-config.yaml file
# Apply the changed file
kubectl apply -f metallb-config.yaml

# Apply nginx ingress file
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait nginx finish deploy

Copy
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

kubectl apply -f nginx-ingress.yaml
```
