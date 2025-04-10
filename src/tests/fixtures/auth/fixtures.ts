export const fake_subdomain = "fake-subdomain.test-pep.jstor.org";
export const valid_student_subdomain = "test-pep.jstor.org";
export const valid_provider_subdomain = "test-subdomain.test-pep.jstor.org";

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
      session: {
        uuid: "uuid",
      },
    },
  },
  status: 200,
};

export const axios_session_data_with_code = {
  data: {
    data: {
      session: {
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
      session: {
        uuid: "uuid",
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
