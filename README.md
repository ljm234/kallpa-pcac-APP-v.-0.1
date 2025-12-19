## Install instructions

- Install create-expo-app: `npx create-expo-app@latest --template blank ./`
- To use the iOS simulator, run: `npm run ios`
- To run using the Expo Go app, run: `npx expo start --tunnel`

## Quality gates & verification

- **Lint**: `npm run lint` now runs ESLint with `@react-native/eslint-config` across JS/TS files. Fix any reported issues before committing.
- **Tests**: `npm run test` executes Jest with the Expo preset and React Native Testing Library harness (see `jest.config.js` / `jest.setup.js`). Snapshot and interaction tests belong here.
- **Doctor**: `npm run doctor` still invokes Expo Doctor for native dependency health checks; run when touching native modules or upgrading Expo SDKs.
- Keep this section up to date whenever additional quality tooling (e.g., type-checking, end-to-end tests) is introduced.

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
Buttons include `accessibilityLabel` text.
Logging output is minimized and can be routed to a debug logger if required.

### Performance
- FlatList optimization using `getItemLayout`.
- Smaller data payload by limiting selected columns in Supabase query.

### Suggested Commit Messages
1. `feat(trending): responsive metrics + skeleton loading`
2. `feat(video): fullscreen + mute + progress bar overlays`
3. `perf(fetch): optimize getLatestPosts select columns`
4. `docs: add premium trending architecture section`

## Manual case capture prerequisites

The Kallpa manual encounter workflow (Live Visit → Case Studio) depends on the Supabase backend you created earlier. Double-check these pieces before demoing uploads or saving new cases:

1. **Tables**
  - `kallpa_sessions`: stores raw recording metadata. Suggested columns: `id uuid default uuid_generate_v4() primary key`, `scenario_id text`, `language text`, `duration_ms integer`, `events jsonb`, `metadata jsonb`, `created_at timestamptz default now()`.
  - `kallpa_cases`: stores manual encounter summaries. Suggested columns: `id uuid default uuid_generate_v4() primary key`, `title text`, `notes text`, `scenario_id text`, `language text`, `session_id uuid references kallpa_sessions(id)`, `clinic_type text`, `attachments jsonb`, `metadata jsonb`, `created_at timestamptz default now()`.
  - Enable RLS and add `select/insert` policies for authenticated users (demo builds can broaden these policies if needed).
2. **Storage**
  - Bucket: `kallpa-assets` with public read + authenticated upload policies (see Supabase dashboard → Storage).
  - Attachments are tagged with MIME metadata so UI chips can show their type badge; keep `contentType` accurate when uploading via dashboard scripts.
3. **Device permissions**
  - `expo-document-picker` will prompt for Files/Photos access. Users must grant access to attach evidence or previews will fail.
  - iOS simulators sometimes cache the permission dialog; if uploads silently fail, reset simulator privacy settings.

Once Jest/ESLint land, update this doc again so the workflow + quality gate sections point at the new scripts.
### Next Ideas (Optional Enhancements)
- Global playback manager to ensure only one video plays across all lists.
- Thumbnail prefetch & blurred preview while buffering.
- Analytics events for play, pause, skip, fullscreen, completion.
- Unit tests for autoplay gating and progress calculations.

## Video Upload Feature

This project includes a production-grade video upload system allowing users to create and publish video content with thumbnails and metadata.

### Features Implemented
- **File Selection**: Video and image picker using `expo-document-picker`
- **Dual Upload**: Separate uploads for video files and thumbnail images
- **Metadata Capture**: Video title and description fields
- **Form Validation**: Comprehensive validation ensuring all required fields are filled
- **Loading States**: Visual feedback during upload process
- **Error Handling**: User-friendly error messages for failed uploads
- **Auto-Redirect**: Automatic navigation to home page after successful upload
- **Preview**: Real-time preview of selected video and thumbnail before upload

### Setup Requirements

Before using the video upload feature, you must configure Supabase Storage:

#### 1. Create Storage Buckets

Go to your Supabase Dashboard → Storage → Create Bucket and create:

