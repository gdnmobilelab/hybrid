CREATE TABLE "main"."cache" (
    "cache_id" TEXT NOT NULL,
    "resource_url" TEXT NOT NULL,
    "last_modified" integer,
    "etag" text,
    "contents" blob NOT NULL,
    "headers" text NOT NULL,
    PRIMARY KEY("cache_id","resource_url")
);