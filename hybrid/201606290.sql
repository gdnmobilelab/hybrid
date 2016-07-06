CREATE TABLE "service_workers" (
    "url" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "install_state" integer NOT NULL,
    PRIMARY KEY("url")
);
