resource "aws_docdb_cluster_instance" "algorint" {
  count              = 1
  identifier         = "algorint-application-database-${count.index}"
  cluster_identifier = aws_docdb_cluster.algorint.id
  instance_class     = "db.t3.medium"
}

resource "aws_docdb_cluster" "algorint" {
  cluster_identifier  = "algorint-application-database"
  availability_zones  = ["ap-southeast-1a"]
  master_username     = "algorint"
  master_password     = "algorint-mongodb-password"
  skip_final_snapshot = true
  vpc_security_group_ids = [
    aws_security_group.algorint-mongodb.id,
  ]
  db_subnet_group_name = aws_docdb_subnet_group.algorint.name
}

resource "aws_docdb_subnet_group" "algorint" {
  name       = "main"
  subnet_ids = module.vpc.private_subnets
}
