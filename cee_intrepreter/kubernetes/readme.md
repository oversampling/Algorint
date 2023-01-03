## Setup Code Execution Engine (CEE) for intrepreter langauge

```
kubectl apply -f ./kubernetes/cee_intrepreter_namespace.yml
kubectl apply -f ./kubernetes/cee-intrepreter-secrets.yml
kubectl apply -f ./kubernetes/cee_intrepreter_queue.yml
kubectl apply -f ./kubernetes/cee_intrepreter_deployment.yml
```
