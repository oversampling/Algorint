# Create the VPC
resource "aws_vpc" "eks_vpc" {
  cidr_block           = "10.0.0.0/24"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name    = "eks-vpc"
    Project = "algorint"
  }
}

# Create an Elastic IP for the NAT Gateway
resource "aws_eip" "nat_eip" {
  vpc = true
  tags = {
    Name    = "nat-eip"
    Project = "algorint"
  }
}

# Create a public subnet for the NAT Gateway
resource "aws_subnet" "nat_subnet" {
  vpc_id                  = aws_vpc.eks_vpc.id
  cidr_block              = "10.0.0.0/26"  # Public subnet
  availability_zone       = "us-west-2a"
  map_public_ip_on_launch = true
  tags = {
    Name    = "nat-subnet"
    Project = "algorint"
  }
}

# Create the NAT Gateway in the public subnet
resource "aws_nat_gateway" "nat_gateway" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.nat_subnet.id
  tags = {
    Name    = "eks-nat-gateway"
    Project = "algorint"
  }
}

# Create a private subnet with NAT access for workloads
resource "aws_subnet" "private_subnet" {
  vpc_id                  = aws_vpc.eks_vpc.id
  cidr_block              = "10.0.0.64/26"  # Private subnet
  availability_zone       = "us-west-2b"
  map_public_ip_on_launch = false
  tags = {
    Name    = "private-subnet"
    Project = "algorint"
  }
}

# Create a public route table for the NAT subnet (to the internet)
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.eks_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name    = "public-rt"
    Project = "algorint"
  }
}

# Associate the public route table with the NAT subnet
resource "aws_route_table_association" "nat_subnet_association" {
  subnet_id      = aws_subnet.nat_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# Create a private route table for the private subnet with NAT access
resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.eks_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateway.id
  }

  tags = {
    Name    = "private-rt"
    Project = "algorint"
  }
}

# Associate the private route table with the private subnet
resource "aws_route_table_association" "private_subnet_association" {
  subnet_id      = aws_subnet.private_subnet.id
  route_table_id = aws_route_table.private_rt.id
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.0.4"

  cluster_name    = local.cluster_name
  cluster_version = "1.24"

  vpc_id                          = module.vpc.vpc_id
  subnet_ids                      = module.vpc.private_subnets
  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true
  eks_managed_node_group_defaults = {
    ami_type = "AL2_x86_64"

  }

  eks_managed_node_groups = {
    one = {
      name = "db"
      labels = {
        hostname = "db"
      }
      instance_types = ["t3.small"]

      min_size     = 1
      max_size     = 1
      desired_size = 1
    }

    two = {
      name = "app"
      labels = {
        hostname = "app"
      }
      instance_types = ["t3.small"]

      min_size     = 1
      max_size     = 2
      desired_size = 1
    }
  }
}
