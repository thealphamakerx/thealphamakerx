# Cloudflare R2 setup (product files)

Product files (paid PDF/ebook downloads and free previews) live in a **private
R2 bucket of their own** on the existing Cloudflare account. It is separate from
any other project's bucket, and the API token below can only reach this bucket.

## 1. Create the bucket

Cloudflare dashboard → **R2 Object Storage** → **Create bucket**

- Name: `thealphamakerx-products` (anything works; it goes in `R2_BUCKET`)
- Location: Automatic
- Leave **Public access** off. Files are only served through short-lived
  presigned URLs, never a public `r2.dev` or custom-domain URL.

## 2. Create a bucket-scoped API token

R2 → **Manage R2 API Tokens** → **Create API token**

- Permissions: **Object Read & Write**
- Specify bucket(s): **Apply to specific buckets only** → `thealphamakerx-products`
- TTL: Forever (or your policy)

Copy the **Access Key ID** and **Secret Access Key** (the secret is shown once).
Your **Account ID** is on the R2 overview page.

## 3. Allow browser uploads (CORS)

The admin panel uploads files straight from the browser to R2. Without a CORS
policy, the upload fails with "Network error during upload".

Bucket → **Settings** → **CORS policy** → Edit:

```json
[
  {
    "AllowedOrigins": ["https://www.thealphamakerx.in", "https://thealphamakerx.in", "http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Disposition"],
    "MaxAgeSeconds": 3600
  }
]
```

Add any other admin origin you use, such as a Vercel preview domain.

## 4. Environment variables

Server-only. Set them in `.env.local` and in the hosting provider (Vercel →
Settings → Environment Variables). Never prefix them with `NEXT_PUBLIC_`.

```env
R2_ACCOUNT_ID=<account id>
R2_ACCESS_KEY_ID=<access key id>
R2_SECRET_ACCESS_KEY=<secret access key>
R2_BUCKET=thealphamakerx-products
```

## How files are served

| File | Who | Route | Link lifetime |
| --- | --- | --- | --- |
| Product file | Verified buyers only | `/api/download/[token]/[productId]` | 15 minutes |
| Preview file | Anyone | `/api/preview/[productId]` | 15 minutes |

Download checks (`src/lib/downloads.ts`), in order. If any check fails, the
route answers 403 (or 404 when no file exists) and no URL is signed:

1. The buyer's order link token is valid. The token is HMAC-signed and sent to
   the order's email, so no login is needed.
2. The order exists.
3. The order belongs to that email (`userId = guest:<email>`).
4. The order is `PAID`. That status is only set after Cashfree confirms the
   payment server-side, and refunds or cancellations clear it.
5. The product is an item in that order.
6. The product has a file.
7. A presigned R2 URL is generated, and it expires after 15 minutes.
