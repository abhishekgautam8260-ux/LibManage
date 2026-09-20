# SeatManager — React Native (Expo) App

A full React Native conversion of your HTML/CSS/JS Library Seat Manager web app.
No static/hardcoded data — every screen pulls from your backend API.

## 1. Setup

```bash
cd seatmanager-app
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `a`/`i` to launch an emulator.

## 2. ⚠️ First thing to fix: your API URL

Open `src/api/config.js`. Your backend runs on `http://localhost:8080`, but
in React Native, "localhost" means the phone/emulator itself — it will NOT
reach your laptop. Set `BASE_URL` to:

- Android emulator → `http://10.0.2.2:8080`
- iOS simulator → `http://localhost:8080` (works as-is)
- Physical phone → `http://<your-computer's-LAN-IP>:8080` (same Wi-Fi)
- Deployed backend (e.g. Railway) → your `https://...` URL

## 3. Screen ↔ original file mapping

| Original HTML/JS | React Native screen |
|---|---|
| newindex.html | `screens/LandingScreen.js` |
| newsignup.html + signup.js | `screens/SignupScreen.js` |
| newlogin.html + login.js | `screens/LoginScreen.js` |
| createlibrary.html + create-library.js | `screens/CreateLibraryScreen.js` |
| dashboard.html + new-dashboard.js | `screens/DashboardScreen.js` |
| students.html | `screens/StudentsScreen.js` ⚠️ see below |
| halfday-student.html + halfday.js | `screens/HalfDayStudentsScreen.js` |
| billing.html + billing.js | `screens/BillingScreen.js` |
| profile.html + profile.js | `screens/ProfileScreen.js` |
| newheader.html + newheader.js | `components/Header.js` |
| localStorage (TOKEN/LIBRARY_ID/LIBRARY_NAME) | `context/AuthContext.js` (AsyncStorage) |

`otp.html`/`otp.js` and the legacy `index.html`/`login.html`/`header.html`/
`new-index.html` variants weren't wired in — they looked like earlier
drafts superseded by the `new*` versions your app currently links to
(`newindex.html` → `newsignup.html`/`newlogin.html`). Say the word if OTP
verification is actually still part of your live signup flow and I'll add
a screen for it.

## 4. ⚠️ Needs your input: `students.js`

Your upload included `students.html` and `students.css`, but the actual
`students.js` file's content wasn't in the message (only its filename).
I built `screens/StudentsScreen.js` from the HTML structure alone, and
**inferred** these endpoints in `src/api/students.js`:

- `GET /api/student/library/{libraryId}` — list students
- `GET /api/student/{id}/seat-history` — seat change timeline
- `PUT /api/student/{id}` — edit (reuses the same shape as dashboard's update)
- `POST /api/student/create/library/{libraryId}` — add student
- Excel import/export endpoints (also guessed, and left partially stubbed
  since RN needs `expo-file-system`/`expo-document-picker` for real file I/O)

**Send me the real `students.js`** and I'll correct any endpoint, field
name, or response shape that doesn't match — right now these are educated
guesses based on patterns from your other files (e.g. `halfday.js` uses
`/api/student/halfday/library/{id}`).

Similarly, `dashboard.js` (referenced by `dashboard.html`) wasn't included —
I used `new-dashboard.js` instead, since its element IDs (`totalSeats`,
`seatContainer`, `bookingModal`, etc.) match `dashboard.html` exactly, so
it's almost certainly the real logic just under a different filename.

## 5. Design notes

- Colors/spacing/radius pulled directly from your CSS files into
  `src/theme/colors.js` so the visual language matches.
- RN has no CSS gradients without an extra library — `PrimaryButton` uses
  the gradient's start color as a solid fill. Add `expo-linear-gradient`
  if you want the exact two-tone `#4facfe → #00f2fe` gradient.
- The web app's separate "desktop nav" vs "mobile footer nav" collapses
  into a single bottom tab bar (`MainTabs.js`), since RN apps are
  inherently mobile-first.
- Modals use bottom sheets (`animationType="slide"`, anchored to the
  bottom) to match the mobile CSS breakpoints in your `.modal`/`.modal-content`
  rules, which switch to `align-items: flex-end` below 600px.
- FontAwesome icons (`fa-solid fa-*`) map to `@expo/vector-icons`'s
  `FontAwesome6` component with the same icon names minus the `fa-` prefix.

## 6. Not yet wired (need your confirmation)

- **Excel import/export** on the Students screen — needs a decision on
  whether your backend returns a file directly or a signed URL, plus
  `expo-file-system` + `expo-document-picker` for picking/saving files
  on-device.
- **`vacate(id)` for half-day students** — referenced in `halfday.js`'s
  table row but never defined in the file you shared. I assumed
  `DELETE /api/student/halfday/{id}`; confirm or correct.
- **Forgot Password** — present in `newlogin.html`/`login.html` as a
  non-functional `<p>` (no click handler in the JS), so it's left as
  inert text in `LoginScreen.js` too.
