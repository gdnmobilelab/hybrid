//
//  FMDBMigrationManagerTests.m
//  FMDBMigrationManager
//
//  Created by Blake Watters on 6/6/14.
//
//

#import <XCTest/XCTest.h>
#define EXP_SHORTHAND
#import "Expecta.h"
#import "FMDBmigrationManager.h"

static NSString *FMDBApplicationDataDirectory(void)
{
#if TARGET_OS_IPHONE
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    return ([paths count] > 0) ? [paths objectAtIndex:0] : nil;
#else
    NSFileManager *sharedFM = [NSFileManager defaultManager];
    
    NSArray *possibleURLs = [sharedFM URLsForDirectory:NSApplicationSupportDirectory
                                             inDomains:NSUserDomainMask];
    NSURL *appSupportDir = nil;
    NSURL *appDirectory = nil;
    
    if ([possibleURLs count] >= 1) {
        appSupportDir = [possibleURLs objectAtIndex:0];
    }
    
    if (appSupportDir) {
        NSString *executableName = [[[NSBundle mainBundle] executablePath] lastPathComponent];
        appDirectory = [appSupportDir URLByAppendingPathComponent:executableName];
        return [appDirectory path];
    }
    
    return nil;
#endif
}

static NSString *FMDBRandomDatabasePath()
{
    return [FMDBApplicationDataDirectory() stringByAppendingPathComponent:[[NSUUID UUID] UUIDString]];
}

static NSBundle *FMDBMigrationsTestBundle()
{
    NSBundle *parentBundle = [NSBundle bundleForClass:NSClassFromString(@"FMDBMigrationManagerTests")];
    return [NSBundle bundleWithPath:[parentBundle pathForResource:@"Migrations" ofType:@"bundle"]];
}

static FMDatabase *FMDatabaseWithSchemaMigrationsTable()
{
    FMDatabase *database = [FMDatabase databaseWithPath:FMDBRandomDatabasePath()];
    [database open];
    [database executeStatements:@"CREATE TABLE schema_migrations(version INTEGER UNIQUE NOT NULL);"];
    return database;
}

@interface FMDBTestObjectMigration : NSObject <FMDBMigrating>
@end

@implementation FMDBTestObjectMigration

- (NSString *)name
{
    return @"My Object Migration";
}

- (uint64_t)version
{
    return 201499000000000;
}

- (BOOL)migrateDatabase:(FMDatabase *)database error:(out NSError *__autoreleasing *)error
{
    return YES;
}

@end

@interface FMDBMigrationManagerTests : XCTestCase
@end

@implementation FMDBMigrationManagerTests

+ (void)setUp
{
    NSString *applicationDataDirectory = FMDBApplicationDataDirectory();
    BOOL isDirectory;
    if ([[NSFileManager defaultManager] fileExistsAtPath:applicationDataDirectory isDirectory:&isDirectory]) {
        if (!isDirectory) [NSException raise:NSInternalInconsistencyException format:@"Cannot execute tests: expected to find directory at path returned by `FMDBApplicationDataDirectory()`, but instead found a file. (%@)", applicationDataDirectory];
    } else {
        NSError *error = nil;
        if (![[NSFileManager defaultManager] createDirectoryAtPath:applicationDataDirectory withIntermediateDirectories:YES attributes:nil error:&error]) {
            [NSException raise:NSInternalInconsistencyException format:@"Cannot execute tests: failed while attempting to create path returned by `FMDBApplicationDataDirectory()`: %@ (%@)", error, applicationDataDirectory];
        }
    }
}

- (void)testThatMigrationManagerDoesNotCloseExistingOpenDatabase
{
    FMDatabase *database = [FMDatabase databaseWithPath:nil];
    [database open];
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabase:database migrationsBundle:FMDBMigrationsTestBundle()];
    manager = nil;
    expect(database.goodConnection).to.beTruthy();
}

- (void)testThatMigrationManagerClosesDatabaseThatItOpened
{
    FMDatabase *database = nil;
    @autoreleasepool { // Ensures dealloc on iOS
        FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:nil migrationsBundle:FMDBMigrationsTestBundle()];
        database = manager.database;
        expect(database.goodConnection).to.beTruthy();
        manager = nil;
    }
    expect(database.goodConnection).to.beFalsy();
}

- (void)testHasMigrationTableWhenTableDoesntExist
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.hasMigrationsTable).to.beFalsy();
}

- (void)testHasMigrationTableWhenTableExists
{
    FMDatabase *database = FMDatabaseWithSchemaMigrationsTable();
    [database close];
    
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:database.databasePath migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.hasMigrationsTable).to.beTruthy();
}

