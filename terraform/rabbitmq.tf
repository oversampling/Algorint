resource "aws_mq_broker" "algorint-rabbitmq" {
  broker_name = "algorint-rabbitmq"

  engine_type         = "RabbitMQ"
  engine_version      = "3.10.10"
  host_instance_type  = "mq.t3.micro"
  security_groups     = [aws_security_group.algorint-rabbitmq.id]
  deployment_mode     = "SINGLE_INSTANCE"
  publicly_accessible = true
  subnet_ids          = [module.vpc.private_subnets[0]]
  user {
    username = "algorint"
    password = "algorint-rabbitmq-password-21012023"
  }
}
