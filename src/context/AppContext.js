import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AppContext = createContext(null);

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_SUPPLIERS = [
  {
    id: "SUP001",
    name: "Kamal Perera",
    username: "kamal.perera",
    password: "1234",
    image: null,
    address: "123 Tea Garden Road, Kandy",
    phone: "0771234567",
    bankName: "Bank of Ceylon",
    accountNumber: "1234567890",
    accountHolder: "Kamal Perera",
    branch: "Kandy",
    registrations: [
      { regNo: "REG-2021-001", route: "Route A - Peradeniya" },
      { regNo: "REG-2022-015", route: "Route B - Katugastota" },
    ],
  },
  {
    id: "SUP002",
    name: "Saman Silva",
    username: "saman.silva",
    password: "1234",
    image: null,
    address: "45 Hill Street, Nuwara Eliya",
    phone: "0779876543",
    bankName: "Peoples Bank",
    accountNumber: "9876543210",
    accountHolder: "Saman Silva",
    branch: "Nuwara Eliya",
    registrations: [{ regNo: "REG-2020-007", route: "Route C - Ramboda" }],
  },
];

const MOCK_LEAF_DATA = {
  "SUP001-REG-2021-001": {
    "2025-12": [
      { day: 1, gross: 120, bags: 2, water: 10, netWeight: 110 },
      { day: 3, gross: 95, bags: 1, water: 8, netWeight: 87 },
      { day: 5, gross: 140, bags: 3, water: 12, netWeight: 128 },
      { day: 8, gross: 110, bags: 2, water: 9, netWeight: 101 },
      { day: 10, gross: 130, bags: 2, water: 11, netWeight: 119 },
      { day: 12, gross: 88, bags: 1, water: 7, netWeight: 81 },
      { day: 15, gross: 155, bags: 3, water: 14, netWeight: 141 },
      { day: 18, gross: 102, bags: 2, water: 8, netWeight: 94 },
      { day: 20, gross: 118, bags: 2, water: 10, netWeight: 108 },
      { day: 22, gross: 96, bags: 1, water: 8, netWeight: 88 },
      { day: 25, gross: 142, bags: 3, water: 13, netWeight: 129 },
      { day: 28, gross: 107, bags: 2, water: 9, netWeight: 98 },
      { day: 30, gross: 125, bags: 2, water: 10, netWeight: 115 },
    ],
    "2026-01": [
      { day: 2, gross: 132, bags: 2, water: 11, netWeight: 121 },
      { day: 4, gross: 98, bags: 1, water: 8, netWeight: 90 },
      { day: 6, gross: 148, bags: 3, water: 13, netWeight: 135 },
      { day: 9, gross: 115, bags: 2, water: 9, netWeight: 106 },
      { day: 11, gross: 127, bags: 2, water: 10, netWeight: 117 },
      { day: 14, gross: 93, bags: 1, water: 7, netWeight: 86 },
      { day: 16, gross: 161, bags: 3, water: 15, netWeight: 146 },
      { day: 19, gross: 109, bags: 2, water: 9, netWeight: 100 },
      { day: 21, gross: 122, bags: 2, water: 10, netWeight: 112 },
      { day: 24, gross: 88, bags: 1, water: 7, netWeight: 81 },
      { day: 26, gross: 138, bags: 3, water: 12, netWeight: 126 },
    ],
    "2026-02": [
      { day: 1, gross: 125, bags: 2, water: 10, netWeight: 115 },
      { day: 3, gross: 109, bags: 2, water: 9, netWeight: 100 },
      { day: 5, gross: 143, bags: 3, water: 12, netWeight: 131 },
      { day: 8, gross: 97, bags: 1, water: 8, netWeight: 89 },
      { day: 10, gross: 118, bags: 2, water: 10, netWeight: 108 },
    ],
  },
};

const MOCK_NOTIFICATIONS = [
  { id: "n1", title: "Cash Request Approved", message: "Your advance request of Rs. 5,000 for January has been approved.", time: "2 hours ago", read: false, type: "success" },
  { id: "n2", title: "Fertilizer Ready", message: "Your fertilizer request (50kg Urea) is ready for collection.", time: "1 day ago", read: false, type: "info" },
  { id: "n3", title: "Loan Request Pending", message: "Your loan request of Rs. 20,000 is under review.", time: "2 days ago", read: true, type: "warning" },
  { id: "n4", title: "Tea Collection Tomorrow", message: "Collection vehicle will arrive at 8:00 AM tomorrow.", time: "3 days ago", read: true, type: "info" },
  { id: "n5", title: "Payment Processed", message: "Your December leaf payment of Rs. 28,450 has been credited.", time: "5 days ago", read: true, type: "success" },
];

