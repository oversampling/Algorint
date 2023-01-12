Setup Submission Database

```
kubectl apply -f ./kubernetes/redis-namespace.yml
kubectl apply -f ./kubernetes/redis-configmap.yml
kubectl apply -f ./kubernetes/redis.yml
kubectl apply -f ./kubernetes/sentinels.yml
```
