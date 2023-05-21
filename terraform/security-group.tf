resource "aws_security_group" "algorint-redis" {
  name   = "algorint-redis"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port = 6379
    to_port   = 6379
    protocol  = "tcp"

    cidr_blocks = [
      "10.0.1.0/24",
      "10.0.2.0/24",
    ]
  }
}
resource "aws_security_group" "algorint-rabbitmq" {
  name   = "algorint-rabbitmq"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port = 5671
    to_port   = 5671
    protocol  = "tcp"

    cidr_blocks = [
      "10.0.1.0/24",
      "10.0.2.0/24",
    ]
  }
}

resource "aws_security_group" "algorint-mongodb" {
  name   = "algorint-mongodb"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port = 27017
    to_port   = 27017
    protocol  = "tcp"

    cidr_blocks = [
      "10.0.1.0/24",
      "10.0.2.0/24",
    ]
  }
}
