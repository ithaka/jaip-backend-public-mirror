# Authentication

## Admin Site

### Overview

The admin site uses a fairly conventional login system with a username and password. We use the login system at jstor.org. This means that in order to access that admin features, three things need to happen.

1. The admin must set up a MyJSTOR account at jstor.org/register.
2. The admin must be added to the admin site with the same email address used in the MyJSTOR account.
3. That admin user must have admin privileges enabled with at least one Group.
   Provided those things happen, then the login process is simple:
4. The user visits `admin.pep.jstor.org` and clicks the login button, which will take the user to a login page at `jstor.org`. Alternatively, the user may visit `admin.test-pep.jstor.org` or `admin.pep.localhost` (if working locally). Either of those sites will send the user to `firefly.jstor.org` for login.
5. The user enters their username and password.
6. JSTOR redirects the user back to admin.pep.jstor.org (via the `jaip-auth-lambda`) with a cookie containing a UUID.
7. The admin site then sends that UUID cookie with all requests. Every request that requires authentication includes that cookie, which is then verified with JSTOR to authenticate the user.

### The Extra Hop

It’s a bit unusual to jump to a different subdomain in the process of login in. Moving from `admin.pep.jstor.org` over to `jstor.org` may seem odd. There are two reasons for this process. The first is that during the initial building of the system, it was easier to rely on the existing login infrastructure than to build out something separate. The reason we kept that system, however, is that some security people on Department of Corrections (DOC) IT teams tended to like it because it means that accessing the administration site requires access to two different subdomains that would have to be individually whitelisted. They felt it could reduce the odds of unauthorized access.

## Student Site

### Overview

Authentication on the student site is done via IP address. When a request is made for the page, the IP address associated with the request is sent to [SESSION-SERVICE](https://github.com/ithaka/session-service), which checks to see if the IP address is associated with any institution, and returns a sitecode that identifies the institution. The PEP backend then matches that sitecode with a Facility (note that “Facility” may refer to one or more actual facilities). We do not store the session UUID cookie for the student site. Using a cookie from the frontend requires us to be able to rely on the cookie. That's unsustainable for auth purposes, because using a cookie associated with another Facility could allow access to unauthorized material. A cookie can also become associated with multiple sitecodes, resulting in difficulty disambiguating the source of the request. To avoid these issues, we rely solely on the IP address.

In some cases, the IP address may be associated with multiple Facilities. There are two possibilities for the source of this issue. One is a networking problem. If a DOC or network provider gives us the IP address for a Facility and then later reassigns that IP to a different facility or allows multiple Facilities to share that IP without telling us, we would authenticate all Facilities as the original Facility. This would need to be resolved with the DOC or network provider.

Another possibility is that the DOC or network provider needs to distinguish between multiple Facilities but is unable to provide each with a distinct IP range. In cases like that, we use a combination of subdomain and sitecode to identify a specific Facility.

### The Easy Way

This is an example of how the process typically works when there are no complications:

1. A visitor comes to pep.jstor.org from IP address `100.10.20.30`, and the browser sends requests to endpoints that require authentication.
2. `jaip-backend` sends a request to JSTOR’s `SESSION-SERVICE` including the IP address associated with the original request from the browser.
3. `SESSION-SERVICE` correctly identifies that `100.10.20.30` is associated with, let’s say, the Erewhon Department of Corrections and returns er.doc.gov as a sitecode.
4. `jaip-backend` sends a request to the database with that sitecode.
5. The database identifies that sitecode as associated with a Erewhon Department of Corrections Facility and returns the Facility data (including all the privileges enabled at that facility).

In short, the IP address in the request is used to get the sitecode, which is used to identify the Facility.

### Complications

Some hardware and networking providers route every request through their network in such a way that all outgoing traffic comes from the same IP address. These providers service multiple Departments of Corrections, which means that requests coming from a single IP address might come from any of the areas where they have contracts. This is not something that happens with Universities and other institutions that JSTOR works with, so we’ve had to come up with a novel solution.

### The Hard Way

In cases where IP addresses are shared among multiple Facilities, we can use a combination of IP addresses and subdomains. This is perhaps best explained with an example case. First, let’s consider what happens when things go wrong. Let’s imagine that the request is coming to `pep.jstor.org` from an IP on a tablet provider’s network.

1. A visitor comes from IP address on the provider's network: `100.20.40.60`
2. `jaip-backend` sends a request to JSTOR’s `SESSION-SERVICE`.
3. `SESSION-SERVICE` correctly identifies that `100.20.40.60` is associated with the tablet provider and returns `tablet-technologies.com` as a sitecode.
4. `jaip-backend` sends a request to the database with that sitecode.
5. The database cannot find a Facility that matches `tablet-technologies.com`.
6. `jaip-backend` checks the database for a Facility associated with the combination of the subdomain (in this case, `pep`) and the sitecode (`tablet-technologies.com`).
7. The database has no Facility associated with that combination of subdomain and sitecode.
8. `jaip-backend` cannot return a successful authentication.
9. `jaip-frontend` shows a default About page with no further options.

Now let’s look at what happens when the same person visits `tablet-er.pep.jstor.org`. Steps 1 through 5 are the same as above.

1. `jaip-backend` checks the database for a Facility associated with the combination of the subdomain (in this case, `tablet-er.pep`) and the sitecode (`tablet-technologies.com`).
2. The database finds a Facility associated with that combination and returns the Facility data (including all the privileges enabled at that facility).
3. The site can display whatever the Facility is able to access.

Those are basically the three possibilities that describe what might happen during the authentication process on the student site. In short:

1. A successful authentication based on IP address, where a sitecode is associated with a Facility in the database.
2. An unsuccessful attempt, where neither a sitecode alone nor a combination of sitecode and subdomain are associated with a Facility.
3. A successful authentication where the sitecode is not associated with a Facility, but the combination of a sitecode and a subdomain is associated with a Facility in the database.

### IP Bypass

There is one additional access option. This one requires direct access to the database and is meant to be used for people within ITHAKA and occasionally for a DOC or other service provider who’s very early in the process of exploring what we offer. Rather than go through the process of setting up a sitecode, we can directly link an IP address with a Facility in the database. When authentication otherwise fails, the `jaip-backend` will do this final check. This is sometimes how we access the site internally, when not using the VPN, because our individual home IP addresses are not necessarily associated with any existing sitecodes.
