-- We changed our migration versioning scheme, so we need to drop
-- any existing tables, if they're there

DROP TABLE IF EXISTS service_workers;
DROP TABLE IF EXISTS cache;

CREATE TABLE "service_workers" (
    "instance_id" integer PRIMARY KEY,
    "url" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "last_modified" integer NOT NULL,
    "contents" blob NOT NULL,
    "install_state" integer NOT NULL
);
