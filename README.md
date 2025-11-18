# Laya Mobile - Voice-First Task Manager

A voice-first mobile app built with React Native and Expo.

## 🚀 Quick Start

### 1. Install Expo Go on Your iPhone

1. Open App Store
2. Search "Expo Go"
3. Install (it's FREE)

### 2. Start the App

```bash
cd laya-mobile
npx expo start
```

### 3. Connect Your Phone

- Open Expo Go app on your iPhone
- Tap "Scan QR Code"
- Point at the QR code in your terminal
- Your app will load!

## 📱 Features (Day 1)

- ✅ Voice recording with on-device transcription
- ✅ Beautiful voice-first UI
- ✅ Real-time feedback
- ✅ Haptic feedback
- ✅ Error handling

## 🔧 Setup

### Add Supabase Credentials

Edit `lib/supabase.ts` and add your credentials:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_KEY';
```

Or create a `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=your_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

## 📦 Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development tooling
- **@react-native-voice/voice** - On-device speech recognition
- **Supabase** - Backend & database
- **TypeScript** - Type safety

## 🎯 Roadmap

### Day 1 (Today) ✅
- [x] Voice recording works
- [x] UI shows transcript
- [x] Permissions handled

### Day 2 (Tomorrow)
- [ ] Connect to /parseDump API
- [ ] Create tasks from voice
- [ ] Show success feedback

### Day 3
- [ ] Task list screen
- [ ] Supabase auth
- [ ] Navigation

## 🧪 Testing

```bash
# Start dev server
npx expo start

# Test on iPhone (recommended)
# Scan QR with Expo Go app

# Test on Android emulator
npx expo start --android

# Test on iOS simulator (Mac only)
npx expo start --ios
```

## 📝 Notes

- Voice recognition works on real devices only (not simulators)
- Microphone permissions will be requested on first use
- Works on both iOS and Android

## 🎤 Voice Commands

Try speaking:
- "Pick up groceries"
- "Call mom at 3pm tomorrow"
- "Finish presentation by Friday"

The app will transcribe your speech in real-time!

## 🔗 Related

- Web app: `/Users/priyankavijayakumar/laya`
- Shared backend: Supabase (same database!)

---

Built with ❤️ for voice-first productivity


