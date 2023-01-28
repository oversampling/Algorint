resource "aws_elasticache_subnet_group" "submission_database" {
  name       = "algorint"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "algorint" {
  automatic_failover_enabled  = true
  replication_group_id        = "algorint-cluster"
  preferred_cache_cluster_azs = ["ap-southeast-1a", "ap-southeast-1a"]
  description                 = "algorint redis cluster replication"
  node_type                   = "cache.t2.small"
  num_cache_clusters          = 2
  engine_version              = "3.2.10"
  parameter_group_name        = "default.redis3.2"
  port                        = 6379
  security_group_ids          = [aws_security_group.algorint-redis.id]
  subnet_group_name           = aws_elasticache_subnet_group.submission_database.name
}
