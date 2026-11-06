output "ec2_public_ip" {
  value = aws_instance.app.public_ip
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.address
}

output "s3_bucket_name" {
  value = aws_s3_bucket.documents.bucket
}

output "iam_role_name" {
  value = aws_iam_role.ec2_role.name
}