1. **Bucket name**: `videos`
   - **Public**:YES (make public)
   - **File size limit**: 50MB recommended
   - **Allowed MIME types**: `video/mp4`, `video/quicktime`, `video/gif`

2. **Bucket name**: `images`
   - **Public**: YES (make public)
   - **File size limit**: 5MB recommended
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/jpg`

#### 2. Set Bucket Policies

For both buckets, configure these RLS (Row Level Security) policies:

**INSERT Policy** (Allow authenticated users to upload):
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('videos', 'images'));
```

**SELECT Policy** (Allow public read access):
```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('videos', 'images'));
```

#### 3. Verify Videos Table Schema

Ensure your `videos` table has these columns:
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail TEXT,
  description TEXT,
  creator UUID REFERENCES auth.users(id),
  author TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Usage

1. **Navigate to Create Tab**: Tap the ➕ icon in the bottom tab bar
2. **Fill in Details**:
   - Enter a catchy video title
   - Tap "Choose a video to upload" and select your video file
   - Tap "Choose a thumbnail" and select a thumbnail image
   - Enter a short description for the video
3. **Submit**: Tap "Submit & Publish" to upload
4. **Success**: After upload, you'll be redirected to Home where your video appears

### Code Architecture

#### Upload Functions (`lib/appwrite.js`)

**`uploadFile(file, type)`**
- Uploads video or image files to Supabase Storage
- Generates unique filenames with timestamps
- Returns public URL of uploaded file
- Handles both web and native file URIs

**`createVideo(videoData)`**
- Creates video record in database
- Associates video with authenticated user
- Auto-populates author name from user metadata
- Returns formatted video object

#### Create Screen (`app/(tabs)/create.jsx`)

**State Management**
```javascript
const [form, setForm] = useState({
  title: "",      // Video title
  video: null,    // Selected video file
  thumbnail: null, // Selected thumbnail image
  description: "", // Optional description
});
```

**Key Functions**
- `openPicker(selectType)`: Opens document picker for video/image selection
- `submit()`: Validates form, uploads files, creates video record, redirects to home

**UI Components**
- FormField for text inputs (title, description)
- TouchableOpacity for file upload areas
- Video component for video preview
- Image component for thumbnail preview
- CustomButton for submit action
- ActivityIndicator for loading state

### Error Handling

The upload system handles these error scenarios:

1. **Missing Fields**: Alert prompts user to fill all required fields
2. **Not Authenticated**: Alert informs user to log in
3. **Upload Failure**: Detailed error message from Supabase
4. **Network Issues**: Timeout and connection error handling
5. **Invalid Files**: MIME type validation in document picker

### Testing Checklist

- [ ] Video file selection works
- [ ] Thumbnail image selection works
- [ ] Video preview displays correctly
- [ ] Thumbnail preview displays correctly
- [ ] Form validation shows errors for empty fields
- [ ] Upload shows loading indicator
- [ ] Success alert appears after upload
- [ ] Form resets after successful upload
- [ ] Redirect to home page works
- [ ] Uploaded video appears on home page
- [ ] Video plays correctly with thumbnail

### Performance Optimizations

- **Unique Filenames**: Timestamp + random string prevents collisions
- **Blob Upload**: Efficient binary transfer for large files
- **Cache Control**: 1-hour cache for uploaded files
- **Compressed Previews**: Native components handle efficient rendering
- **Form Reset**: Clears memory after upload completion

### Platform Support

- **iOS**: Full support with native video preview
- **Android**: Full support with native video preview
- **Web**: Full support with HTML5 video player
- **Cross-Platform Styling**: Responsive layout adapts to screen size

### Suggested Commit Message
```
feat(upload): production-grade video upload with dual file support

- Add uploadFile() and createVideo() functions to appwrite.js
- Implement Create screen with video/thumbnail pickers
- Add form validation for title, video, thumbnail, description
- Include loading states and error handling
- Auto-redirect to home after successful upload
- Update FormField to support multiline and dark theme
- Add comprehensive documentation and setup instructions
```
