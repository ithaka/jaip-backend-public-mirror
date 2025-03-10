export const session_query = `{
    ip
    uuid
    licenses {
      id
      entitlement {
        id
      }
    }
    userAccount {
      code
      contact {
        email
      }
    }
    authenticatedAccounts {
      code
      contact {
        email
      }
    }
}`;
// This may not be necessary, but it's included for now because it was a pain to
// put together the full query and it may be useful in the future.
export const full_session_query = `{
    ip
    uuid
    previousSessionId
    requestId
    userAgentString
    termsConditionsAccepted
    lastAccessTime
    lastUpdatedTime
    startedTime
    validUntil
    lastEvaluation
    authenticated
    jpass {
      active
      jpassDownloadCount
    }
    attributes
    reasonsForAccessByIdentity
    userAccount {
      id
      createTime
      code
      name
      contact {
        firstName
        lastName
        email
      }
      description
      status
      type
      credentials {
        id
        type {
          value
          rank
        }
        legacyId
        accountExternalId
        legacyUniqueValue
      }
      roles
      licenses {
        id
        type {
          id
          value
          desc
        }
        status
        entitlement {
          id
        }
        term {
          inheritable
          startDate
          endDate
          ignoreStart
          ignoreEnd
          duration
          gracePeriod
          viewAccess {
            count
            limit
            threshold
          }
          downloadAccess {
            count
            limit
            threshold
          }
          itemRequest {
            count
            limit
            threshold
          }
        }
        description
        account {
          id
          type
        }
        createTime
        offer {
          id
          code
        } 
      }
      childIds
      authenticatedCredentials {
        id
        type {
          value
          rank
        }
        accountExternalId
        legacyUniqueValue
      }
      providerDesignationStatement
    }
    relatedAccounts {
      id
      createTime
      name
      contact {
        firstName
        lastName
        email
      }
      description
      status
      type
      credentials {
        id
        type {
          value
          rank
        }
        legacyId
        accountExternalId
        legacyUniqueValue
      }
      roles
      licenses {
        id
        type {
          id
          value
          desc
        }
        status
        entitlement {
          id
        }
        term {
          inheritable
          startDate
          endDate
          ignoreStart
          ignoreEnd
          duration
          gracePeriod
          viewAccess {
            count
            limit
            threshold
          }
          downloadAccess {
            count
            limit
            threshold
          }
          itemRequest {
            count
            limit
            threshold
          }
        }
        description
        account {
          id
          type
        }
        createTime
        offer {
          id
          code
        } 
      }
      childIds
    }
    implicitAccounts {
      id
      createTime
      name
      contact {
        firstName
        lastName
        email
      }
      description
      status
      type
      credentials {
        id
        type {
          value
          rank
        }
        legacyId
        accountExternalId
        legacyUniqueValue
      }
      roles
      licenses {
        id
        type {
          id
          value
          desc
        }
        status
        entitlement {
          id
        }
        term {
          inheritable
          startDate
          endDate
          ignoreStart
          ignoreEnd
          duration
          gracePeriod
          viewAccess {
            count
            limit
            threshold
          }
          downloadAccess {
            count
            limit
            threshold
          }
          itemRequest {
            count
            limit
            threshold
          }
        }
        description
        account {
          id
          type
        }
        createTime
        offer {
          id
          code
        } 
      }
      childIds
    }
    entitlements {
      entitlementId
      licenses {
        id
        type {
          id
          value
          desc
        }
        status
        entitlement {
          id
        }
        term {
          inheritable
          startDate
          ignoreStart
          endDate
          ignoreEnd
          duration
          gracePeriod
          viewAccess {
            count
            limit
            threshold
          }
          downloadAccess {
            count
            limit
            threshold
          }
          itemRequest {
            count
            limit
            threshold
          }
          
        }
        description
        account {
          id
          type
        }
        createTime
        offer {
          id
          code
        }
        fullType
        subType
        tags
        updateTime
        allowPrivateContent
        priority
      }
      updateTime
    }
    licenses {
      id
    }
    providerDesignationStatements {
      institutionId
      statement
      data
    }
    licensedProducts {
      product
      entitlementId
      accounts
    }
    accountEmailVerified
    
    
    accounts {
      id
      createTime
      name
      contact {
        firstName
        lastName
        email
      }
      description
      status
      type
      credentials {
        id
        type {
          value
          rank
        }
        legacyId
        accountExternalId
        legacyUniqueValue
      }
      roles
      licenses {
        id
        type {
          id
          value
          desc
        }
        status
        entitlement {
          id
        }
        term {
          inheritable
          startDate
          endDate
          ignoreStart
          ignoreEnd
          duration
          gracePeriod
          viewAccess {
            count
            limit
            threshold
          }
          downloadAccess {
            count
            limit
            threshold
          }
          itemRequest {
            count
            limit
            threshold
          }
        }
        description
        account {
          id
          type
        }
        createTime
        offer {
          id
          code
        } 
      }
      childIds
    }
    authenticatedProfiles {
      userId
      institutionId
      role
      accountType
      accountCode
      accountName
    }
    authenticatedAccounts {
      id
      createTime
      name
      code
      contact {
        firstName
        lastName
        email
      }
      description
      status
      type
      accountType {
        id
        value
        description
        legacyType
      }
      credentials {
        id
        type {
          value
          rank
        }
        legacyId
        accountExternalId
        legacyUniqueValue
      }
      roles
      licenses {
        id
        type {
          id
          value
          desc
        }
        status
        entitlement {
          id
        }
        term {
          inheritable
          startDate
          endDate
          ignoreStart
          ignoreEnd
          duration
          gracePeriod
          viewAccess {
            count
            limit
            threshold
          }
          downloadAccess {
            count
            limit
            threshold
          }
          itemRequest {
            count
            limit
            threshold
          }
        }
        description
        account {
          id
          type
        }
        createTime
        offer {
          id
          code
        } 
      }
      childIds
    }
  }`;
