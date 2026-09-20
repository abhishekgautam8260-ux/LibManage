// ⚠️ IMPORTANT — React Native networking note:
// Your original web app used "http://localhost:8080" because the browser
// and the backend run on the same machine. In React Native, "localhost"
// refers to the PHONE/EMULATOR itself, NOT your dev machine — so it will
// NOT reach your Spring Boot backend running on your laptop.
//
// Use one of these instead:
//   - Android Emulator:      http://10.0.2.2:8080
//   - iOS Simulator:         http://localhost:8080 (works, simulator shares host network)
//   - Physical device (same Wi-Fi as your backend): http://<YOUR_LAN_IP>:8080
//   - Deployed backend (e.g. Railway):              your https:// URL
//
// Change BASE_URL below to match your setup.
// export const BASE_URL = "http://192.168.1.53:8080";
export const BASE_URL = "http://192.168.31.27:8080";
// export const BASE_URL = "http://10.0.2.2:8080";
