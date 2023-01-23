## Setup router (development)

```
kubectl apply -f ./kubernetes/development/router-namespace.yml
kubectl apply -f ./kubernetes/development/router-secrets.yml
kubectl apply -f ./kubernetes/development/router-deployment.yml
```

## Setup router (deployment)

Before deploy, remember

-   Insert rabbitmq url with username and password with base64 encoded to secrets
-   Insert redis host without port with base64 encoded to secrets

```
kubectl apply -f ./kubernetes/deployment/router-namespace.yml
kubectl apply -f ./kubernetes/deployment/router-secrets.yml
kubectl apply -f ./kubernetes/deployment/router-deployment.yml
```
