Setup Judge Service (development)

```
kubectl apply -f ./kubernetes/development/judge-namespace.yml
kubectl apply -f ./kubernetes/development/judge-secrets.yml
kubectl apply -f ./kubernetes/development/judge-deployment.yml
```

Setup Judge Service (Deployment)

Before deploy, remember

-   Insert redis host without port with base64 encoded to secrets

```
kubectl apply -f ./kubernetes/deployment/judge-namespace.yml
kubectl apply -f ./kubernetes/deployment/judge-secrets.yml
kubectl apply -f ./kubernetes/deployment/judge-deployment.yml
```
