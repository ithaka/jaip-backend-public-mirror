export const fake_subdomain = "fake-subdomain.test-pep.jstor.org";
export const valid_student_subdomain = "test-pep.jstor.org";
export const valid_provider_subdomain = "test-subdomain.test-pep.jstor.org";
export const valid_admin_subdomain = "admin.test-pep.jstor.org";

export const get_sitecode_by_subdomain_resolved_value = {
  facilities: {
    jstor_id: "test.net",
  },
};

export const get_first_facility_resolved_value = {
  jstor_id: "test.net",
  entities: {
    name: "Test Facility",
    id: 1,
    entity_type: "facility",
  },
};

export const get_ip_bypass_resolved_value = {
  facilities: {
    jstor_id: "test.net",
  },
};

export const axios_session_data_no_email_or_code = {
  data: {
    data: {
      sessionHttpHeaders: {
        uuid: "uuid",
      },
    },
  },
  status: 200,
};

export const axios_session_data_with_code = {
  data: {
    data: {
      sessionHttpHeaders: {
        uuid: "uuid",
        userAccount: {
          code: "test_sitecode",
        },
      },
    },
  },
  status: 200,
};

export const axios_session_data_with_email = {
  data: {
    data: {
      sessionHttpHeaders: {
        ip: "127.0.0.1",
        uuid: "db4cbfd4-7912-44a7-8cbf-d47912e4a792",
        licenses: [
          {
            id: "3b07c615-baf7-4c39-b35d-e7d67f0a2b85",
            entitlement: {
              id: "123959837372834",
            },
          },
          {
            id: "da6ca136-272c-4249-bd1a-db83b6e947d0",
            entitlement: {
              id: "123959836153375",
            },
          },
        ],
        userAccount: {
          contact: {
            email: "email@test.edu",
          },
        },
      },
    },
  },
  status: 200,
};
