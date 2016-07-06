CREATE TABLE "main"."cache" (
    "resource_url" TEXT NOT NULL,
    "last_modified" integer,
    "etag" text,
    "contents" blob NOT NULL,
    "headers" text NOT NULL,
    PRIMARY KEY("resource_url")
);