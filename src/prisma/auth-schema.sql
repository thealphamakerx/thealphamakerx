-- Better Auth core schema (v1.7.x field set: user, session, account,
-- verification), plus the `role` additionalField configured in
-- src/lib/auth.ts. Run this once against the Neon database — Better Auth
-- does not manage this table's DDL itself; there is no CLI in this
-- installed version to generate it (`@better-auth/cli` is deprecated and
-- pinned behind the core `better-auth` package's version).
--
-- Regenerate/adjust this file by hand if src/lib/auth.ts's `user`/`session`/
-- `account`/`verification` config changes (additionalFields, plugins, etc).

create table if not exists "user" (
  "id" text primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null default false,
  "image" text,
  "role" text not null default 'CUSTOMER',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "session" (
  "id" text primary key,
  "userId" text not null references "user"("id") on delete cascade,
  "token" text not null unique,
  "expiresAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "session_userId_idx" on "session"("userId");

create table if not exists "account" (
  "id" text primary key,
  "userId" text not null references "user"("id") on delete cascade,
  "accountId" text not null,
  "providerId" text not null,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "account_userId_idx" on "account"("userId");

create table if not exists "verification" (
  "id" text primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "verification_identifier_idx" on "verification"("identifier");
