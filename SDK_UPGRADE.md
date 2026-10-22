# Expo SDK 57 upgrade

The app targets Expo SDK 57, React Native 0.86.3, and React 19.2.3.
NativeWind stays on v4 with Tailwind CSS 3 to retain the existing styling.
Screens, theme values, translations, icons, API endpoints, and stored-data keys
are unchanged.

## Development

Use Node 24.13.0 (see `.nvmrc`), then run:

```sh
npm ci
npx expo start --clear
```

On Windows with nvm-windows, run `nvm use 24.13.0` first. Use `npm.cmd` or
`npx.cmd` if PowerShell blocks the `.ps1` command wrappers.

SDK 54 development clients and installed native builds must be rebuilt for SDK
57. The native `android` and `ios` folders are generated and ignored by Git.
Use `npx expo run:android` or your existing native build workflow. iOS builds
require macOS with Xcode 26.4 or newer; SDK 57 supports iOS 16.4 and newer.

Push notifications require a native build; Expo Go cannot validate FCM delivery.
The existing Firebase configuration and Android package ID are retained.

## Before releasing

Run the dependency and build checks:

```sh
npx expo install --check
npx expo-doctor
npx tsc --noEmit
npm run lint
npx expo export --platform all
```

Then install the new build over an existing SDK 54 installation with the same
application ID and signing key, without clearing its data. Verify:

- Sign-in, saved accounts, PIN setup, PIN unlock, background locking, and logout.
- Home, history, leaf details, cash requests, supply requests, and navigation/back.
- Light/dark appearance, languages, font sizes, keyboard layout, and safe areas.
- Profile photo selection/cropping, upload, and cached photos after restart.
- Date pickers and PDF generation, saving, and sharing.
- Push registration, foreground notifications, and notification-tap navigation.

Compare these screens with the SDK 54 build on the same device, including both
themes. Bundling and static checks alone cannot prove native behavior or visual
parity. The archived `app-example` directory is excluded from TypeScript checks;
the active routes are in `src/app`.

## Validation performed

- Expo dependency version check: passed.
- Expo Doctor: all 21 checks passed.
- TypeScript: passed after updating shared appearance and symbol-name helpers.
- ESLint: 0 errors, 30 warnings, including existing findings newly reported by
  the SDK 57 preset.
- Prebuild configuration evaluation: passed; app identity, URL scheme, and
  existing config plugins are retained.
- Production export: Android and iOS Hermes bundles, web bundle, and all 35 web
  static routes generated successfully.
- No device was connected, so native build installation, visual comparison, FCM,
  image picker, PDF sharing, and preservation of existing on-device data still
  require the device checks above.

The SDK 57 ESLint preset adds compiler rules that flag pre-existing
`Animated.Value` refs, hydration, and modal/form state resets. These two rules
remain enabled as warnings only in the affected files, preserving behavior
while keeping the findings visible. Other lint rules retain their defaults.

## Text rendering compatibility

Android 15+ can draw TextView lines using glyph bounds while React Native
measures their advances. The mismatch can move the final character or word to
an unmeasured line. See the [upstream analysis and fix](https://github.com/react/react-native/pull/58280).

Application text uses `src/components/Text.jsx`. In Android 15+ Expo Go only,
letter-containing string labels receive an invisible trailing space to reserve
advance width. Stored values and translation files remain unchanged, and the
workaround leaves numeric values, emoji-only icons, other platforms, and native
app builds untouched. Explicit styles and intentional truncation retain their
precedence. Text also retains the explicit visible-overflow compatibility style.

Login titles, header titles, sidebar labels, and home card labels use their
available container width rather than relying only on intrinsic text width.
The home route badge wraps long names and displays the full route value instead
of discarding everything after ` - `. Original font sizes, weights, colors, and
translation strings are retained.

Native Android builds use `plugins/withAndroidTextMetrics.js` to set
`android:useBoundsForWidth=false` on a TextView style inherited from the existing
app theme. This aligns drawing with React Native's measurement. Expo config
introspection verifies the generated theme; existing native apps must be rebuilt
to include it. This plugin cannot modify the installed Expo Go binary.

The native CSS runtime was checked with a mocked native Text host for both
languages/themes, font styles, truncation, and the Expo Go-only workaround.
TypeScript and lint pass (existing lint warnings remain). The plugin's theme
transformation and generated Expo configuration pass checks. Prior exports pass
on Android/iOS/web; the final native theme still requires a fresh Android build.

On October 21, 2026, the user reloaded Expo Go and confirmed that the complete
text now displays, including the affected titles, Logout label, and route name.
This confirms the reported text issue on that device; it does not constitute
pixel-by-pixel verification of every screen or of the native APK theme override.

The remaining Home route badge and Notifications & News heading were then
given explicit available widths: the route badge occupies a full row and wraps,
and the heading fills the space beside View All. Both use simple line breaking.
The user reloaded Expo Go and confirmed both strings display in full. Targeted
lint and text-runtime checks pass; original font sizes and colors are retained.

After pulling these changes, stop Metro and restart with `npx expo start --clear`
to discard old transformed component/style caches, then reopen the app.

## References

- [SDK 57 release notes](https://expo.dev/changelog/sdk-57)
- [Router import migration](https://docs.expo.dev/router/migrate/sdk-55-to-56/)
- [NativeWind v4 compatibility releases](https://github.com/nativewind/nativewind/releases)
