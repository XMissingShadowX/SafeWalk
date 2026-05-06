# SafeWalk — Personal Safety App

> Emergency SOS • Community Incident Map • Safe Routes • AI Paramedic

---

## Features

| Feature | Description |
|---|---|
| 🆘 SOS Hold-to-Activate | Hold 2 seconds → calls 3 contacts, sends GPS SMS, records 10s video |
| 🗺️ Community Incident Map | Real-time Leaflet map with color-coded zones (red=assault, amber=suspicious) |
| 🛣️ Safe Route Suggestions | 1-3 alternative routes avoiding danger zones with safety scores |
| 🤖 AI Paramedic Chat | Claude-powered first aid assistant with offline fallback instructions |
| 👤 Auth & Contact Management | Supabase auth, up to 3 emergency contacts |

---

## Stack

- **Frontend**: Next.js 15 (App Router, static export) + Tailwind CSS v4 + shadcn/ui
- **State**: Zustand (persisted)
- **Map**: Leaflet + react-leaflet (OpenStreetMap / CartoDB Dark)
- **Backend**: Supabase (auth + postgres + realtime)
- **AI**: Anthropic Claude (claude-haiku-4-5)
- **Mobile**: Capacitor v6

---

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-key
```

---

## Supabase Schema

Run this SQL in your Supabase project:

```sql
-- Emergency contacts
create table emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  relationship text,
  priority int default 1,
  created_at timestamptz default now()
);
alter table emergency_contacts enable row level security;
create policy "Users manage own contacts" on emergency_contacts
  for all using (auth.uid() = user_id);

-- SOS alerts
create table sos_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  latitude float8 not null,
  longitude float8 not null,
  status text default 'active',
  contacts_notified text[],
  created_at timestamptz default now(),
  resolved_at timestamptz
);
alter table sos_alerts enable row level security;
create policy "Users manage own alerts" on sos_alerts
  for all using (auth.uid() = user_id);

-- Community incidents
create table incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  incident_type text not null,
  severity text not null,
  latitude float8 not null,
  longitude float8 not null,
  is_active boolean default true,
  reported_at timestamptz default now(),
  resolved_at timestamptz
);
alter table incidents enable row level security;
create policy "Anyone can read active incidents" on incidents
  for select using (is_active = true);
create policy "Auth users can insert" on incidents
  for insert with check (auth.uid() is not null);
create policy "Users can update own" on incidents
  for update using (auth.uid() = user_id);
```

---

## Build & Deploy (Web)

```bash
npm install
npm run build
# Static files output to /out directory
```

---

## Build APK (Android)

### Prerequisites
- Node.js 18+
- Java JDK 17+
- Android Studio (with SDK 34+)
- Gradle

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/geolocation @capacitor/haptics @capacitor/splash-screen

# 3. Build the Next.js static export
npm run build
# This creates the /out directory

# 4. Add Android platform
npx cap add android

# 5. Sync web assets to Android
npx cap sync android

# 6. Open in Android Studio
npx cap open android

# 7. In Android Studio: Build > Build Bundle(s)/APK(s) > Build APK(s)
#    APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

### One-liner (after Android Studio setup)
```bash
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Android Permissions (auto-added by Capacitor)

The following are added to `AndroidManifest.xml` automatically:
- `ACCESS_FINE_LOCATION` — GPS tracking
- `ACCESS_COARSE_LOCATION` — Network location
- `CAMERA` — 10-second video recording on SOS
- `VIBRATE` — Haptic feedback on SOS
- `RECEIVE_BOOT_COMPLETED` — Background services

---

## Project Structure

```
safewalk/
├── app/
│   ├── page.tsx              # Home (client-side auth check)
│   ├── globals.css           # Dark theme CSS variables
│   ├── layout.tsx            # Root layout + PWA meta
│   └── auth/
│       ├── login/page.tsx
│       ├── sign-up/page.tsx
│       └── callback/page.tsx
├── components/
│   ├── app-shell.tsx         # Main shell with header + navigation
│   ├── sos-button.tsx        # Hold-to-activate SOS button
│   ├── bottom-navigation.tsx
│   ├── incident-map.tsx      # Leaflet map component
│   └── tabs/
│       ├── home-tab.tsx      # Status + contacts management
│       ├── map-tab.tsx       # Community incident map
│       ├── routes-tab.tsx    # Safe route planner
│       └── medic-tab.tsx     # AI Paramedic chat
├── lib/
│   ├── store.ts              # Zustand global state
│   ├── types.ts              # TypeScript types
│   ├── utils.ts              # cn() helper
│   └── supabase/
│       ├── client.ts         # Browser Supabase client
│       └── server.ts         # Server Supabase client
├── hooks/
│   └── use-geolocation.ts    # GPS hook with watch mode
├── capacitor.config.ts       # Capacitor APK config
└── next.config.ts            # Static export config
```