const SPECIAL_NEWS = [
  { id: "sn1", message: "🍃 New fertilizer subsidy program starts February 2026. Apply through the app to avail 30% discount on Urea orders." },
  { id: "sn2", message: "📢 Factory maintenance scheduled for Jan 15. No collection on that day. Please plan accordingly." },
];

// ── Provider ───────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("english");
  const [fontSize, setFontSize] = useState("medium");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeReg, setActiveReg] = useState(null);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  
  const [cashRequests, setCashRequests] = useState([
    { 
      id: "cr1", 
      type: "advance", 
      month: "Jan 2026", 
      amount: 5000, 
      date: "2026-01-05", 
      status: "approved",
      createdAt: "2026-01-05T10:30:00.000Z",
      requestedDate: "05 Jan 2026",
      userId: "SUP001",
      regNo: "REG-2021-001"
    },
    { 
      id: "cr2", 
      type: "loan", 
      month: "Jan 2026", 
      amount: 20000, 
      date: "2026-01-08", 
      status: "pending",
      createdAt: "2026-01-08T14:20:00.000Z",
      requestedDate: "08 Jan 2026",
      userId: "SUP001",
      regNo: "REG-2021-001"
    },
  ]);
  
  const [fertilizerRequests, setFertilizerRequests] = useState([
    { id: "fr1", month: "Dec 2025", fertType: "Urea", quantity: 50, date: "2025-12-05", status: "approved", createdAt: "2025-12-05T10:30:00.000Z" },
    { id: "fr2", month: "Jan 2026", fertType: "Potash", quantity: 25, date: "2026-01-10", status: "pending", createdAt: "2026-01-10T14:20:00.000Z" },
  ]);
  
  const [itemRequests, setItemRequests] = useState([
    { id: "ir1", month: "Jan 2026", itemType: "Pruning Shears", quantity: 2, date: "2026-01-12", status: "approved", createdAt: "2026-01-12T09:15:00.000Z" },
  ]);
  
  const [specialNews] = useState(SPECIAL_NEWS);
  const [newsShown, setNewsShown] = useState(false);

  // Load persisted settings
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("appSettings");
        if (stored) {
          const s = JSON.parse(stored);
          if (s.theme) setTheme(s.theme);
          if (s.language) setLanguage(s.language);
          if (s.fontSize) setFontSize(s.fontSize);
        }
      } catch (_) {}
    })();
  }, []);

  const saveSettings = useCallback(async (settings) => {
    try {
      await AsyncStorage.setItem("appSettings", JSON.stringify(settings));
    } catch (_) {}
  }, []);

  const updateTheme = (t) => { setTheme(t); saveSettings({ theme: t, language, fontSize }); };
  const updateLanguage = (l) => { setLanguage(l); saveSettings({ theme, language: l, fontSize }); };
  const updateFontSize = (f) => { setFontSize(f); saveSettings({ theme, language, fontSize: f }); };

  // Auth
  const signIn = (username, password) => {
    const supplier = MOCK_SUPPLIERS.find(
      (s) => s.username === username && s.password === password
    );
    return supplier || null;
  };

  const login = (supplier, reg) => {
    setCurrentUser(supplier);
    setActiveReg(reg);
    setNewsShown(false);
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveReg(null);
    setNewsShown(false);
  };

  // Profile update
  const updateProfile = (data) => {
    setCurrentUser((prev) => ({ ...prev, ...data }));
  };

  // Leaf data
  const getLeafData = (monthKey) => {
    if (!currentUser || !activeReg) return [];
    const key = `${currentUser.id}-${activeReg.regNo}`;
    return MOCK_LEAF_DATA[key]?.[monthKey] || [];
  };

  // Total leaf this month
  const getTodayLeaf = () => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const data = getLeafData(key);
    return data.reduce((sum, d) => sum + d.netWeight, 0);
  };

  // Notifications
  const markNotificationRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };
  
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };
  
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Cash requests function
  const addCashRequest = (requestData) => {
    let newReq;
    
    if (typeof requestData === 'object' && requestData !== null) {
      newReq = {
        id: requestData.id || `cr${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: requestData.type,
        month: requestData.month,
        amount: typeof requestData.amount === 'number' ? requestData.amount : parseFloat(requestData.amount),
        date: requestData.date || new Date().toISOString().split('T')[0],
        status: requestData.status || "pending",
        createdAt: requestData.createdAt || new Date().toISOString(),
        requestedDate: requestData.requestedDate || new Date().toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        userId: requestData.userId,
        regNo: requestData.regNo,
        updatedAt: requestData.updatedAt || new Date().toISOString()
      };
    } else {
      const [type, month, amount] = arguments;
      newReq = {
        id: `cr${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        month,
        amount: parseFloat(amount),
        date: new Date().toISOString().split('T')[0],
        status: "pending",
        createdAt: new Date().toISOString(),
        requestedDate: new Date().toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
      };
    }
    
    setCashRequests(prevRequests => {
      const currentRequests = Array.isArray(prevRequests) ? prevRequests : [];
      return [newReq, ...currentRequests];
    });
    
    // Auto-reject advance after 24h simulation
    if (newReq.type === "advance") {
      setTimeout(() => {
        setCashRequests((prev) =>
          prev.map((r) =>
            r.id === newReq.id && r.status === "pending"
              ? { ...r, status: "rejected", rejectedReason: "Auto-rejected: Not approved within 24 hours" }
              : r
          )
        );
      }, 86400000);
    }
    
    return newReq;
  };

  // Fertilizer requests function - UPDATED to accept object parameter
  const addFertilizerRequest = (requestData) => {
    let newReq;
    
    if (typeof requestData === 'object' && requestData !== null) {
      // New format: receiving an object with all fields
      newReq = {
        id: requestData.id || `fr${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        month: requestData.month,
        fertType: requestData.fertType,
        quantity: typeof requestData.quantity === 'number' ? requestData.quantity : parseFloat(requestData.quantity),
        date: requestData.date || new Date().toISOString().split('T')[0],
        status: requestData.status || "pending",
        createdAt: requestData.createdAt || new Date().toISOString(),
        requestedDate: requestData.requestedDate || new Date().toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        userId: requestData.userId,
        regNo: requestData.regNo,
        updatedAt: requestData.updatedAt || new Date().toISOString()
      };
    } else {
      // Old format: receiving (month, fertType, quantity)
      const [month, fertType, quantity] = arguments;
      newReq = {
        id: `fr${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        month,
        fertType,
        quantity: parseFloat(quantity),
        date: new Date().toISOString().split('T')[0],
        status: "pending",
        createdAt: new Date().toISOString(),
        requestedDate: new Date().toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
      };
    }
    
    setFertilizerRequests(prevRequests => {
      const currentRequests = Array.isArray(prevRequests) ? prevRequests : [];
      return [newReq, ...currentRequests];
    });
    
    return newReq;
  };

  // Item requests
  const addItemRequest = (requestData) => {
    let newReq;
    
    if (typeof requestData === 'object' && requestData !== null) {
      newReq = {
        id: requestData.id || `ir${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        month: requestData.month,
        itemType: requestData.itemType,
        quantity: typeof requestData.quantity === 'number' ? requestData.quantity : parseFloat(requestData.quantity),
        date: requestData.date || new Date().toISOString().split('T')[0],
        status: requestData.status || "pending",
        createdAt: requestData.createdAt || new Date().toISOString(),
        requestedDate: requestData.requestedDate || new Date().toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        userId: requestData.userId,
        regNo: requestData.regNo,
        updatedAt: requestData.updatedAt || new Date().toISOString()
      };
    } else {
      const [month, itemType, quantity] = arguments;
      newReq = {
        id: `ir${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        month,
        itemType,
        quantity: parseFloat(quantity),
        date: new Date().toISOString().split('T')[0],
        status: "pending",
        createdAt: new Date().toISOString(),
        requestedDate: new Date().toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
      };
    }
    
    setItemRequests(prevRequests => {
      const currentRequests = Array.isArray(prevRequests) ? prevRequests : [];
      return [newReq, ...currentRequests];
    });
    
    return newReq;
  };

  // 6-month history summary
  const getSixMonthHistory = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short", year: "numeric" });
      const data = getLeafData(key);
      const totalNet = data.reduce((s, r) => s + r.netWeight, 0);
      const totalGross = data.reduce((s, r) => s + r.gross, 0);
      months.push({ key, label, totalNet, totalGross, days: data.length });
    }
    return months;
  };

  const isDark = theme === "dark";

  // Create the context value object
  const contextValue = {
    // Theme
    theme, 
    isDark, 
    updateTheme,
    language, 
    updateLanguage,
    fontSize, 
    updateFontSize,
    // Auth
    currentUser, 
    activeReg,
    signIn, 
    login, 
    logout, 
    updateProfile,
    suppliers: MOCK_SUPPLIERS,
    // Data
    getLeafData, 
    getTodayLeaf, 
    getSixMonthHistory,
    notifications, 
    unreadCount, 
    markNotificationRead, 
    markAllRead,
    cashRequests, 
    addCashRequest,
    fertilizerRequests, 
    addFertilizerRequest,
    itemRequests, 
    addItemRequest,
    specialNews, 
    newsShown, 
    setNewsShown,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return ctx;
};