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

# module "redis" {
#   source = "github.com/terraform-community-modules/tf_aws_elasticache_redis.git?ref=v2.2.0"

#   env               = "dev"
#   name              = "thtest"
#   redis_clusters    = "2"
#   redis_failover    = "true"
#   redis_node_type   = "cache.t2.small"
#   subnets           = module.vpc.private_subnets
#   vpc_id            = module.vpc.vpc_id
#   apply_immediately = true
#   security_group_names = [
#     aws_security_group.redis_sc.name
#   ]
# }
