require 'rubygems'
require 'bundler'
Bundler.setup
require 'xctasks/test_task'

XCTasks::TestTask.new(:test) do |t|
  t.workspace = 'FMDBMigrationManager.xcworkspace'
  t.schemes_dir = 'Tests/Schemes'
  t.runner = :xcpretty
  t.actions = %w{test}
  
  t.subtask(ios: 'iOS Tests') do |s|
    s.sdk = :iphonesimulator
  end
  
  t.subtask(osx: 'OS X Tests') do |s|
    s.sdk = :macosx
  end
end

desc "Release a new version of FMDBMigrationManager"
task :release do
  system("pod trunk push --allow-warnings FMDBMigrationManager.podspec")
end

task default: 'test'
