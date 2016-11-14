-- SQLite doesn't support dropping columns

CREATE TEMPORARY TABLE service_workers_backup(instance_id,url,scope,contents,install_state);
INSERT INTO service_workers_backup SELECT
    "instance_id",
    "url",
    "scope",
    "contents",
    "install_state"
FROM service_workers;
DROP TABLE service_workers;

CREATE TABLE "service_workers" (
"instance_id" integer PRIMARY KEY,
"url" TEXT NOT NULL,
"scope" TEXT NOT NULL,
"last_checked" integer NOT NULL,
"contents" blob NOT NULL,
"install_state" integer NOT NULL
);


INSERT INTO service_workers SELECT
instance_id,
url,
scope,
-1,
contents,
install_state

FROM service_workers_backup;
DROP TABLE service_workers_backup;
