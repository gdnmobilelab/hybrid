CREATE TABLE "cache" (
    "service_worker_url" TEXT NOT NULL,
    "cache_id" TEXT NOT NULL,
    "resource_url" TEXT NOT NULL,
    "last_modified" integer,
    "etag" text,
    "contents" blob NOT NULL,
    "headers" text NOT NULL,
    "status" integer NOT NULL,
    PRIMARY KEY("service_worker_url", "cache_id","resource_url")
);