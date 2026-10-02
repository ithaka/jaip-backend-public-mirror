# Runbook

## Turnkey group approval (disciplines + journals)
_Or, how to bulk-approve disciplines for a group (institution) while carving out
exceptions at the individual journal level._

This is the pattern used for the "full Colorado" rollout and uses the disciplines and journals approved therein as the model. 

Variables that will need to be replaced: 

* <GROUP_NAME> 
* <GROUP_ID>
* <ADMIN_SESSION_UUID>

### 0. Connect to the database

Open three terminals:

* **sidecar** runs the Polaris sidecar. Leave it running.
* **psql** runs the queries in steps 1 and 4.
* **curl** runs the curls in steps 2 and 3.

In the sidecar terminal, start:

```zsh
ithaka sidecar polaris --env prod
```

In the psql terminal, fetch the database URL from AWS SSM:

```zsh
export DATABASE_URL="$(
  aws-vault exec engineer -- aws ssm get-parameter \
    --name "/prod/labs/jaip/jaip-backend/database/url" \
    --with-decryption \
    --region us-east-1 \
    --query 'Parameter.Value' \
    --output text
)"
```

Then connect:

```bash
psql "$DATABASE_URL"
```

This is **prod*. Only run `SELECT`s in psql. Changes go through the API in steps 2 and 3.

## 1. Find the group and its current approvals

Look up the group id(s) you're changing:

```sql
SELECT id, name FROM groups WHERE name IN ('<GROUP_NAME>');
```

Check what's currently approved/denied for a group, keeping only the latest status per item (the statuses table is append-only — every change inserts a new row rather than updating in place):

```sql
  SELECT jstor_item_id, status, created_at FROM (
    SELECT DISTINCT ON (jstor_item_id) jstor_item_id, status, created_at
    FROM statuses
    WHERE group_id = <GROUP_ID>AND jstor_item_type = 'discipline'
    ORDER BY jstor_item_id, id DESC
  ) current_status;
```

Swap `'discipline'` for `'headid'` (journals are stored as `headid`) to check journal-level overrides instead.

### 2. Bulk-approve disciplines

Decide what belongs in the array of disciplines then POST it to the bulk endpoint. 
Example below is the 'full Colorado' where economics and aquatic sciences are already approved. 

```bash
curl -i -X POST 'https://admin.pep.jstor.org/api/v2/media-review/bulk' \
  -H 'Content-Type: application/json' \
  -b 'uuid=<ADMIN_SESSION_UUID>' \
  -d '{
    "groups": [<GROUP_ID> ],
    "disciplines": [
          "africanamericanstudies-discipline","africanstudies-discipline","americanindianstudies-discipline",
          "americanstudies-discipline","anthropology-discipline","archeology-discipline","architecture-discipline",
          "asianstudies-discipline","astronomy-discipline","bibliog-discipline","biologicalsciences-discipline",
          "botany-discipline","britstud-discipline","business-discipline","chemistry-discipline",
          "classicalstudies-discipline","communicationstudies-discipline","criminologycriminaljustice-discipline",
          "developmentalcellbiology-discipline","developmentstudies-discipline","ecology-discipline",
          "education-discipline","engineering-discipline","environmentalscience-discipline","film-discipline",
          "finance-discipline","folklore-discipline","generalscience-discipline","geography-discipline",
          "geology-discipline","health-discipline","healthsciences-discipline","history-discipline",
          "historyofscience-discipline","horticulture-discipline","interrela-discipline","irishstudies-discipline",
          "jewishstudies-discipline","laboremploymentrelations-discipline","latinamericanstudies-discipline",
          "law-discipline","libraryscience-discipline","linguistics-discipline","literature-discipline",
          "manorgbeha-discipline","markadvert-discipline","mathematics-discipline","middleeaststudies-discipline",
          "music-discipline","paleontology-discipline","peaceconflictstudies-discipline","performingarts-discipline",
          "philosophy-discipline","physics-discipline","politicalscience-discipline","populationstudies-discipline",
          "psychology-discipline","publichealth-discipline","publicpolicy-discipline","religion-discipline",
          "research_report","slavicstudies-discipline","socialwork-discipline","sociology-discipline",
          "statistics-discipline","technology-discipline","transportationstudies-discipline","urbanstudies-discipline",
          "womensstudies-discipline","zoology-discipline"
        ]
  }'
```

