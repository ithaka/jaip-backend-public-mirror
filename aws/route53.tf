locals {
  app_name = "jaip-backend"

  # Domains
  domain = "pep.jstor.org"
  test_domain = "test-pep.jstor.org"
  temporary_admin_domain = "pep-admin.jstor.org"
  temporary_admin_domain_validation_target = "_570520dd2cc3e84cb25b94e561e45dbd.rdnyqppgxp.acm-validations.aws"
  admin_validation_target = "_8c77e22a5f96d0fa911ff78b713c3bde.xlfgrmvvlj.acm-validations.aws"

  # Cloudfront
  cloudfront_redirect = "dphlh8l2kaqiy.cloudfront.net."
  cloudfront_zone_id = "Z2FDTNDATAQYW2"

  # Admin Redirect
  s3_website = "s3-website-us-east-1.amazonaws.com"
  s3_zone_id = "Z3AQBSTGFYJSTF"

  # Subdomain building
  separator = "."
  admin_prefix = "admin"

  # Fastly
  fastly = "jstor.map.fastly.net."
  fastly_ips = [
    "151.101.0.152",
    "151.101.64.152",
    "151.101.128.152",
    "151.101.192.152",
  ]

  # Environments
  test_environment = "test"
  prod_environment = "prod" 

  # Validation Prefixes
  temporary_admin_domain_prefix = "_eebb83d3fb7e7e1e3fb7d11b926b11c7"
  new_admin_prefix = "_4959b22ce93d05b6947258fb93acc65e"
}

locals {  
  # Domains
  admin_domain = join(local.separator, [local.admin_prefix, local.domain])
  test_admin_domain = join(local.separator, [local.admin_prefix, local.test_domain])
  
  # Subdomain Building
  test_provider_prefixes = [
    "subdomain-example",
  ]
  # This is where new subdomains can be added. Usually, they should take the form
  # provider-state, e.g., atlo-la (for ATLO devices in Louisiana) or orijin-ma (for 
  # Orijin devices in Massachusetts).
  prod_provider_prefixes = [
    "prod-subdomain-example",
    "orijin-ma",
    "orijin-ut",
    "atlo-az",
    "atlo-fl",
    "atlo-ks",
    "atlo-la",
  ]
}

locals {
  # Validation
  temporary_admin_domain_validation = join(local.separator, [
    local.temporary_admin_domain_prefix, local.temporary_admin_domain
  ]) 
  admin_validation = join(local.separator, [
    local.new_admin_prefix, local.admin_domain
  ]) 

  # Built subdomains
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
  # Combined subdomains
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
      version = "5.97.0"
    }
  }

  backend "s3" {
    bucket         = "ithaka-apps-tfstate-test"
    key            = "jaip-backend/route53/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "test-tfstate-lock"
  }
}

# TEMPORARY ADMIN SITE
resource "aws_route53_zone" "temporary_admin_zone" {
  name = local.temporary_admin_domain

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

# This is the main record for the old admin subdomain. This should be
# set to redirect to the new admin subdomain.
resource "aws_route53_record" "temporary_admin_record" {
  zone_id = aws_route53_zone.temporary_admin_zone.zone_id
  name    = "${local.temporary_admin_domain}"
  type    = "A"
  alias {
    name                   = local.cloudfront_redirect
    zone_id                = local.cloudfront_zone_id 
    evaluate_target_health = false
  }
  lifecycle {
    # prevent_destroy = true
  }
}

resource "aws_route53_record" "temporary_admin_record_validation" {
  zone_id = aws_route53_zone.temporary_admin_zone.zone_id
  name    = "${local.temporary_admin_domain_validation}"
  type    = "CNAME"
  ttl   = 60
  records = [
    local.temporary_admin_domain_validation_target
  ]
  lifecycle {
    # prevent_destroy = true
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
  ttl   = 60
  records = local.fastly_ips
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
  type    = "CNAME"
  ttl   = 60
  records = [
    local.fastly
  ]
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_route53_record" "admin_record_validation" {
  zone_id = aws_route53_zone.zone.zone_id
  name    = "${local.admin_validation}"
  type    = "CNAME"
  ttl   = 60
  records = [
    local.admin_validation_target
  ]
  lifecycle {
    # prevent_destroy = true
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

resource "aws_route53_record" "test_record" {
  zone_id = aws_route53_zone.test_zone.zone_id
  name    = local.test_domain
  type    = "A"
  ttl   = 60
  records = local.fastly_ips
  # In general, we don't need to worry about destroying this record, but to 
  # keep things consistent with prod and to avoid accidents, we'll prevent
  # destroying it.
  # lifecycle {
  #   prevent_destroy = true
  # }
}

# These are the test provider subdomains. They include the provider subdomain 
# prefixed to the test subdomain, e.g., subdomain-example.test-pep.jstor.org.
resource "aws_route53_record" "test_subdomains" {
  for_each = toset(local.test_subdomains)
  zone_id = aws_route53_zone.test_zone.zone_id
  name    = each.key
  type    = "CNAME"
  ttl   = 60
  records = [
    local.fastly
  ]
  # lifecycle {
  #   prevent_destroy = true
  # }
}