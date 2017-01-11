CREATE TABLE "import_scripts" (
    "service_worker_id" integer NOT NULL,
    "resource_url" TEXT NOT NULL,
    "last_modified" integer,
    "etag" text,
    "contents" blob NOT NULL,
    "headers" text NOT NULL,
    "status" integer NOT NULL,
    PRIMARY KEY("service_worker_id", "resource_url")
);
