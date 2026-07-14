import { useEffect, useState } from "react";
import { cashApi, tokenStorage } from "../../../utils/api";

export function useAdvanceLimit() {
  const [advanceLimit, setAdvanceLimit] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.get();
        const result = await cashApi.advanceLimit(token);
        if (result?.limit !== undefined && result.limit !== null) {
          setAdvanceLimit(Number(result.limit));
        }
      } catch (_) {}
    })();
  }, []);

  return advanceLimit;
}
