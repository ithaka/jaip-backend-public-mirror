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