- (void)testThatNeedsMigrationIsTrueIfMigrationsTableDoesNotExist
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:nil migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.needsMigration).to.beTruthy();
}

- (void)testThatNeedsMigrationIsTrueIfDatabaseIsNotFullyMigrated
{
    FMDatabase *database = FMDatabaseWithSchemaMigrationsTable();
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @201406063106474];
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @201406063548463];
    [database close];
    
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:database.databasePath migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.needsMigration).to.beTruthy();
}

- (void)testThatNeedsMigrationIsFalseIfDatabaseIsFullyMigrated
{
    FMDatabase *database = FMDatabaseWithSchemaMigrationsTable();
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @201406063106474];
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @201406063548463];
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @201499000000000];
    [database close];
    
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:database.databasePath migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.needsMigration).to.beFalsy();
}

- (void)testAddingMigrationBeforeMemoization
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    manager.dynamicMigrationsEnabled = NO;
    FMDBTestObjectMigration *migration = [FMDBTestObjectMigration new];
    [manager addMigration:migration];
    NSArray *migrations = manager.migrations;
    expect(migrations).to.haveCountOf(3);
    expect([migrations valueForKey:@"name"]).to.equal(@[@"create_mb-demo-schema", @"create_add_second_table", @"My Object Migration"]);
    expect([migrations valueForKey:@"version"]).to.equal(@[@201406063106474, @201406063548463, @201499000000000 ]);
}

- (void)testAddingMigrationsBeforeMemoization
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    manager.dynamicMigrationsEnabled = NO;
    FMDBTestObjectMigration *migration = [FMDBTestObjectMigration new];
    [manager addMigrations:@[ migration ]];
    NSArray *migrations = manager.migrations;
    expect(migrations).to.haveCountOf(3);
    expect([migrations valueForKey:@"name"]).to.equal(@[@"create_mb-demo-schema", @"create_add_second_table", @"My Object Migration"]);
    expect([migrations valueForKey:@"version"]).to.equal(@[@201406063106474, @201406063548463, @201499000000000 ]);
}

- (void)testAddingMigrationAfterMemoization
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    manager.dynamicMigrationsEnabled = NO;
    
    // Load it once
    NSArray *migrations = manager.migrations;
    expect(migrations).to.haveCountOf(2);
    expect([migrations valueForKey:@"name"]).to.equal(@[@"create_mb-demo-schema", @"create_add_second_table"]);
    expect([migrations valueForKey:@"version"]).to.equal(@[@201406063106474, @201406063548463 ]);
    
    // Add a migration and verify its reflected
    FMDBTestObjectMigration *migration = [FMDBTestObjectMigration new];
    [manager addMigration:migration];
    migrations = manager.migrations;
    expect(migrations).to.haveCountOf(3);
    expect([migrations valueForKey:@"name"]).to.equal(@[@"create_mb-demo-schema", @"create_add_second_table", @"My Object Migration"]);
    expect([migrations valueForKey:@"version"]).to.equal(@[@201406063106474, @201406063548463, @201499000000000 ]);
}

- (void)testAddingMigrationsAfterMemoization
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    manager.dynamicMigrationsEnabled = NO;
    
    // Load it once
    NSArray *migrations = manager.migrations;
    expect(migrations).to.haveCountOf(2);
    expect([migrations valueForKey:@"name"]).to.equal(@[@"create_mb-demo-schema", @"create_add_second_table"]);
    expect([migrations valueForKey:@"version"]).to.equal(@[@201406063106474, @201406063548463 ]);
    
    // Add a migration and verify its reflected
    FMDBTestObjectMigration *migration = [FMDBTestObjectMigration new];
    [manager addMigrations:@[ migration ]];
    migrations = manager.migrations;
    expect(migrations).to.haveCountOf(3);
    expect([migrations valueForKey:@"name"]).to.equal(@[@"create_mb-demo-schema", @"create_add_second_table", @"My Object Migration"]);
    expect([migrations valueForKey:@"version"]).to.equal(@[@201406063106474, @201406063548463, @201499000000000 ]);
}

- (void)testGettingMigrations
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    NSArray *migrations = manager.migrations;
    expect(migrations).to.haveCountOf(3);
    expect([migrations valueForKey:@"name"]).to.equal(@[@"create_mb-demo-schema", @"create_add_second_table", @"My Object Migration"]);
    expect([migrations valueForKey:@"version"]).to.equal(@[@201406063106474, @201406063548463, @201499000000000 ]);
}

