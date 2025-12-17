# Collections

The JSTOR Access in Prison platform now includes content that is distinct from the content available on JSTOR. The content is divided into collections. The current pilot includes a single collection for reentry content.

The collections system provides structured access to curated content through the custom_content API endpoints.

## Current Collections

- **reentry**: Educational and reentry resources (primary collection)

## Technical Architecture

### API Endpoints

- `GET /api/v2/custom_content/metadata/:collection` - Returns collection metadata
- `GET /api/v2/custom_content/pdf/:collection/:filename` - Streams PDF files from S3

### Content Delivery

- **Metadata**: Stored as TypeScript constants in `src/consts/metadata/`
- **Files**: Hosted on AWS S3, streamed directly to client
- **Validation**: Permission-based access requiring restricted items features
- **Format**: JSON / CollectionMetadata[] see custom_content.d.ts

## Adding New Material to Reentry Collection

New material can be added to the reentry collection by following these steps:

1. **File Preparation**: Ensure PDFs are properly formatted (single-page preferred)
2. **Thumbnail Creation**: Generate high-resolution PNG thumbnails with consistent dimensions
   - Use the `makeThumbnail` script in [jaip-frontend repository](https://github.com/ithaka/jaip-frontend)
   - Ensure that the resulting file is in the `public/thumbnails` [folder](https://github.com/ithaka/jaip-frontend/tree/main/public/thumbnails).
3. **S3 Upload**: Add files to both production and test S3 buckets
   - `aws s3 cp <NEWFILE>.pdf s3://ithaka-jaip/test/jaip-collections/reentry/`
   - `aws s3 cp <NEWFILE>.pdf s3://ithaka-jaip/prod/jaip-collections/reentry/`
   - Verify uploads to S3 ithaka-jaip on AWS GUI
4. **Metadata Generation**:
   - Create a metadata object following CollectionMetadata interface standards outlined below.
   - If need be, reference Dublin Core standards for guidance as to generating property values.
   - Add metadata objects to [`src/consts/metadata/reentry.ts`](../src/consts/metadata/reentry.ts)

### CollectionMetadata Interface

```typescript
interface CollectionMetadata {
  title: string;
  description: string;
  filename: string; // PDF filename (follows naming convention below)
  thumbnail: string; // PNG thumbnail filename
  creator: string; // Primary author/organization
  contributor: string; // Additional contributors
  publisher: string; // Publishing organization
  date: string;
  type: string; // Content type
  format: string; // Format description
  page_count: number;
  alternate_versions: AlternateDocumentVersion[];
  subject: string;
  location: string; // Geographic origin of the creator
  language: string; // Primary language
  jurisdiction: string; // Legal jurisdiction or focus of the guide
  is_national: boolean;
  state_code: string; // State code or "USA"
  subject_arr: string[];
}
```

### Filename Convention

Format: `{guide-name}-{year}-{state-code}-{lang}.{ext}`

- **guide-name**: kebab-case guide identifier
- **year**: publication year (2025, 2024)
- **state-code**: lowercase state/country (ny, il, tn, usa)
- **lang**: language code (en, es)
- **ext**: file extension (pdf, png)

Examples: `connections-2025-ny-en.pdf`, `new-path-2025-usa-es.pdf`

## Adding a New Collection

Additional collections can be added with the following steps:

1. Add a new collection name to the `CustomContentCollections` enum.
2. Add a new metadata file in `/src/consts/metadata`.
3. Add the new items to S3. These should be added using the paths specified in the `CUSTOM_CONTENT_BUCKET` in `/src/consts/index.ts`. Within that path, items should be placed in a "directory" that matches the collection name.
4. Export an array of `CollectionMetadata` objects from that metadata file.
   - The value of `filename` in the `CollectionMetadata` objects must match the filename of the object in S3.
5. Export that value from `/src/consts/metadata/index.ts`.
6. Add that array to the `CUSTOM_CONTENT_METADATA` in `/src/consts/index.ts`. The key used in this object should match the collection name in the `CustomContentCollections` enum, which should in turn match the collection name in the S3 path.
7. The new collection will now be available in the API using the format `api/v2/custom_content/metadata/:collection`, where `:collection` is the collection name.
