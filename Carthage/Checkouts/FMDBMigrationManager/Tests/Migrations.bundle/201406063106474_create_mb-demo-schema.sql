/* Create Monkey Butler Tables */

-- Maintains list of applied migrations
CREATE TABLE schema_migrations(
    version INTEGER UNIQUE NOT NULL
);

/* Create application tables */

/*
 CREATE TABLE table_name (
   id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
   ...
 );
*/