#### Notes:

* groups accepts a list, so you can apply the same disciplines to multiple groups in one call.
* Grab uuid browser cookies in an authenticated session on admin.pep.jstor.org 
* Any discipline code omitted from the array is left as-is (not implicitly denied) — this endpoint only touches items you include in the payload.
* Re-verify with the query from step 1 after the call. Expect a fresh  created_at timestamp per item, since every call inserts new rows.
* Run the curl with `-i` so you can see the HTTP status. Success has an empty body, so without it a failure looks the same as a success.
* **Requires `bulk_approve` in every group you belong to.** The permission check passes only if the `bulk_approve` feature is enabled for your user in *all* of your groups, not just the target group. If it is missing in any of them, the API returns `403` with an empty body and nothing is written.
* **A `201` does not prove rows were written.** The endpoint only inserts for group ids that are in your own user's groups. Any other id is silently dropped and the request still returns `201`. A database error during the insert is also swallowed and returns `201`. Always confirm with a verification query (step 1 for disciplines, step 4 for journals).
* A `500` with `session management failed: No session returned` means the `uuid` cookie was not recognized (expired or replaced). Nothing was written. Grab a fresh cookie and retry.

### 3. Carve out an individual-journal exception

Denying a whole discipline (e.g. arthistory-discipline) turns off every journal in that discipline.  To restrict one or more specific journals deny the discipline and then individually approve every journal in that discipline except the one(s) you actually want excluded, using the journals key instead of disciplines. 

Journal entries are identified by JSTOR journal UUID.

This is the same endpoint as step 2, so the notes there (the `bulk_approve` requirement, `201` not proving rows were written, session errors) apply here too.

