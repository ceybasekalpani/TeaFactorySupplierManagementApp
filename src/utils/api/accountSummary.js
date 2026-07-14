import { request } from "./client";

// Monthly account summary (cash + fertilizer + item per month)
export const accountSummaryApi = {
  monthlyRequests: (token, months = 6) =>
    request("GET", `/api/accountsummary/monthly-requests?months=${months}`, undefined, token),
};
