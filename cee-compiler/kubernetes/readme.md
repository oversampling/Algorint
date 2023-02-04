## Setup Code Execution Engine (CEE) for interpreter langauge

### Development

```
kubectl apply -f ./kubernetes/development/cee-compiler-namespace.yml
kubectl apply -f ./kubernetes/development/cee-compiler-secrets.yml
kubectl apply -f ./kubernetes/development/cee-compiler-deployment.yml
```

### Deployment

Before deploy, remember

-   Insert rabbitmq url with username and password with base64 encoded to secrets
-   Insert redis host without port with base64 encoded to secrets

```
kubectl apply -f ./kubernetes/deployment/cee-compiler-namespace.yml
kubectl apply -f ./kubernetes/deployment/cee-compiler-secrets.yml
kubectl apply -f ./kubernetes/deployment/cee-compiler-deployment.yml
```
