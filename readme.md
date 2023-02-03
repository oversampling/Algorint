# Algorint

## How to deploy
1. Configure aws cli 
```bash
# Get access key from security credentials from aws console
aws configure
```
2. Deploy to AWS
```bash
terraform init
terraform plan 
terraform apply
```
3. change kube config file to connect kubectl to AWS cluster (optional)
```bash
aws eks --region $(terraform output -raw region) update-kubeconfig \
    --name $(terraform output -raw cluster_name)
```
4. Destroy all infrastructure
```bash
terraform destroy
```