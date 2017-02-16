# Uncomment this line to define a global platform for your project
platform :ios, '10.0'
# Uncomment this line if you're using Swift
use_frameworks!

def global_pods
    pod 'XCGLogger', '~> 4.0.0'
    pod 'FMDB'
    pod 'FMDBMigrationManager'
    pod 'PromiseKit', '~> 4'
end

def test_pods
    pod 'Quick', '~> 1.0.0'
    pod 'Nimble', '~> 6.0.0'
end

target 'HybridUI' do
    global_pods
end

target 'HybridServiceWorker' do
    global_pods
end

target 'HybridWorkerManager' do
    global_pods
end

target 'HybridShared' do
    global_pods
end

target 'MobileLab' do
    global_pods
end

target 'JSTests' do
    global_pods
end

target 'HybridTests' do
    global_pods
    test_pods
end


target 'HybridServiceWorkerTests' do
    global_pods
    test_pods
end

target 'hybrid' do
    global_pods
    pod 'GCDWebServer', '~> 3.0'
end

target 'hybrid-notification-content' do
    global_pods
end

target 'notification-extension' do
    global_pods
end