```zsh
curl -i -X POST 'https://admin.pep.jstor.org/api/v2/media-review/bulk' \
  -H 'Content-Type: application/json' \
  -b 'uuid=<ADMIN_SESSION_UUID>' \
  -d '{
    "groups": [<GROUP_ID],
    "journals": [
      "40d0070b-957b-3631-8028-b40c57e22dfd","d01b4f9f-bd91-314e-b469-c4ff14647fb9","590eb6a6-94e5-371b-84ce-211c080335dd",
      "07d9d55f-1d78-316a-8414-6f66588d9062","30fdd9bd-1c53-3102-9ca0-296c61d65690","d0321a5e-55d6-343f-ae3c-d813411ffaee",
      "5e4fcd62-d640-31d1-9f45-402c81ce243b","133d9ac1-f075-34bf-b254-007a773ebc66","8532109c-eed5-3181-aaff-1d92b9dd69f1",
      "7f1c8956-a3a2-3ea9-a661-6eb76d29e845","a342d61d-4c5b-3c28-8f45-aa6354040132","76c5897e-09c5-3cb5-80dd-3a96adb9dd1c",
      "0e79f38e-d8bb-3466-a4a8-fd8e2e49f363","6b56bc8d-befc-38a4-b074-6ad64791e26e","528fbbce-f081-34c8-9d55-8fee64b40d52",
      "4cbbc19f-46e4-3409-9242-929c6b48054c","96b80f31-44d9-307e-b503-a652f628c397","c5517e8a-009b-3c59-a7e8-38677f30480c",
      "8124fbae-c577-30e6-94f2-6acedbf90784","f2be7c23-c993-3a85-b5da-a78bb13aa265","b468a977-36ca-3348-9c4a-045193b2e3ee",
      "1f7409d5-1c9d-3694-8ba1-8b2ee6a44030","47f2495c-139d-3f6b-ab6f-f41064b3b3cf","99d5b578-814f-36b9-822f-d5e27e26412b",
      "60598081-cc5c-363a-b972-c27daaa4dbf2","82c012a3-7ac0-3283-af91-cf230abdb1cb","52a8033b-b770-3613-b268-4c77d4675ed1",
      "3cfb0dd6-947d-3b60-8bad-829550a0b16e","32b7eb2a-16e9-394a-a29d-8e1d9f2b5000","ad7abb2f-544a-3aac-aa6f-8b700889442f",
      "c23a6242-f11c-3e34-8111-185be7532eb9","be4c4f3b-ac8e-3a27-92b0-56d3dd565a76","3098f380-1107-3a59-b4bc-168e1bdda4e4",
      "c41c2de4-f542-37b3-b3c1-84452be6f234","7c222b15-c47a-37e9-9e3a-6165961c19ca","16c34ebf-faa5-30c9-8a1f-9ce0a1dcff23",
      "e5697c6f-dc7c-31d2-b4bb-823f88cd24a2","f05a9a54-07c6-38b7-b701-ba9cf847e416","7f07b5e7-f634-3b76-9a13-1369fae53863",
      "1f749c3a-5f8e-365a-a8a4-ad3eb1eb5f23","b7e4a890-c491-3774-acfe-b644c3737c91","6fe54efc-3d7c-3323-9ba4-9a541ef39b09",
      "424bc2c7-571d-3af5-a919-557757b6d695","dbd308c7-cb1a-30cf-9ec7-73b73e037129","79271dc0-9e01-38fc-a65e-7d1e60f8a461",
      "cb1af299-7d75-3327-bf6c-8ba02ea20b72","0cb6005f-a308-30d1-bef9-809b42fce44a","4de6e77c-d214-397b-9ad4-1eda66f92f68",
      "4531d2d0-27f5-3090-abe4-a7106db4df48","e75ffb73-79b0-38b0-901d-5ac362fd4486","046fc4ee-7e77-36c3-b00f-d5906d262966",
      "aa3e8295-7ccc-314c-b121-e272bcbd95b4","5c86f731-fb50-3e83-9546-225eb80b541e","9f9be217-39af-3cae-bfaf-25f85bb66b2c",
      "a6824a06-3ecd-32ca-8af2-87e49a7b3130","afdd62da-8d10-3657-a772-cd1202f0d223","729e27e2-b0e7-316d-90ff-947eb3cbadc7",
      "cf7cce76-4928-32cd-9c97-0f67ec5c05eb","3b20dace-db77-34eb-9b1c-90b1cfac01ed","3cac6680-055f-39a2-b1b5-d864b3805f9c",
      "cbcf587b-fc8a-3142-bc76-8759e7076281","7406f611-feff-387a-9cd2-32ef48095444","8bdfa293-97ca-3efd-8182-8d3fbe41537a",
      "df56253f-d2cd-30ec-93e0-3273f976beb7","225e3ecc-c99e-3f74-adfa-9cf0d2cbd838","6a9587a7-42e3-3595-bd9f-e741fa1b2a61",
      "42e28220-e9f5-3ee1-9122-7933ee89edd0","8d4763f0-4b92-3246-b9fb-b6ac1b94ea32","c4f0040b-0b2c-3a62-a324-38ae86e11dc7",
      "9b741e89-0613-3141-8e98-adde93f7e400","e4ee744f-f927-39d6-b42f-3a1f0a0a207a","13bb387d-8710-30ba-94b4-2ad509ababdd",
      "278697cb-fdf1-3734-9f94-72d3cec2f7c7","3d80f85a-9741-36b6-a2bf-f75c893f1ccf","3d31c154-a490-3627-a8c8-71792ab23146",
      "8a0e77c2-4cd0-3bbd-b18e-1f41b963acd0","d8fe0741-4a7f-3305-8ffd-47398fcdcd84","4478fd41-28ec-38a3-992b-72a8f2b90940",
      "fbe3b71c-c404-3184-9904-328abbdca679","fd5cc027-13ef-3cb2-9b4d-5079b2f0de9d","150f8354-e565-3814-8270-c6e59adb3cc3",
      "fe0844c6-44f6-35ce-ae1c-c4ee24950b49","b1ba1207-f142-3c1e-a20c-321fc734736d","8482e9a6-f148-36db-9549-62c1226b79e2",
      "514c73ac-c017-35c0-8408-6b5a3b4c69e0","1a05a5b5-1ac1-3a29-beb7-cd920873037c","9b09777a-d984-399b-a643-5cbcb7009495",
      "4e8d81b7-20d6-3b70-a212-c2d40b4a0e8c","a458f9be-c662-3909-96bf-897fc4e69aee","8cec0cbc-7f6d-3324-8cea-5dfa29f167ea",
      "3136ba32-bd73-3ccc-b31d-ba57a96716c5","fe4e2803-2308-32de-b0f2-303c843e62cf","7f367373-ec2e-3ea7-af3e-50dbe9e0632b",
      "5e77c27f-540b-3a9d-a039-c9c07d7a7607","b4cc6cc5-0945-315a-874a-62f7268b3652","8d7e8dfb-2ae6-3528-a71e-c1ae807ac868",
      "e2f296f5-d450-3d3e-8c8d-46ec332a0990","eaa0a5f8-43ce-3059-8c0f-27cfbe54a324","8dd3036a-65ff-39eb-9072-9ab968215cbb",
      "5f522098-1f98-3674-badd-c3dce42a32d8","6805a62c-69ec-318c-8034-483ec7aee49b","46aa7228-0b80-33d7-9a9a-489781769cb9",
      "eddaff02-b59f-3ac1-93d3-d66a2e3baf9d","3ab8c3dc-cb3f-345d-84df-c7fa545ec155","de719890-7c7e-3696-87c8-da1263300d7c",
      "5ededdc9-cfd9-310f-a357-5e6f86e12ea2","a99ceb98-3ef0-322b-92d5-678ddd8a4311","811c4fa9-1762-3afb-be88-b281dc3ad775",
      "f1fd377d-557e-3c12-8cf6-61da92fd0b56","9ce33826-5125-30f0-8016-468bbaa32a8e","97e98ca1-1cb2-329c-878a-e315149a3478",
      "fcbc554b-8855-30cf-8c46-5358ee959e45","53e8503d-a7bb-36d2-93e3-aae6091c3146","d85519b2-a5d2-3e89-8a35-cda80fcee35c",
      "a477408a-05fc-3952-b7c5-7933acde0738","c8fd1893-65fe-3912-a1df-a611c66297a9","6749040d-d916-3d4d-8b54-785ce462066a",
      "d6372a20-c51f-39b6-b0d9-c43025fea29e","28d95ca9-aefc-3175-9842-c0c823532ae5","084ef94e-5aa3-355f-923b-8cd472a3b91e",
      "ef889cfb-fecc-364f-9792-7a2f4a3ab3f6","9b9f4685-81a1-3920-8633-50ab5d05debf","aef34d45-09c6-3839-a9dc-3bd069872b02",
      "92ff4b76-80d1-39e2-9681-f3f37e9c205e","21e682f7-b0d9-354a-ad95-e08c9a3faf0a","64b5f032-790a-39bb-89bc-ec2a3b07e92a",
      "3ee9e1ad-9c13-3d66-9901-07c11554be5f","685c46af-456a-388a-8c39-57f97f20b966","4480847c-0d33-3dc4-a620-82fc8903181e",
      "889d8aaa-b101-355c-8b8a-a2ebe2e555de","59dba41c-825e-393e-961c-ad467bc5fe0a","8dea59b8-a8bc-3dec-807d-e1b9e0f72c87",
      "284fc031-079e-3528-bebf-b7ebf39f6c1b","210c2150-382c-30e9-aa66-aae97dff147e","13fb21d0-2d35-323b-a2fe-21ce03cc4d18",
      "133f8b6b-dbf1-3c29-a560-3bb7dc1c0e92","8f8ef203-260f-3062-af71-8b5bcbd08f64","fa78a784-4c11-3cf6-8e24-7c99a4542a4b",
      "a3a2eece-e287-3537-bcff-b6b14791a6c9","cf06c3f0-d03e-3b7c-9582-6c89a8eecf31","4167bfc1-6a4e-3602-8648-a5d6242ef420",
      "79e55558-6bf3-3fe8-8472-9ab8209f84e3","35c319e4-2ad0-3057-80d2-9fbd004bccb4","93a1c95c-597f-39b2-aba6-cee28e31afde",
      "964be8db-3725-327a-90b2-89a6d2dedce2","ce1f8673-4caa-3123-8355-4469fbb737f6","60adc8e9-c813-3833-9547-8aa10eb107d9",
      "837e1cad-2630-3f58-9729-99dbc0be13c9","e512ddef-61cb-345a-b471-9db66b818227","c4518809-2930-32e3-82d3-9db62a3c6ff4",
      "67321c81-eac3-31cc-a0fa-396b3988d784","fa18cd92-de4c-3c7f-a8ef-738d548428bd","c631571e-8bc1-3f3c-8716-17b14529c5d9",
      "54d58721-eeae-3fc5-b94e-dacd5e3884dd","62e77fbf-0ed8-3aa5-8db2-71dd547b6a54","d2d197dc-30b6-3a42-9835-e25ac5360e93",
      "539b13fd-a4a6-39f5-a0ba-f88a3fc5d696","e1b6b788-cd86-3a13-bfbc-e6193574d61b","e9aaf632-9a84-30d3-b28d-6650d339cbbc",
      "84166e37-fd40-3242-b702-34549ad7d99a","bf72a325-b497-3fbf-9ea7-aeb1d338aca4","05774a3f-9bd4-31a9-bc7d-287632ec826b",
      "bd1141b1-5d1f-3104-9b12-69727a70424e","c699178b-b8c3-38e4-9af3-4deb0e68a1f4","24572657-c2c5-3720-8e01-cd146e93af64",
      "eedad3d5-a6df-3966-9b2b-6be319ced5aa","a7d4f802-d779-3630-93d7-d9772f982d4c","02b3f198-c2f8-3470-b0f4-15e480d1befd",
      "163da960-61ca-368d-9111-d0a9118add1d"
    ]
  }'
```

