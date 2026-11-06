variable "project_name" {
  description = "Short name used for AWS resources."
  type        = string
  default     = "aws-ehr"
}

variable "region" {
  description = "AWS region used for deployment."
  type        = string
  default     = "us-east-1"
}

variable "admin_cidr" {
  description = "CIDR block allowed to access the EC2 instance and database."
  type        = string
  default     = "0.0.0.0/0"
}

variable "db_username" {
  description = "Master username used for PostgreSQL."
  type        = string
  default     = "ehradmin"
}

variable "db_password" {
  description = "Master password used for PostgreSQL."
  type        = string
  default     = "ChangeMe123!"
  sensitive   = true
}
