// PDF HTML builder — kept in English regardless of app language, since this
// generates a formal downloaded statement document rather than an app screen.
export function buildLeafHtml({ historyArray, currentUser, activeReg, periodLabel }) {
  const totalGross    = historyArray.reduce((s, h) => s + (h?.totalGross    || 0), 0);
  const totalNet      = historyArray.reduce((s, h) => s + (h?.totalNet      || 0), 0);
  const totalSuperNet = historyArray.reduce((s, h) => s + (h?.totalSuperNet || 0), 0);
  const totalDays     = historyArray.reduce((s, h) => s + (h?.days          || 0), 0);
  const hasSuper      = historyArray.some((h) => (h?.totalSuperNet || 0) > 0);

  const rows = historyArray
    .map(
      (m) => `
        <tr>
          <td style="text-align:left; padding:10px; border:1px solid #ddd;">${m?.label ?? "-"}</td>
          <td style="text-align:right; padding:10px; border:1px solid #ddd;">${Math.round(m?.totalGross ?? 0)}</td>
          <td style="text-align:right; padding:10px; border:1px solid #ddd;">${Math.round(m?.totalNet ?? 0)}</td>
          ${hasSuper ? `<td style="text-align:right; padding:10px; border:1px solid #ddd;">${Math.round(m?.totalSuperNet ?? 0)}</td>` : ""}
          <td style="text-align:right; padding:10px; border:1px solid #ddd;">${m?.days ?? 0}</td>
        </tr>
      `
    )
    .join("");

  const superHeader = hasSuper
    ? '<th style="text-align:center; padding:12px; border:1px solid #ddd; background-color:#166534; color:white;">Super Net (kg)</th>'
    : "";
  const superTotal = hasSuper
    ? `<td style="text-align:right; padding:10px; border:1px solid #ddd; font-weight:bold;">${Math.round(totalSuperNet)}</td>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Leaf Collection Statement</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 40px 30px; color: #1a1a1a; font-size: 14px; line-height: 1.6; background: #fff;
          }
          .container { max-width: 1200px; margin: 0 auto; }
          .header-band {
            background: linear-gradient(135deg, #166534 0%, #14532d 100%);
            color: #fff; padding: 24px 28px; border-radius: 12px; margin-bottom: 24px;
          }
          .header-band h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.3px; }
          .header-band p  { font-size: 13px; opacity: 0.9; margin-top: 4px; }
          .info-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 12px 30px;
            margin-bottom: 24px; padding: 18px 20px; background: #f0fdf4;
            border-radius: 10px; border: 1px solid #bbf7d0;
          }
          .info-item  { display: flex; flex-direction: column; }
          .info-label { color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .info-value { font-weight: 700; font-size: 14px; color: #111827; }
          .stats-row  { display: flex; gap: 15px; margin-bottom: 28px; flex-wrap: wrap; }
          .stat-box   { flex: 1; min-width: 120px; padding: 16px; border-radius: 10px; text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; }
          .stat-value { font-size: 28px; font-weight: 800; color: #166534; margin-bottom: 5px; }
          .stat-label { font-size: 11px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; }
          .table-wrapper { overflow-x: auto; margin: 20px 0 16px; border-radius: 10px; border: 1px solid #e5e7eb; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th  { background: #166534; color: white; padding: 12px 10px; text-align: center; font-weight: 600; font-size: 13px; border: 1px solid #1f6e43; }
          td  { padding: 10px; border: 1px solid #e5e7eb; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .total-row    { background-color: #dcfce7 !important; font-weight: 800; }
          .total-row td { font-weight: 800; color: #166534; border-top: 2px solid #166534; }
          .footer { margin-top: 30px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; }
          @media print { body { padding: 20px; } .stat-box { break-inside: avoid; } .table-wrapper { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-band">
            <h1>🍃 Leaf Collection Statement</h1>
            <p>${periodLabel}</p>
          </div>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">Supplier Name</div><div class="info-value">${currentUser?.name ?? "-"}</div></div>
            <div class="info-item"><div class="info-label">Registration No.</div><div class="info-value">${activeReg?.regNo ?? "-"}</div></div>
            <div class="info-item"><div class="info-label">Reporting Period</div><div class="info-value">${periodLabel}</div></div>
            <div class="info-item"><div class="info-label">Generated On</div><div class="info-value">${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div></div>
          </div>
          <div class="stats-row">
            <div class="stat-box"><div class="stat-value">${Math.round(totalGross).toLocaleString()}</div><div class="stat-label">Total Gross (kg)</div></div>
            <div class="stat-box"><div class="stat-value">${Math.round(totalNet).toLocaleString()}</div><div class="stat-label">Normal Net (kg)</div></div>
            ${hasSuper ? `<div class="stat-box"><div class="stat-value">${Math.round(totalSuperNet).toLocaleString()}</div><div class="stat-label">Super Net (kg)</div></div>` : ""}
            <div class="stat-box"><div class="stat-value">${totalDays}</div><div class="stat-label">Collection Days</div></div>
          </div>
          <div class="table-wrapper">
            <table cellspacing="0">
              <thead>
                <tr>
                  <th style="text-align:left">Month</th>
                  <th>Gross (kg)</th>
                  <th>Normal Net (kg)</th>
                  ${superHeader}
                  <th>Days</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
                <tr class="total-row">
                  <td style="text-align:left; font-weight:800;">TOTAL</td>
                  <td style="text-align:right; font-weight:800;">${Math.round(totalGross).toLocaleString()}</td>
                  <td style="text-align:right; font-weight:800;">${Math.round(totalNet).toLocaleString()}</td>
                  ${superTotal}
                  <td style="text-align:right; font-weight:800;">${totalDays}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="footer">
            <p>This statement was automatically generated by the Tea Factory Supplier Management System.</p>
            <p>For queries, please contact the factory office.</p>
          </div>
        </div>
      </body>
    </html>`;
}
