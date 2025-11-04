## Install instructions

- Install create-expo-app: `npx create-expo-app@latest --template blank ./`
- To use the iOS simulator, run: `npm run ios`
- To run using the Expo Go app, run: `npx expo start --tunnel`

## Documentation and Guides

- Useful explaination of how building apps using Expo, including key concepts can be found here: [https://docs.expo.dev/workflow/overview/](https://docs.expo.dev/workflow/overview/).
- Good overview of how making changes affects your app and what warrants creating a new build vs viewing live updates: [https://docs.expo.dev/workflow/overview/#the-core-development-loop](https://docs.expo.dev/workflow/overview/#the-core-development-loop)
- Documentation for Expo Router: [https://docs.expo.dev/router/installation/](https://docs.expo.dev/router/installation/)

## Troubleshooting

### How to delete package-lock and node_modules

```bash
rm -rf package-lock.json node_modules
```


### Error: expo-splash-screen

**Error Message:**
```bash
Error: xcrun simctl openurl 74FF3266-DEF8-4876-8819-667622D9DE84 exp://bdoakao-curtjen-8081.exp.direct exited with non-zero code: 60
An error was encountered processing the command (domain=NSPOSIXErrorDomain, code=60):
Simulator device failed to open exp://bdoakao-curtjen-8081.exp.direct.
Operation timed out
Underlying error (domain=NSPOSIXErrorDomain, code=60):
        The operation couldn’t be completed. Operation timed out
        Operation timed out
iOS Bundling failed 12698ms node_modules/expo-router/entry.js (1070 modules)
Unable to resolve "expo-splash-screen" from "app/_layout.jsx"
```

**Solution:**

1. Check to see if `expo-splash-screen` is installed. If it isn't, run the command: `npx expo install expo-splash-screen`
2. This should install it successfully.
3. If this fails, look at the error output and address those issues. Deleting `package-lock.json` and `node_modules/` may be necessary.

### Error: Linking requires a build-time setting `scheme` in the project's Expo config

**Error Message:**
```bash
 WARN  Linking requires a build-time setting `scheme` in the project's Expo config (app.config.js or app.json) for production apps, if it's left blank, your app may crash. The scheme does not apply to development in the Expo client but you should add it as soon as you start working with Linking to avoid creating a broken build. Learn more: https://docs.expo.dev/guides/linking/
 ```

 **Solution:**
Make sure you don't spell "scheme" as "schema".

### Error: Route "./index.jsx" is missing

**Error Message:**
```bash
WARN  Route "./index.jsx" is missing the required default export. Ensure a React component is exported as default.
```

**Solution:**
Create a new file located at `app/index.jsx` with something like the following content:
```jsx
import { Text, View } from "react-native";

export default function Home() {
  return (
    <View>
      <Text>Welcome to the Home Page!</Text>
    </View>
  );
}
```
