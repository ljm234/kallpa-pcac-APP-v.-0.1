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

## Trending & Premium Video Features

This project includes an enhanced Trending Videos implementation designed to meet advanced UX and performance standards:

### Fetching
- `getLatestPosts(limit)` selects only required columns for efficiency.
- Graceful fallback to `getAllPosts` ensures the UI always has content.

### Responsive Layout
- Card width scales with orientation and screen size (portrait ~70% width, landscape/tablet clamp).
- Consistent 16:9 aspect ratio for video areas.

### Loading Experience
- Shimmer skeleton placeholders (`VideoSkeleton`) while data loads.

### Playback UX
- Interaction-gated autoplay avoids browser autoplay policy conflicts.
- Inline progress bar with smooth updates.
- Mute / Unmute toggle works across web/native.
- Fullscreen button (HTML5 `requestFullscreen` on web; `presentFullscreenPlayer` when supported on native).
- Double-tap zone skipping (left/right) with chain behavior for fast scrubbing.

### Animation
- Active card uses a subtle scale loop with easing (replaces aggressive pulse) for a premium feel.

### Accessibility & Polish
- Buttons include `accessibilityLabel` text.
- Reduced logging noise; easy to route to a debug logger if desired.

### Performance
- FlatList optimization using `getItemLayout`.
- Smaller data payload by limiting selected columns in Supabase query.

### Suggested Commit Messages
1. `feat(trending): responsive metrics + skeleton loading`
2. `feat(video): fullscreen + mute + progress bar overlays`
3. `perf(fetch): optimize getLatestPosts select columns`
4. `docs: add premium trending architecture section`

### Next Ideas (Optional Enhancements)
- Global playback manager to ensure only one video plays across all lists.
- Thumbnail prefetch & blurred preview while buffering.
- Analytics events for play, pause, skip, fullscreen, completion.
- Unit tests for autoplay gating and progress calculations.

