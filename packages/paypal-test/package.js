Package.describe({
  name: 'test:paypal',
  version: '0.0.1',
  summary: 'Test package including the PayPal SDK',
});

Package.onUse(function(api) {
  api.versionsFrom('1.2');
});

Cordova.depends({
  'com.paypal.cordova.mobilesdk': '3.3.1'
});
