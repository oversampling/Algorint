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
  domain = "vpc"
  tags = {
    Name    = "nat-eip"
    Project = "algorint"
  }
}

# Create a public subnet for the NAT Gateway
resource "aws_subnet" "nat_subnet" {
  vpc_id                  = aws_vpc.eks_vpc.id
  cidr_block              = "10.0.0.0/26"  # Public subnet
  availability_zone       = "ap-southeast-1a"
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
  availability_zone       = "ap-southeast-1b"
  map_public_ip_on_launch = false
  tags = {
    Name    = "private-subnet"
    Project = "algorint"
  }
}

resource "aws_subnet" "db_subnet" {
  vpc_id                  = aws_vpc.eks_vpc.id
  cidr_block              = "10.0.0.128/26"  # Private subnet
  availability_zone       = "ap-southeast-1c"
  map_public_ip_on_launch = false
  tags = {
    Name    = "db-subnet"
    Project = "algorint"
  }
}

# Create an Internet Gateway for the public subnet
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.eks_vpc.id
  tags = {
    Name    = "eks-igw"
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

# Create route table for the db subnet
resource "aws_route_table" "db_rt" {
  vpc_id = aws_vpc.eks_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateway.id
  }

  tags = {
    Name    = "db-rt"
    Project = "algorint"
  }
}


# Associate the private route table with the private subnet
resource "aws_route_table_association" "private_subnet_association" {
  subnet_id      = aws_subnet.private_subnet.id
  route_table_id = aws_route_table.private_rt.id
}

# Associate the db route table with the db subnet
resource "aws_route_table_association" "db_subnet_association" {
  subnet_id      = aws_subnet.db_subnet.id
  route_table_id = aws_route_table.db_rt.id
}

# Create the IAM Role for EKS Cluster
resource "aws_iam_role" "eks_cluster_role" {
  name = "eksClusterRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name    = "eks-cluster-role"
    Project = "algorint"
  }
}

# Attach the Amazon EKS Cluster Policy to the IAM Role
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

# Create the EKS Cluster in the private subnet
resource "aws_eks_cluster" "eks_cluster" {
  name     = "eks-cluster"
  role_arn = aws_iam_role.eks_cluster_role.arn
  vpc_config {
    endpoint_private_access = true
    endpoint_public_access  = false
    subnet_ids = [aws_subnet.private_subnet.id,  aws_subnet.db_subnet.id]  # Use private subnet for cluster
  }

  tags = {
    Name    = "eks-cluster"
    Project = "algorint"
  }

  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]
}

# IAM Role for EKS Node Group
resource "aws_iam_role" "eks_node_role" {
  name = "eksNodeRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name    = "eks-node-role"
    Project = "algorint"
  }
}

# Attach Policies for EKS Worker Nodes
resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "eks_ec2_policy" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Security Group for EKS Nodes
resource "aws_security_group" "eks_node_sg" {
  vpc_id = aws_vpc.eks_vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "eks-node-sg"
    Project = "algorint"
  }
}

# Create an EKS Node Group in the private subnet
resource "aws_eks_node_group" "eks_node_group" {
  cluster_name    = aws_eks_cluster.eks_cluster.name
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = [aws_subnet.private_subnet.id]
  node_group_name = "eks-node-group"

  scaling_config {
    desired_size = 2
    max_size     = 3
    min_size     = 1
  }

  instance_types = ["t3.medium"]


  tags = {
    Name    = "eks-node-group"
    Project = "algorint"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_ec2_policy
  ]
}

# Security Group for Cloud Bastion Host (CBH)
resource "aws_security_group" "cbh_sg" {
  vpc_id = aws_vpc.eks_vpc.id

  ingress {
    description = "Allow SSH access from your IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["103.111.75.94/32"] # Replace with your actual IP or CIDR for security
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "cbh-sg"
    Project = "algorint"
  }
}

# Generate an SSH key pair
resource "tls_private_key" "cbh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Create an AWS key pair using the generated private key
resource "aws_key_pair" "cbh_key_pair" {
  key_name   = "cbh-key-pair"  # Specify your key pair name
  public_key = tls_private_key.cbh_key.public_key_openssh

  tags = {
    Name    = "cbh-key-pair"
    Project = "algorint"
  }
}

# Create a Cloud Bastion Host (CBH) in the public subnet
resource "aws_instance" "cbh" {
  ami                    = "ami-047126e50991d067b" # Amazon Linux 2 AMI, replace with a region-specific AMI ID
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.nat_subnet.id
  security_groups        = [aws_security_group.cbh_sg.id]
  associate_public_ip_address = true

  key_name = "cbh-key-pair" # Replace with your SSH key name to access the CBH

  tags = {
    Name    = "cloud-bastion-host"
    Project = "algorint"
  }
}

# Output the CBH Public IP
output "cbh_public_ip" {
  value = aws_instance.cbh.public_ip
  description = "Public IP address of the Cloud Bastion Host (CBH)"
}

output "cbh_private_key" {
  value       = tls_private_key.cbh_key.private_key_pem
  sensitive   = true
  description = "Private key for CBH access (Save this locally and keep it secure)"
}

output region {
  value = "ap-southeast-1"
}

output cluster_name {
  value = aws_eks_cluster.eks_cluster.name
}