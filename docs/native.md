# Native Delivery

The mobile and desktop applications consume the same native SPA bundle produced by `apps/web`.

## Shared bundle

```bash
export VITE_API_URL=https://api.example.com
bun run build:native
```

Native clients cannot use the browser same-origin proxy. `VITE_API_URL` must be an externally reachable HTTPS API endpoint for production builds.

## Capacitor

Initial setup:

```bash
cd apps/mobile
bunx cap add android
bunx cap add ios
bunx cap sync
```

Commit generated native directories after product-specific customization begins so permissions, entitlements, signing, icons, splash screens, and store metadata remain reviewable.

## Tauri

```bash
bun run --cwd apps/desktop dev
bun run build:desktop
```

Keep Rust commands minimal. Add them only for capabilities that the web platform cannot provide safely or cleanly.

## Authentication

`@matrix/auth/native` requires a `SecureTokenStore`. Implement it with the operating system secure storage:

- iOS Keychain
- Android Keystore-backed storage
- macOS Keychain
- Windows Credential Manager or equivalent protected storage
- Linux Secret Service when available

Do not store production bearer tokens in plain local storage.

## Release workflow

`.github/workflows/release-native.yml` validates Tauri on Linux, Windows, and macOS, builds an Android artifact, and creates an unsigned iOS simulator build.

Production distribution additionally requires protected signing material, provisioning, notarization, store metadata, and platform review.

## Platform-specific code

Keep native code behind narrow adapters. Shared domain, validation, API clients, UI, and product logic should remain TypeScript whenever the platform requirement allows it.
