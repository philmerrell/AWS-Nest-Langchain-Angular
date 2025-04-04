// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  chatApiUrl: 'http://localhost:3000',
  // chatApiUrl: 'https://zaooninfdnpfgcxssv2r3pxyki0puorc.lambda-url.us-east-1.on.aws',
  loginUrl: 'https://login.microsoftonline.com/e995cfd7-fbff-4ccc-9829-b745f208c2b0/oauth2/v2.0/authorize?client_id=e388e26f-b9bf-45da-beb4-b6caa48c4cdd&redirect_uri=http://localhost:8100/auth/callback&response_type=code&scope=openid profile email api://e388e26f-b9bf-45da-beb4-b6caa48c4cdd/Read offline_access',
  logoutUrl: 'https://login.microsoftonline.com/e995cfd7-fbff-4ccc-9829-b745f208c2b0/oauth2/v2.0/logout'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
