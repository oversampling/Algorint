```
cd cee
kubectl apply -f kubernetes/development/cee-namespace.yml
kubectl apply -f ./kubernetes/development/cee-secrets.yml
kubectl apply -f ./kubernetes/development/cee-deployment.yml
kubectl apply -f ./kubernetes/development/dind.yml
```
