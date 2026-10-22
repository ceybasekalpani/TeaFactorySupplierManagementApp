// ── API Configuration ──────────────────────────────────────────────────────────
// Replace with your backend URL:
//  • Android emulator  → http://10.0.2.2:5000
//  • iOS simulator     → http://localhost:5000
//  • Physical device   → http://<YOUR_MACHINE_IP>:5000  (e.g. http://192.168.1.10:5000)
//  • Production        → https://api.yourapp.com

// Local web development. Override with EXPO_PUBLIC_API_BASE_URL when needed.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || "http://localhost:5295";
