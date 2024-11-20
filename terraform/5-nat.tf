resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${local.env}-nat"
    "project" = "${local.env}-${local.eks_name}"
  }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_zone1.id

  tags = {
    Name = "${local.env}-nat"
    "project" = "${local.env}-${local.eks_name}"
  }

  depends_on = [aws_internet_gateway.igw]
}