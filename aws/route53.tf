locals {
  app_name = "jaip-backend"
  domain = "pep.jstor.org"
  zone_id = "Z2FDTNDATAQYW2" # This is hardcoded because the hosted zone id for CloudFront is a constant
  cloudfront_dns = "d6u2bqjxuux94.cloudfront.net."
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.84.0"
    }
  }

  backend "s3" {
    bucket         = "ithaka-apps-tfstate-test"
    key            = "jaip-backend/route53/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "test-tfstate-lock"
  }
}

resource "aws_route53_zone" "zone" {
  name = local.domain

  tags = {
    "ithaka/environment" = "test"
    "ithaka/owner"       = "jaip"
    "ithaka/business.unit" = "labs"
    "ithaka/app" = local.app_name
    app = local.app_name
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_route53_record" "record" {
  zone_id = aws_route53_zone.zone.zone_id
  name    = "${local.domain}"
  type    = "A"
  alias {
    name                   = local.cloudfront_dns
    zone_id                = local.zone_id 
    evaluate_target_health = true
  }
  lifecycle {
    prevent_destroy = true
  }
}