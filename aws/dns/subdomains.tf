locals {  
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
    "nucleos-wy",
    "nucleos-hi",
    "nucleos-oh",
    "nucleos-usvi",
    "nucleos-id",
  ]
}