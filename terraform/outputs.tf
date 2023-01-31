output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ids attached to the cluster control plane"
  value       = module.eks.cluster_security_group_id
}

output "region" {
  description = "AWS region"
  value       = var.region
}

output "cluster_name" {
  description = "Kubernetes Cluster Name"
  value       = module.eks.cluster_name
}

output "redis_primary_endpoint_address" {
  description = "Redis primary endpoint address"
  value       = aws_elasticache_replication_group.algorint.primary_endpoint_address
}

output "rabbitmq_endpoint" {
  description = "RabbitMQ endpoint"
  value       = aws_mq_broker.algorint-rabbitmq.instances[0].endpoints[0]
}

output "rabbitmq_console_url" {
  description = "RabbitMQ console endpoint"
  value       = aws_mq_broker.algorint-rabbitmq.instances[0].console_url
}

output "router-loadbalancer-dns" {
  description = "Router loadbalancer DNS"
  value       = kubernetes_service.router.status.0.load_balancer.0.ingress.0.hostname
}
