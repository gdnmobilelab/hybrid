## v1.4.0

##### Enhancements

* The library is now compatible with FMDB Standalone or Standard flavors from version 2.3.x.

## v1.3.4

##### Bug Fixes

* Now compatible with OS X 10.8 by removing usage of `- [NSScanner scanUnsignedLongLong:]`.

## v1.3.3

##### Enhancements

* Added support for adding code based migration externally to the manager.

## v1.3.2

##### Enhancements

* Fix issue where migrating to a specific version would leave migration open.

## v1.3.1

##### Enhancements

* Lowered OS X deployment target to 10.8

## v1.3.0

##### Enhancements

* Enable users to opt out of the dynamic migration class scanning via the `dynamicMigrationsEnabled` switch.
* Memoize the computed list of migrations for efficiency.

##### Bug Fixes

* Explicitly close all FMDB result sets to avoid generating debug warnings.

## v1.2.2

##### Bug Fixes

* Remove the `-lsqlite3` library flag from the Podspec.

## v1.2.1

##### Bug Fixes

* The podspec now depends on FMDB/common instead of FMDB (which implied FMDB/standard) so that it can be used with FMDB/standalone.

## v1.2.0

##### Enhancements

* Enhanced cancellation via `NSProgress` by exposing data in the `userInfo` dictionary.
* Added error definition for cancelled migrations.
* Changed migration method to use 1 transaction per migration instead of 1 for all migrations.

##### Bug Fixes

* Fixed buggy behavior where `FMDBMigraitonManager` instances would close databases they did not open (and thus own).
* Changed introspection methods to avoid generating query errors when the `schema_migrations` table does not yet exist.

## v1.1.0

##### Enhancements

* Added support for working with databases directly.

## v1.0 (2014-06-08)

* Initial implementation of FMDBMigrationManager.
