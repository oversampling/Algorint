variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "rabbitmq-username" {
  type    = string
  default = "algorint"
}

variable "rabbitmq-password" {
  type    = string
  default = "algorint-rabbitmq-password-21012023"
}

variable "GOOGLE_CLIENT_SECRET" {
  type = string
}
