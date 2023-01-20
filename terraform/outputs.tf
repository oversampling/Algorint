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

output "efs_id" {
  description = "EFS ID"
  value       = aws_efs_file_system.algorint.id
}

# output "redis_endpoint" {
#   description = "Redis endpoint"
#   value       = module.redis.endpoint
# }

# output "redis_security_group_id" {
#   description = "Redis security group id"
#   value       = module.redis.redis_security_group_id
# }

output "redis_primary_endpoint_address" {
  description = "Redis primary endpoint address"
  value       = aws_elasticache_replication_group.algorint.primary_endpoint_address
}

output "redis_configuration_endpoint_address" {
  description = "Redis configuration endpoint address"
  value       = aws_elasticache_replication_group.algorint.configuration_endpoint_address
}
