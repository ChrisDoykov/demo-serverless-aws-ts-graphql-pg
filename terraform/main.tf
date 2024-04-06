terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {} # Configuration provided using a .conf file (locally) and terraform init -backend-config= (in CI/CD)
}

provider "aws" {
  region     = var.region
  access_key = var.aws_access_key_id
  secret_key = var.aws_secret_access_key
}

# Get or create the necessary hosted zone
data "external" "get_r53_zone" {
  program = ["bash", "${path.module}/get_or_create_r53_zone.sh"]

  query = {
    zone_name = var.domain_name
  }
}

resource "aws_route53_record" "ns_record" {
  zone_id         = var.tld_zone_id
  name            = var.domain_name
  type            = "NS"
  ttl             = 300
  records         = jsondecode(data.external.get_r53_zone.result.name_servers)
  allow_overwrite = true
}

############# Stage zone ############### 
# Hosted zone for development subdomain of our service

resource "aws_route53_zone" "environment" {
  count = var.environment == "production" ? 0 : 1
  name  = "${var.environment}.${var.domain_name}"
}

resource "aws_route53_record" "environment" {
  count   = var.environment == "production" ? 0 : 1
  zone_id = data.external.get_r53_zone.result.id
  name    = aws_route53_zone.environment[count.index].name
  type    = "NS"
  ttl     = 300
  records = aws_route53_zone.environment[count.index].name_servers
}
############# Stage zone END ############### 

resource "aws_acm_certificate" "certificate" {
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}
resource "aws_route53_record" "certificate_record" {
  for_each = {
    for dvo in aws_acm_certificate.certificate.domain_validation_options : dvo.domain_name => {
      name    = dvo.resource_record_name
      record  = dvo.resource_record_value
      type    = dvo.resource_record_type
      zone_id = data.external.get_r53_zone.result.id
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = each.value.zone_id
}

resource "aws_acm_certificate_validation" "certificate_validation" {
  certificate_arn         = aws_acm_certificate.certificate.arn
  validation_record_fqdns = [for record in aws_route53_record.certificate_record : record.fqdn]
}