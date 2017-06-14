CREATE TABLE schema_migrations(
    version INTEGER UNIQUE NOT NULL
);
CREATE TABLE table_name (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
);




INSERT INTO schema_migrations(version) VALUES (201406063106474);
INSERT INTO schema_migrations(version) VALUES (201406063548463);
