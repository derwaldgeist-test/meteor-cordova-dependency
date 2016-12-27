# About

This Meteor 1.2 app is used to illustrate issue <https://github.com/meteor/meteor/issues/7029>

# Usage

```
meteor run android-device
^C to stop the app
meteor run android-device
```

The app shows that the problem occurs in different Cordova plugins. There are two test cases that can be enabled or disabled in the `.meteor/packages` file.

## percolate:safe-reload sample

This sample is enabled by default.

The build process breaks with this error message:

```
Cordova error: Cannot find plugin.xml for plugin 'cordova-plugin-compat'. Please try adding it again.
```

This one is hard to track down, because it is not obvious what is happening here. It took a whole working day to find out where this ominous `cordova-plugin-compat` plugin is actually coming from. Here's the explanation:

- `percolate:safe-reload` defines a dependency on `cordova-plugin-file`. This downloads version 4.3.1 of `cordova-plugin-file`. This version has a dependency on 'cordova-plugin-compat'.
- As part of the ongoing build process, Meteor seems to pin down the version of this plugin to 2.1.0\. This version will be downloaded later and overwrites the 4.3.1 version (and can actually be found on disk after the build process).
- Version 2.1.0 does not contain a dependency on `cordova-plugin-compat`. But the files `android.json` and `ios.json` still list it as a dependency, causing the build to break.

At first sight, I thought this happens because the author of `percolate:safe-reload` forgot to state an explicit version for `cordova-plugin-file`. But this does not matter. Even in a fork that sets the version to >= 2.1.0 the problem occurs.

## PayPal SDK sample

This sample can be enabled using the `.meteor/packages` file.

In this clean-room app, this test case breaks the build only once in a while, at random times, depending on how quick the Cordova plugin folder is purged on startup. In my production app with a lot more Cordova plugin, however, this breaks every build. I assume this happens because the purge is done in a parallel thread and Meteor does not wait until the files are actually deleted before it tries to install the plugins again.

This test case involves a local package that references the PayPal Mobile SDK. This SDK defines a dependency on `card.io.cordova.mobilesdk`, for a certain version.

On the first run, both Cordova plugins are being downloaded, and everything is working as expected. On the second run, however, Meteor purges all Cordova plugins for an unknown reason and tries to re-download them. _Sometimes_ it happens that the dependency plugin `card.io.cordova.mobilesdk` remains on disk, which causes the build to fail due to an existing file:

```
=> Errors executing Cordova commands:                                              

   While adding plugin com.paypal.cordova.mobilesdk@3.3.1 to Cordova project:      
   Error: Uh oh!                                                                   
   "/Users/waldgeist/Documents/Development/htdocs/tests/meteor-cordova-dependency/.meteor/local/cordova-build/platforms/android/src/io/card/cordova/sdk/CardIOCordovaPlugin.java"
   already exists!
```

As being said, this does not happen all the time. But when it happens, the developer has to kill -9 the Meteor process and do a `meteor reset` to be able to restart the app.

It is also interesting that in this sample, the cordova-plugins folder is purged on every startup, even if the plugins haven't changed. I haven't found out so far why this is actually happening.

# Workaround

There is an ugly workaround to prevent these kind of errors. If you add the dependency plugins manually to `.meteor\cordova-plugins`, the build will run as expected. In our case, the following would do the trick:

```
card.io.cordova.mobilesdk@2.1.0
cordova-plugin-compat@1.0.0
```

The first plugin is the dependency of the PayPal SDK, the second one the dependency of `percolate:safe-reload`. This workaround also keeps Meteor from downloading all plugins on every server start in the PayPal SDK case.
