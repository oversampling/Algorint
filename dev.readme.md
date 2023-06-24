## Initialize Git

```
git config --global user.name "FIRST_NAME LAST_NAME"
git config --global user.email "MY_NAME@example.com"
```

## Setup development in Docker Desktop Cluster

**Router Service**

```bash
cd router
kubectl apply -f ./kubernetes/development/router-namespace.yml
kubectl apply -f ./kubernetes/development/router-secrets.yml
kubectl apply -f ./kubernetes/development/router-deployment.yml
```

**Submission Queue**

```bash
cd submission_queue
kubectl apply -f ./kubernetes/submission_queue.yml
```

**Submission Database**

```bash
cd submission_database
kubectl apply -f ./kubernetes/redis-namespace.yml
kubectl apply -f ./kubernetes/redis-configmap.yml
kubectl apply -f ./kubernetes/redis.yml
kubectl apply -f ./kubernetes/sentinels.yml # Wait redis finish running before run sentinels
```

**CEE interpreter**

```bash
cd cee_intrepreter
kubectl apply -f ./kubernetes/development/cee_intrepreter_namespace.yml
kubectl apply -f ./kubernetes/development/cee-intrepreter-secrets.yml
kubectl apply -f ./kubernetes/development/cee_intrepreter_deployment.yml
```

**CEE compiler**

```bash
cd cee-compiler
kubectl apply -f ./kubernetes/development/cee-compiler-namespace.yml
kubectl apply -f ./kubernetes/development/cee-compiler-secrets.yml
kubectl apply -f ./kubernetes/development/cee-compiler-deployment.yml
```

**Application Database**
```bash
cd application_database
kubectl apply -f ./kubernetes/mongo-namespace.yml
kubectl apply -f ./kubernetes/mongo-deployment.yml
```

**Setup Prometheus**
```bash
cd monitoring
kubectl create -f ./manifests/setup/
kubectl create -f ./manifests/

# Prometheus
kubectl -n monitoring port-forward svc/prometheus-operated 9090

# Grafana
kubectl -n monitoring port-forward svc/grafana 8000:3000
```

**Setup Client**
```bash
cd client
kubectl apply -f ./kubernetes/development/client-namespace.yml
kubectl apply -f ./kubernetes/development/client-secret.yml
kubectl apply -f ./kubernetes/development/client-deployment.yml
```

**Setup Judge**
```bash
kubectl apply -f ./kubernetes/development/judge-namespace.yml
kubectl apply -f ./kubernetes/development/judge-secrets.yml
kubectl apply -f ./kubernetes/development/judge-deployment.yml
```

**Delete Every Deployment**
```bash
kubectl delete ns router cee-intrepreter cee-compiler judge redis submission-queue mongo client
```

**Setup Kind Cluster**
```bash
kind create cluster --name algorint --config kind-config.yml
kind delete cluster --name algorint
```
