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

**Delete Every Deployment**

```bash
kubectl delete ns router cee-intrepreter cee-compiler judge redis submission-queue
```