- (void)testGettingMigrationByVersion
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    FMDBFileMigration *migration = [manager migrationForVersion:201406063106474];
    NSString *expectedPath = [FMDBMigrationsTestBundle() pathForResource:@"201406063106474_create_mb-demo-schema" ofType:@"sql"];
    expect(migration.version).to.equal(201406063106474);
    expect(migration.name).to.equal(@"create_mb-demo-schema");
    expect(migration.path).to.equal(expectedPath);
}

- (void)testGettingMigrationByName
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    FMDBFileMigration *migration = [manager migrationForName:@"create_mb-demo-schema"];
    NSString *expectedPath = [FMDBMigrationsTestBundle() pathForResource:@"201406063106474_create_mb-demo-schema" ofType:@"sql"];
    expect(migration.version).to.equal(201406063106474);
    expect(migration.name).to.equal(@"create_mb-demo-schema");
    expect(migration.path).to.equal(expectedPath);
}

- (void)testNewDatabaseReturnsZeroForCurrentVersion
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.currentVersion).to.equal(0);
}

- (void)testCreatingSchemaMigrationsTable
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.hasMigrationsTable).to.beFalsy();
    NSError *error = nil;
    BOOL success = [manager createMigrationsTable:&error];
    expect(success).to.beTruthy();
    expect(error).to.beNil();
    expect(manager.hasMigrationsTable).to.beTruthy();
}

- (void)testDatabaseWithSingleRowReturnsItForCurrentVersion
{
    FMDatabase *database = FMDatabaseWithSchemaMigrationsTable();
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @31337];
    [database close];
    
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:database.databasePath migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.currentVersion).to.equal(31337);
}

- (void)testDatabaseWithSingleRowReturnsItForOriginVersion
{
    FMDatabase *database = FMDatabaseWithSchemaMigrationsTable();
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @31337];
    [database close];
    
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:database.databasePath migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.originVersion).to.equal(31337);
}

- (void)testDatabaseWithMultipleVersionReturnsCorrectValueForOriginVersion
{
    FMDatabase *database = FMDatabaseWithSchemaMigrationsTable();
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @31337];
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @99999];
    [database close];
    
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:database.databasePath migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.originVersion).to.equal(31337);
}

- (void)testDatabaseWithMultipleVersionReturnsCorrectValueForCurrentVersion
{
    FMDatabase *database = FMDatabaseWithSchemaMigrationsTable();
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @31337];
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @99999];
    [database close];
    
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:database.databasePath migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.currentVersion).to.equal(99999);
}

- (void)testNewDatabaseReturnsZeroForOriginVersion
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.originVersion).to.equal(0);
}

- (void)testNewDatabaseReturnsEmptyArrayForAppliedVersions
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.appliedVersions).to.beNil();
}

- (void)testAppliedVersionReturnsAllRowsFromTheSchemaMigrationsTable
{
    FMDatabase *database = FMDatabaseWithSchemaMigrationsTable();
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @31337];
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @99999];
    [database close];
    
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:database.databasePath migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.appliedVersions).to.equal(@[ @31337, @99999 ]);
}

- (void)testPendingVersionsForNewDatabase
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.pendingVersions).to.equal(@[@201406063106474, @201406063548463, @201499000000000]);
}

- (void)testPendingVersionsForNonUpToDateDatabase
{
    FMDatabase *database = FMDatabaseWithSchemaMigrationsTable();
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @201406063106474];
    [database close];
    
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:database.databasePath migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.pendingVersions).to.equal(@[ @201406063548463, @201499000000000 ]);
}

- (void)testPendingVersionsFullyMigratedDatabase
{
    FMDatabase *database = FMDatabaseWithSchemaMigrationsTable();
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @201406063106474];
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @201406063548463];
    [database executeUpdate:@"INSERT INTO schema_migrations(version) VALUES (?)", @201499000000000];
    [database close];
    
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:database.databasePath migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.pendingVersions).to.beEmpty();
}

- (void)testMigratingNewDatabaseToLatestVersion
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.hasMigrationsTable).to.beFalsy();
    NSError *error = nil;
    BOOL success = [manager migrateDatabaseToVersion:UINT64_MAX progress:nil error:&error];
    expect(success).to.beTruthy();
    expect(error).to.beNil();
    expect(manager.hasMigrationsTable).to.beTruthy();
    expect(manager.currentVersion).to.equal(201499000000000);
}

- (void)testMigratingInMemoryDatabaseToLatestVersion
{
    FMDatabase *database = [FMDatabase databaseWithPath:nil];
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabase:database migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.hasMigrationsTable).to.beFalsy();
    NSError *error = nil;
    BOOL success = [manager migrateDatabaseToVersion:UINT64_MAX progress:nil error:&error];
    expect(success).to.beTruthy();
    expect(error).to.beNil();
    expect(manager.hasMigrationsTable).to.beTruthy();
    expect(manager.currentVersion).to.equal(201499000000000);
}

