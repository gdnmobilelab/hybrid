# Uncomment this line to define a global platform for your project
platform :ios, '9.0'
# Uncomment this line if you're using Swift
use_frameworks!

def global_pods
    pod 'GCDWebServer', '~> 3.0'
    pod 'XCGLogger'
    pod 'FMDB'
    pod 'FMDBMigrationManager'
    pod 'Alamofire'
    pod 'PromiseKit', '~> 3.2.1'
    pod 'ObjectMapper', '~> 1.3'
    pod 'JSCoreBom', :git => 'https://github.com/artemyarulin/JSCoreBom.git'
    pod 'EmitterKit'
end

target 'hybrid' do
    global_pods
end

target 'hybridTests' do
    global_pods
    pod 'Quick'
    pod 'Nimble'
end

target 'hybridUITests' do
    
end