### 4. Verify

Count the journals whose latest status was written in the last hour. Expect one `Approved` row per journal id you posted in step 3. If the timestamps look hours off, the database timezone differs from yours: widen the interval.

```sql
SELECT status, count(*) AS journals, min(created_at) AS first_row, max(created_at) AS last_row
FROM (
  SELECT DISTINCT ON (jstor_item_id) jstor_item_id, status, created_at
  FROM statuses
  WHERE group_id = <GROUP_ID> AND jstor_item_type = 'headid'
  ORDER BY jstor_item_id, id DESC
) current_status
WHERE created_at > now() - interval '1 hour'
GROUP BY status;
```

Then spot-check individual journals (the first, second and last ids from step 3):

```sql
SELECT jstor_item_id, status, created_at FROM (
  SELECT DISTINCT ON (jstor_item_id) jstor_item_id, status, created_at
  FROM statuses
  WHERE group_id = <GROUP_ID> AND jstor_item_type = 'headid'
  ORDER BY jstor_item_id, id DESC
) current_status
WHERE jstor_item_id IN (
  '40d0070b-957b-3631-8028-b40c57e22dfd',
  'd01b4f9f-bd91-314e-b469-c4ff14647fb9',
  '163da960-61ca-368d-9111-d0a9118add1d'
);
```

Confirm the discipline-level row for the carved-out discipline reflects your intended top-level status (e.g. arthistory-discipline → Denied at the discipline level, but its journals individually Approved), and spot-check a couple of the individually-approved journal ids resolve to the expected status and timestamp.

ᕕ( ᐛ )ᕗ 
