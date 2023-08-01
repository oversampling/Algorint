```
cd cee
kubectl apply --server-side -f ./kubernetes/development/keda-2.11.0.yaml
kubectl apply -f kubernetes/development/cee-namespace.yml
kubectl apply -f ./kubernetes/development/cee-secrets.yml
kubectl apply -f ./kubernetes/development/cee-deployment.yml
kubectl apply -f ./kubernetes/development/dind.yml
```
