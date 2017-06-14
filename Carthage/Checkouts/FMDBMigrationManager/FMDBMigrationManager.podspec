Pod::Spec.new do |s|
  s.name     = 'FMDBMigrationManager'
  s.version  = '1.4.1'
  s.license  = 'Apache2'
  s.summary  = 'A SQLite database schema migration system for FMDB'
  s.homepage = 'https://github.com/layerhq/FMDBMigrationManager'
  s.authors  = { 'Blake Watters' => 'blakewatters@gmail.com' }
  s.source   = { :git => 'https://github.com/layerhq/FMDBMigrationManager.git', :tag => "v#{s.version}" }  
  s.requires_arc = true
  s.ios.deployment_target = '7.0'
  s.osx.deployment_target = '10.8'
  s.default_subspec = 'System'
  
  # Use the standalone build of SQLite
  s.subspec 'Standalone' do |ss|
    ss.source_files = 'Code'
    ss.dependency 'FMDB/standalone', '>= 2.3'
  end
  
  # Use the system build of sqlite
  s.subspec 'System' do |ss|
    ss.source_files = 'Code'
    ss.dependency 'FMDB/standard', '>= 2.3'
  end    
end
