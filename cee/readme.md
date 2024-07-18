```
cd cee
kubectl apply --server-side -f ./kubernetes/development/keda-2.11.0.yaml
kubectl apply -f kubernetes/development/cee-namespace.yml
kubectl apply -f ./kubernetes/development/cee-secrets.yml
kubectl apply -f ./kubernetes/development/cee-deployment.yml


kubectl apply --server-side --force-conflicts -f ./kubernetes/deployment/keda-2.11.0.yaml
kubectl apply -f kubernetes/deployment/cee-namespace.yml
kubectl apply -f ./kubernetes/deployment/cee-secrets.yml
kubectl apply -f ./kubernetes/deployment/cee-deployment.yml
```
