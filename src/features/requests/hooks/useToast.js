import { useState } from "react";

// Shared by cash-request and fertilizerItem-request screens — both had this
// exact same toast state/dismiss-timer logic duplicated inline.
export function useToast() {
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

  return { toast, showToast };
}
