resource "aws_efs_file_system" "algorint" {
  creation_token = "algorint"
  tags = {
    Name = "algorint"
  }
}
