# Environment Variables Template

Copy this to `.env.local` in your project root and fill in your actual values.

```bash
# Database (Required)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/form_intake

# OpenAI API (Required)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: OpenAI Organization/Project headers
OPENAI_PROJECT_ID=
OPENAI_ORG_ID=

# Session Secret (Required - generate a random 32+ character string)
SESSION_SECRET=your-random-secret-string-at-least-32-chars-long

# Typeform Webhook (Optional - for verifying webhook signatures)
TYPEFORM_WEBHOOK_SECRET=changeme

# Mailgun Email (Optional - for magic link authentication emails)
MAILGUN_API_KEY=
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=no-reply@mg.yourdomain.com

# Google Cloud Storage (Optional - for image uploads)
GCS_PROJECT_ID=your-gcs-project-id
GCS_BUCKET_NAME=your-bucket-name

# Option A: Inline JSON (recommended for Heroku/production)
# Minify your service-account-key.json to a single line
GCS_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key":"...","private_key_id":"...","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}

# Option B: File path (alternative for local dev)
# If using this, comment out GCS_CREDENTIALS_JSON above
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## How to Set Up Your .env.local

### 1. Create the file
```bash
cp ENV_TEMPLATE.md .env.local
# Or manually create .env.local and copy the content above
```

### 2. Fill in Required Variables

**DATABASE_URL**: Your local Postgres connection string
- If using local Postgres: `postgres://postgres:postgres@localhost:5432/form_intake`
- If using Heroku Postgres or other: Use the provided connection string

**OPENAI_API_KEY**: Get from https://platform.openai.com/api-keys
- Format: `sk-...`

**SESSION_SECRET**: Generate a secure random string
```bash
# Quick way to generate one:
openssl rand -base64 32
# Or just use a random string like: 
# "my-super-secret-session-key-that-is-at-least-32-characters-long"
```

### 3. Fill in Optional Variables (as needed)

**Google Cloud Storage** (for image uploads):
1. Follow the setup guide in README.md
2. Get credentials from Google Cloud Console
3. Add GCS_PROJECT_ID, GCS_BUCKET_NAME, and GCS_CREDENTIALS_JSON

**Mailgun** (for magic link emails):
- Get credentials from https://mailgun.com
- Add MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM_EMAIL

**Typeform** (for webhook signature verification):
- Get webhook secret from Typeform webhook settings
- Add TYPEFORM_WEBHOOK_SECRET

## Testing Your Setup

After filling in the variables, restart your dev server:
```bash
npm run dev
```

Visit http://localhost:3000/api/admin/db/ensure to initialize the database.

