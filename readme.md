# hybrid

An experimental app that implements Service Worker APIs in a
native iOS app.

This needs a lot more documentation, but for now, to run:

## Requirements

- XCode >= 8
- Node >= 6
- Cocoapods

## Installation

Clone the repo. Then run:

    cd hybrid
    pod install
    cd js-src
    npm install --production

Once you've done that you should be able to open
`hybrid.xcworkspace` and build the project successfully.