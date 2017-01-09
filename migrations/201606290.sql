CREATE TABLE "service_workers" (
"instance_id" integer PRIMARY KEY,
"url" TEXT NOT NULL,
"scope" TEXT NOT NULL,
"last_modified" integer NOT NULL,
"contents" blob NOT NULL,
"install_state" integer NOT NULL
);
