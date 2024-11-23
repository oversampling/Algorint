resource "aws_iam_role" "nodes" {
  name = "${local.env}-${local.eks_name}-eks-nodes"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      }
    }
  ]
}
POLICY
}

resource "aws_iam_policy" "worker_node_elb_policy" {
  name        = "WorkerNodeELBPolicy"
  description = "Custom policy to allow ELB management for EKS worker nodes"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:DescribeRules"
        ],
        Resource = "*"
      }
    ]
  })
}

# resource "aws_iam_policy" "worker_node_lbc_elb_policy" {
#   policy = file("./iam/AWSLoadBalancerController.json")
#   name   = "AWSLoadBalancerControllerNode"
# }

# resource "aws_iam_role_policy_attachment" "worker_node_elb_policy" {
#   policy_arn = aws_iam_policy.worker_node_lbc_elb_policy.arn
#   role       = aws_iam_role.nodes.name
# }

# resource "aws_iam_role_policy_attachment" "worker_node_custom_elb_policy" {
#   role       = aws_iam_role.nodes.name  # Ensure this is the worker node role
#   policy_arn = aws_iam_policy.worker_node_elb_policy.arn
# }

# This policy now includes AssumeRoleForPodIdentity for the Pod Identity Agent
resource "aws_iam_role_policy_attachment" "amazon_eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.nodes.name
}

resource "aws_iam_role_policy_attachment" "amazon_eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.nodes.name
}

resource "aws_iam_role_policy_attachment" "amazon_ec2_container_registry_read_only" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.nodes.name
}

resource "aws_eks_node_group" "general" {
  cluster_name    = aws_eks_cluster.eks.name
  version         = local.eks_version
  node_group_name = "general"
  node_role_arn   = aws_iam_role.nodes.arn

  subnet_ids = [
    aws_subnet.private_zone1.id,
    aws_subnet.private_zone2.id
  ]

  capacity_type  = "ON_DEMAND"
  instance_types = ["t3.medium"]

  scaling_config {
    desired_size = 2
    max_size     = 3
    min_size     = 0
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    role = "general"
  }

  depends_on = [
    aws_iam_role_policy_attachment.amazon_eks_worker_node_policy,
    aws_iam_role_policy_attachment.amazon_eks_cni_policy,
    aws_iam_role_policy_attachment.amazon_ec2_container_registry_read_only,
  ]

  # Allow external changes without Terraform plan difference
  lifecycle {
    ignore_changes = [scaling_config[0].desired_size]
  }
}

resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name = aws_eks_cluster.eks.name
  addon_name   = "aws-ebs-csi-driver"
  service_account_role_arn = aws_iam_role.eks_ebs_csi_driver.arn

  tags = {
    Name = "ebs-csi-driver-addon"
    Project = "algorint"
  }

  depends_on = [aws_iam_role_policy_attachment.attach_ebs_csi_driver_policy,  aws_eks_cluster.eks, aws_eks_node_group.general] 
}

output iam_role_nodes {
  value = aws_iam_role.nodes.arn
}