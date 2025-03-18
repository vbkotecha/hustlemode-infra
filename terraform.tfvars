# terraform.tfvars
#
# IMPORTANT: This file contains sensitive information. Never commit this file to version control.
# Replace all values marked with <REPLACE_*> with your actual values.
#
# Author: Vivek Kotecha
# Last Updated: 2024

# Environment Configuration
# Valid values: "dev" or "prod"
environment = "dev"  # Change to "prod" for production deployment

# AWS Region Configuration
# Example: us-west-2, us-east-1, eu-west-1
aws_region = "us-west-2"

# AWS Authentication
# Format: 20 character string for access key
# REPLACE with your AWS access key from IAM credentials
aws_access_key = "<REPLACE_WITH_YOUR_AWS_ACCESS_KEY>" 

# Format: 40+ character string for secret key
# REPLACE with your AWS secret key from IAM credentials
aws_secret_key = "<REPLACE_WITH_YOUR_AWS_SECRET_KEY>" 

# Database Configuration
# Must be at least 16 characters with uppercase, lowercase, numbers, and special characters
# REPLACE with a secure password of your choice
db_password = "MySecureP@ssw0rd123!"

# Resource Sizing (Optional - defaults provided in variables.tf)
# Uncomment and modify these values to override defaults
# rds_instance_class = "db.t3.micro"      # Default for MVP
# rds_allocated_storage = 10              # Default for MVP in GB 

# IP Address Configuration
# List of IP addresses that can access the database
# Format: ["IP/32"] - The /32 is required and denotes a single IP
# Example: ["203.0.113.1/32", "203.0.113.2/32"]
allowed_ip_addresses = ["<REPLACE_WITH_YOUR_IP_ADDRESS>/32"]  # Add the middleware IP address here