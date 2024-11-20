resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/24"

  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${local.env}-main"
    Project = "${local.env}-${local.eks_name}"
  }
}