This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment

Create a `.env.local` file in the project root and set the variables:

```bash
# .env.local
DATABASE_URL=postgres://postgres:postgres@localhost:5432/form_intake
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
SESSION_SECRET=your-random-secret-string-at-least-32-chars
TYPEFORM_WEBHOOK_SECRET=changeme
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=no-reply@mg.yourdomain.com

# Google Cloud Storage (for image uploads)
GCS_PROJECT_ID=your-gcs-project-id
GCS_BUCKET_NAME=your-bucket-name
GCS_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
# OR use file path instead:
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Google Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Required variables:

- `DATABASE_URL` — Postgres connection string
- `OPENAI_API_KEY` — OpenAI API key
- `SESSION_SECRET` — Secret for signing session and login tokens (min 32 chars)

Optional variables:

- `TYPEFORM_WEBHOOK_SECRET` — verify Typeform webhook signatures
- `OPENAI_PROJECT_ID` — sets `OpenAI-Project` header if using Projects
- `OPENAI_ORG_ID` — sets `OpenAI-Organization` header for legacy org scoping
- `MAILGUN_API_KEY` — Mailgun API key for sending emails (sprint notifications, magic links)
- `MAILGUN_DOMAIN` — Mailgun sending domain (e.g. mg.yourdomain.com)
- `MAILGUN_FROM_EMAIL` — From address for emails (defaults to no-reply@MAILGUN_DOMAIN)
- `BASE_URL` — Base URL for email links (auto-detected if not set, e.g. https://yourdomain.com)
- `GCS_PROJECT_ID` — Google Cloud project ID (for image uploads)
- `GCS_BUCKET_NAME` — Google Cloud Storage bucket name
- `GCS_CREDENTIALS_JSON` — Service account credentials JSON (inline)
- `GOOGLE_APPLICATION_CREDENTIALS` — Path to service account key file (alternative to inline JSON)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Google Analytics 4 Measurement ID (e.g., G-XXXXXXXXXX)

Model selection

- The OpenAI model is selected from a dropdown on the `/documents` page. The selected model is sent with the request when creating a sprint draft. Default is `gpt-4o-mini` if none is selected.

## Google Cloud Storage Setup (for Image Uploads)

Image uploads for the Past Projects portfolio use Google Cloud Storage. Follow these steps:

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your **Project ID**

### 2. Create a Storage Bucket

1. Navigate to **Cloud Storage** > **Buckets**
2. Click **Create Bucket**
3. Choose a unique bucket name (e.g., `sprint-builder-images`)
4. Select a location (e.g., `us-central1`)
5. Choose **Standard** storage class
6. Set access control to **Uniform**
7. Click **Create**

### 3. Create a Service Account

1. Navigate to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name it (e.g., `image-uploader`)
4. Click **Create and Continue**
5. Grant role: **Storage Object Admin**
6. Click **Done**

### 4. Generate Service Account Key

1. Click on your service account
2. Go to **Keys** tab
3. Click **Add Key** > **Create New Key**
4. Choose **JSON** format
5. Download the JSON file

### 5. Configure Environment Variables

**Option A: Inline JSON (recommended for Heroku)**

```bash
# Copy the entire JSON content and minify it to one line
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=sprint-builder-images
GCS_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key":"..."}
```

**Option B: File Path (local development)**

```bash
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=sprint-builder-images
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### 6. Test Upload

1. Start your dev server
2. Navigate to `/dashboard/projects/new`
3. Try uploading an image
4. Check your GCS bucket for the uploaded file

**Free Tier:** Google Cloud Storage offers 5GB free storage + 1GB network egress per month.

## Google Analytics Setup (Optional)

Track user analytics and page views with Google Analytics 4. See [GOOGLE_ANALYTICS_SETUP.md](GOOGLE_ANALYTICS_SETUP.md) for detailed instructions.

### Quick Setup

1. Create a GA4 property at [Google Analytics](https://analytics.google.com/)
2. Get your Measurement ID (format: `G-XXXXXXXXXX`)
3. Add to `.env.local`:
```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```
4. Restart your dev server

The analytics will automatically track page views. See the setup guide for advanced tracking options.

## Admin User Setup

The application includes an admin system for managing users. See [ADMIN_SETUP.md](ADMIN_SETUP.md) for detailed instructions.

### Quick Setup

1. Ensure the database schema is up to date:
```bash
curl -X POST http://localhost:3000/api/admin/db/ensure
```

2. Make your first user an admin by connecting to your database:
```sql
UPDATE accounts SET is_admin = true WHERE email = 'your-email@example.com';
```

3. Log in and visit `/dashboard/users` to manage other users.

See [DATABASE_UPDATE_SUMMARY.md](DATABASE_UPDATE_SUMMARY.md) for verification that all tables are updated.

## User Profile System

Users can view and manage their profile at `/profile`. See [PROFILE_SYSTEM.md](PROFILE_SYSTEM.md) for details.

**Features:**
- View and edit profile information (name, email)
- See all your intake forms
- Browse all your sprint drafts
- Account statistics

Access the profile page through the user menu (click your email in the top-right when logged in).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
