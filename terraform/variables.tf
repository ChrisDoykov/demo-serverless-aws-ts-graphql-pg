variable "aws_access_key_id" {
  type = string
}
variable "aws_secret_access_key" {
  type = string
}
variable "region" {
  type        = string
  description = "The AWS region to be used"
}
variable "domain_name" {
  type        = string
  description = "The domain or sub-domain to host the app under"
}
variable "tld_zone_id" {
  type        = string
  description = "The Zone ID of the top-level domain"
}
variable "environment" {
  type        = string
  description = "Generally dev, staging, or production"
}