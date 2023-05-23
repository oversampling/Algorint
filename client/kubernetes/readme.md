Setup client Service (development)

```
kubectl apply -f ./kubernetes/development/client-namespace.yml
kubectl apply -f ./kubernetes/development/client-secret.yml
kubectl apply -f ./kubernetes/development/client-deployment.yml
```

```
kubectl apply -f ./kubernetes/deployment/client-namespace.yml
kubectl apply -f ./kubernetes/deployment/client-secret.yml
kubectl apply -f ./kubernetes/deployment/client-deployment.yml
```
