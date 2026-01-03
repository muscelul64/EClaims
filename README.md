# Porsche E-Claims Mobile App 👋

Insurance claims mobile application for Porsche vehicles, built with Expo React Native and file-based routing.

## App Configuration

- **App Name**: Porsche E-Claims
- **Version**: 10.0.0
- **Slug**: porsche-eclaims
- **Bundle ID**: com.deactech.porscheeclaims
- **Deeplink Scheme**: porscheeclaims://
- **Universal Links**: https://eclaims.deactech.com/

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Build Commands

```bash
# Development builds
npx expo run:android
npx expo run:ios

# Production builds
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Project Structure

- `app/` - Main app code with file-based routing
- `components/` - Reusable UI components
- `stores/` - Zustand state management
- `utils/` - Utility functions and API clients
- `assets/` - Images and static assets

## Features

- **Vehicle Management**: Add and manage Porsche vehicles
- **Claims Processing**: Create and manage insurance claims
- **Photo Documentation**: Capture and categorize damage photos
- **Deeplink Support**: Single vehicle access via deeplinks
- **Internationalization**: Multi-language support (English/Romanian)

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
