# About

This Meteor 1.2 app is used to illustrate issue <https://github.com/meteor/meteor/issues/7029>

# Usage

```
meteor run android-device
^C to stop the app
meteor run android-device
```

The app shows that the problem occurs in different Cordova plugins. There are two test cases that can be enabled or disabled in the `.meteor/packages` file.

## PayPal SDK sample

This sample is enabled by default.

Here, a local package is included that references the PayPal Mobile SDK. This SDK defines a dependency on `card.io.cordova.mobilesdk`.

On the first run, both Cordova plugins are being downloaded, and everything is working as expected. On the second run, however, Meteor purges all Cordova plugins for an unknown reason and tries to re-download them. _Sometimes_ (but not always) it happens that the dependency plugin `card.io.cordova.mobilesdk` remains on disk, which causes the build to fail due to an existing file:

```
=> Errors executing Cordova commands:                                              

   While adding plugin com.paypal.cordova.mobilesdk@3.3.1 to Cordova project:      
   Error: Uh oh!                                                                   
   "/Users/waldgeist/Documents/Development/htdocs/tests/meteor-cordova-dependency/.meteor/local/cordova-build/platforms/android/src/io/card/cordova/sdk/CardIOCordovaPlugin.java"
   already exists!
```

Per default, the community package `percolate:safe-reload` is used. This package defines a dependency on `cordova-plugin-file`

**IMPORTANT** This does not happen all the time. But when it happens, the developer has to kill -9 the Meteor process and do a `meteor reset` to be able to restart the app.

## percolate:safe-reload sample

This sample can be enabled using the `.meteor/packages` file.

Opposed to the other test case, the problem occurs "reliably", on every 2nd run of `meteor run android-device`. The build process breaks with this error message:

```
Cordova error: Cannot find plugin.xml for plugin 'cordova-plugin-compat'. Please try adding it again.
```

This one is hard to track down, because it is not obvious what is happening here. It took me a whole working day to find out where this ominous `cordova-plugin-compat` plugin is actually coming from. Here's the explanation:

- `percolate:safe-reload` defines a dependency on `cordova-plugin-file`. But the package author forgot to state an explicit version for the dependency.
- If `percolate:safe-reload` happens to be loaded before any other reference to `cordova-plugin-file` can be found, it downloads version 4.3.1 of `cordova-plugin-file`. This version has a dependency on 'cordova-plugin-compat'. So this plugin is downloaded as well.
- As part of the ongoing build process, Meteor (or Cordova) has a hard-coded dependency on `cordova-plugin-file-transfer`. This plugin defines an explicit dependency on `cordova-plugin-file` for version >=2.0.0\. This causes Meteor to download the `cordova-plugin-file` plugin once again and overwrites its 4.3.1 version with a 2.1.0 version (this version can be found on disk after the build process).
- Version 2.1.0 does not contain a dependency on `cordova-plugin-compat`. But the files `android.json` and `ios.json` still list it as a dependency, causing the build to break.
