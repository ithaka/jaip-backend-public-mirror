locals {
  app_name = "jaip-backend"
  domain = "pep.jstor.org"
  temporary_admin_domain = "pep-admin.jstor.org"

  test_domain = "test-pep.jstor.org"
  zone_id = "Z2FDTNDATAQYW2" # This is hardcoded because the hosted zone id for CloudFront is a constant
  cloudfront_dns = "d6u2bqjxuux94.cloudfront.net."
  separator = "."
  admin_prefix = "admin"
  test_environment = "test"
  prod_environment = "prod" 
}

locals {
  admin_domain = join(local.separator, [local.admin_prefix, local.domain])
  test_admin_domain = join(local.separator, [local.admin_prefix, local.test_domain])
  test_provider_prefixes = [
    "subdomain-example",
  ]
  # This is where new subdomains can be added. Usually, they should take the form
  # provider-state, e.g., atlo-la (for ATLO devices in Louisiana) or orijin-ma (for 
  # Orijin devices in Massachusetts).
  prod_provider_prefixes = [
    "prod-subdomain-example",
  ]
}

locals {
  test_provider_subdomains = [
    for provider_prefix in local.test_provider_prefixes : join(local.separator, [
      provider_prefix, local.test_domain
    ])
  ]
  prod_provider_subdomains = [
    for provider_prefix in local.prod_provider_prefixes : join(local.separator, [
      provider_prefix, local.domain
    ])
  ]
}

locals {
  test_subdomains = concat(
    local.test_provider_subdomains,
    [local.test_admin_domain],
  )
  prod_subdomains = concat(
    local.prod_provider_subdomains,
    [local.admin_domain],
  )
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


# PRODUCTION
resource "aws_route53_zone" "zone" {
  name = local.domain

  tags = {
    "ithaka/environment" = "prod"
    "ithaka/owner"       = "jaip"
    "ithaka/business.unit" = "labs"
    "ithaka/app" = local.app_name
    app = local.app_name
  }

  lifecycle {
    prevent_destroy = true
  }
}

# This is the main record for the domain.
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

# This is the main record for the old admin subdomain. This should be
# set to redirect to the new admin subdomain.
resource "aws_route53_record" "temporary_admin_record" {
  zone_id = aws_route53_zone.zone.zone_id
  name    = "${local.temporary_admin_domain}"
  type    = "A"
  alias {
    # NOTE: Do NOT update this until the migration is ready for the final
    # stage and participants have been notified.
    name                   = local.cloudfront_dns
    zone_id                = local.zone_id 
    evaluate_target_health = true
  }
  lifecycle {
    prevent_destroy = true
  }
}

# These are the production subdomains. They include the provider subdomain
# prefixed to the production subdomain, e.g., prod-subdomain-example.pep.jstor.org.
# The also include the admin subdomain.
resource "aws_route53_record" "prod_subdomains" {
  for_each = toset(local.prod_subdomains)
  zone_id = aws_route53_zone.zone.zone_id
  name    = each.key
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


# TEST
resource "aws_route53_zone" "test_zone" {
  name = local.test_domain

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


# This is the main record for the test domain.
resource "aws_route53_record" "test_record" {
  zone_id = aws_route53_zone.test_zone.zone_id
  name    = "${local.test_domain}"
  type    = "A"
  alias {
    name                   = local.cloudfront_dns
    zone_id                = local.zone_id 
    evaluate_target_health = true
  }
  # In general, we don't need to worry about destroying this record, but to 
  # keep things consistent with prod and to avoid accidents, we'll prevent
  # destroying it.
  lifecycle {
    prevent_destroy = true
  }
}

# These are the test provider subdomains. They include the provider subdomain 
# prefixed to the test subdomain, e.g., subdomain-example.test-pep.jstor.org.
resource "aws_route53_record" "test_subdomains" {
  for_each = toset(local.test_subdomains)
  zone_id = aws_route53_zone.test_zone.zone_id
  name    = each.key
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