- (void)testMigratingNewDatabaseToSpecificVersion
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.hasMigrationsTable).to.beFalsy();
    NSError *error = nil;
    BOOL success = [manager migrateDatabaseToVersion:201406063106474 progress:nil error:&error];
    expect(success).to.beTruthy();
    expect(error).to.beNil();
    expect(manager.hasMigrationsTable).to.beTruthy();
    expect(manager.currentVersion).to.equal(201406063106474);
    
    // Also check if the the database is not in transaction
    expect(manager.database.inTransaction).to.beFalsy();
}

- (void)testThatMigrationCanBeCancelledViaProgressBlock
{
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:FMDBMigrationsTestBundle()];
    expect(manager.hasMigrationsTable).to.beFalsy();
    NSError *error = nil;
    BOOL success = [manager migrateDatabaseToVersion:UINT64_MAX progress:^(NSProgress *progress) {
        if ([progress.userInfo[@"version"] isEqualToNumber:@201406063548463]) {
            [progress cancel];
        }
    } error:&error];
    expect(success).to.beFalsy();
    expect(error).notTo.beNil();
    expect(error.domain).to.equal(FMDBMigrationManagerErrorDomain);
    expect(error.code).to.equal(FMDBMigrationManagerErrorMigrationCancelled);
    expect(manager.hasMigrationsTable).to.beTruthy();
    expect(manager.currentVersion).to.equal(201406063106474);
}

- (void)testFMDBIsMigrationAtPath
{
    expect(FMDBIsMigrationAtPath(@"1.sql")).to.beTruthy();
    expect(FMDBIsMigrationAtPath(@"12345.sql")).to.beTruthy();
    expect(FMDBIsMigrationAtPath(@"999999999999999.sql")).to.beTruthy();
    expect(FMDBIsMigrationAtPath(@"12345_name.sql")).to.beTruthy();
    expect(FMDBIsMigrationAtPath(@"12345_ThisIsAlsoValid.sql")).to.beTruthy();
    expect(FMDBIsMigrationAtPath(@"12345_This Is Also Valid.sql")).to.beTruthy();
    expect(FMDBIsMigrationAtPath(@"12345_ChangeToMaximumOf5Users.sql")).to.beTruthy();
    
    // Negative cases
    expect(FMDBIsMigrationAtPath(@"a1.sql")).to.beFalsy();
    expect(FMDBIsMigrationAtPath(@"the_schema.sql")).to.beFalsy();
    expect(FMDBIsMigrationAtPath(@"the_schema")).to.beFalsy();
    expect(FMDBIsMigrationAtPath(@"the_schema")).to.beFalsy();
    expect(FMDBIsMigrationAtPath(@"12345_.sql")).to.beFalsy();
    expect(FMDBIsMigrationAtPath(@"12345dfsf.sql")).to.beFalsy();
}

- (void)testMigrationsFromBundleWithAlternateFileNames
{
    NSBundle *parentBundle = [NSBundle bundleForClass:NSClassFromString(@"FMDBMigrationManagerTests")];
    NSBundle *alternateNamesBundle = [NSBundle bundleWithPath:[parentBundle pathForResource:@"AlternateNamedMigrations" ofType:@"bundle"]];
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabaseAtPath:FMDBRandomDatabasePath() migrationsBundle:alternateNamesBundle];
    expect([manager.migrations valueForKey:@"name"]).to.equal(@[ @"CamelCaseShouldWork", [NSNull null], @"This Is Another Name", @"My Object Migration" ]);
    expect([manager.migrations valueForKey:@"version"]).to.equal(@[ @2, @12345, @201406063548463, @201499000000000 ]);
}

- (void)testAddMigrationsWithInvalidObjectFails
{
    FMDatabase *database = [FMDatabase databaseWithPath:nil];
    [database open];
    FMDBMigrationManager *manager = [FMDBMigrationManager managerWithDatabase:database migrationsBundle:FMDBMigrationsTestBundle()];
    expect(^{
        [manager addMigrations:(id)[NSObject new]];
    }).to.raiseWithReason(NSInvalidArgumentException, @"Failed to add migrations because `migrations` argument is not an array.");

    NSArray *bogusMigrations = @[ @(1), @(2) ];
    expect(^{
        [manager addMigrations:bogusMigrations];
    }).to.raiseWithReason(NSInvalidArgumentException, @"Failed to add migrations because an object in `migrations` array doesn't conform to the `FMDBMigrating` protocol.");
}

@end
