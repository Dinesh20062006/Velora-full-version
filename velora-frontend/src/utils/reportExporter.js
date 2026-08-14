/**
 * Velora Police Command Center - Official E-Report & Case History Exporter
 */

/**
 * Download a Detailed Official E-Report for an Individual Incident Case
 */
export function downloadIndividualEReport(item, assignedOfficerName = "") {
  const cId = item.complaintId || item.id || "N/A";
  const reporter = item.userName || item.title || item.victimName || "Citizen User";
  const category = (item.category || item.type || "GENERAL").toUpperCase();
  const locationStr = typeof item.location === "object" ? (item.location?.address || item.location?.city) : (item.location || item.address || "Recorded Location");
  const status = (item.status || "PENDING").toUpperCase();
  const officer = assignedOfficerName || item.assignedOfficerName || item.assignedOfficerId || "Unassigned";
  const timestamp = item.createdAt || item.createdDate || item.timestamp || new Date().toLocaleString();
  const imageUrl = item.imageUrl || null;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Official E-Report - INC-${cId}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0b0f17;
            color: #f3f4f6;
            margin: 0;
            padding: 40px 20px;
        }
        .report-card {
            max-width: 800px;
            margin: 0 auto;
            background: #111827;
            border: 2px solid #374151;
            border-radius: 16px;
            padding: 36px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            position: relative;
        }
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 80px;
            font-weight: 900;
            color: rgba(255, 255, 255, 0.03);
            pointer-events: none;
            white-space: nowrap;
            text-transform: uppercase;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #1f2937;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }
        .header-title h1 {
            margin: 0;
            font-size: 24px;
            color: #ec4899;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header-title p {
            margin: 4px 0 0 0;
            color: #9ca3af;
            font-size: 13px;
        }
        .badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 13px;
            letter-spacing: 0.5px;
        }
        .badge-resolved { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #059669; }
        .badge-investigating { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #d97706; }
        .badge-pending { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #dc2626; }

        .section-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 24px;
        }
        .info-box {
            background: #1f2937;
            padding: 16px;
            border-radius: 10px;
            border: 1px solid #374151;
        }
        .info-box label {
            font-size: 11px;
            color: #9ca3af;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 4px;
        }
        .info-box span {
            font-size: 15px;
            color: #f9fafb;
            font-weight: 600;
        }
        .evidence-box {
            background: #1f2937;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #374151;
            margin-bottom: 24px;
            text-align: center;
        }
        .evidence-img {
            max-width: 100%;
            max-height: 350px;
            border-radius: 10px;
            border: 1px solid #4b5563;
            margin-top: 12px;
        }
        .footer {
            border-top: 2px solid #1f2937;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #6b7280;
        }
        .btn-print {
            background: #3b82f6;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            float: right;
            margin-top: 20px;
        }
        @media print {
            .btn-print { display: none; }
            body { background: #fff; color: #000; }
            .report-card { border: 1px solid #ccc; background: #fff; color: #000; box-shadow: none; }
            .info-box, .evidence-box { background: #f9fafb; border: 1px solid #ddd; color: #000; }
            .info-box span { color: #000; }
        }
    </style>
</head>
<body>
    <div class="report-card">
        <div class="watermark">VELORA POLICE SECURITY</div>
        
        <div class="header">
            <div class="header-title">
                <h1>Official Incident E-Report</h1>
                <p>Velora Integrated Women's Safety Operations & Dispatch Network</p>
            </div>
            <div>
                <span class="badge ${status === 'RESOLVED' ? 'badge-resolved' : status === 'UNDER_INVESTIGATION' || status === 'IN_PROGRESS' || status === 'ASSIGNED' ? 'badge-investigating' : 'badge-pending'}">
                    ● ${status === 'UNDER_INVESTIGATION' ? 'INVESTIGATING' : status}
                </span>
            </div>
        </div>

        <div class="section-grid">
            <div class="info-box">
                <label>Incident Case Reference ID</label>
                <span>INC-${cId}</span>
            </div>
            <div class="info-box">
                <label>Report Timestamp</label>
                <span>${timestamp}</span>
            </div>
            <div class="info-box">
                <label>Complainant / Citizen Name</label>
                <span>${reporter}</span>
            </div>
            <div class="info-box">
                <label>Incident Category</label>
                <span>${category}</span>
            </div>
            <div class="info-box" style="grid-column: span 2;">
                <label>Recorded Incident Geolocation / Address</label>
                <span>📍 ${locationStr}</span>
            </div>
            <div class="info-box" style="grid-column: span 2;">
                <label>Assigned Police Officer / Dispatch Lead</label>
                <span style="color: #60a5fa;">👮 ${officer}</span>
            </div>
        </div>

        ${imageUrl ? `
        <div class="evidence-box">
            <label style="color: #9ca3af; font-size: 12px; font-weight: 700; text-transform: uppercase;">Attached Incident Photo Evidence</label>
            <div>
                <img src="${imageUrl}" alt="Evidence Photo for INC-${cId}" class="evidence-img" />
            </div>
        </div>
        ` : `
        <div class="evidence-box">
            <span style="color: #9ca3af; font-size: 13px;">No Evidence Photo Attachment Submitted</span>
        </div>
        `}

        <div class="footer">
            <div>
                <span>Authorized Officer Verification Token: <strong>VEL-${Math.random().toString(36).substring(2, 9).toUpperCase()}</strong></span>
            </div>
            <div>
                <span>Generated on: ${new Date().toLocaleString()}</span>
            </div>
        </div>

        <button class="btn-print" onclick="window.print()">🖨️ Print / Save PDF E-Report</button>
    </div>
</body>
</html>
  `;

  // Fail-proof export: Open interactive printable report in new tab + Data URI download fallback
  let winOpened = false;
  try {
    const reportWin = window.open("", "_blank");
    if (reportWin) {
      reportWin.document.write(htmlContent);
      reportWin.document.close();
      reportWin.focus();
      winOpened = true;
      setTimeout(() => {
        try {
          reportWin.print();
        } catch (e) {
          console.warn("Auto print failed, manual print available on page:", e);
        }
      }, 500);
    }
  } catch (err) {
    console.warn("Popup blocked or window.open failed, falling back to direct download:", err);
  }

  if (!winOpened) {
    const encoded = encodeURIComponent(htmlContent);
    const a = document.createElement("a");
    a.href = `data:text/html;charset=utf-8,${encoded}`;
    a.download = `Velora_Incident_Report_INC-${cId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Download a Comprehensive Full Case History Report (HTML & CSV format)
 */
export function downloadFullCaseHistoryReport(cases, officers = []) {
  if (!cases || cases.length === 0) {
    alert("No incident cases available to generate history report.");
    return;
  }

  // 1. Generate CSV file
  const headers = ["Case ID", "Victim/Reporter Name", "Category", "Location", "Status", "Assigned Officer", "Photo Evidence URL", "Timestamp"];
  const rows = cases.map(c => {
    const cId = c.complaintId || c.id || "";
    const reporter = c.userName || c.title || c.victimName || "Citizen User";
    const category = c.category || c.type || "GENERAL";
    const loc = typeof c.location === "object" ? c.location?.address : (c.location || c.address || "");
    const status = (c.status || "PENDING").toUpperCase();
    const officerId = c.assignedOfficerId || c.assignedOfficer || c.officerId || "";
    const officerObj = officers.find(o => String(o.id || o.policeId) === String(officerId));
    const officerName = officerObj ? officerObj.name : (c.assignedOfficerName || "Unassigned");
    const photo = c.imageUrl || "None";
    const time = c.createdAt || c.createdDate || c.timestamp || "";

    return [
      `"INC-${cId}"`,
      `"${reporter.replace(/"/g, '""')}"`,
      `"${category.replace(/"/g, '""')}"`,
      `"${loc.replace(/"/g, '""')}"`,
      `"${status}"`,
      `"${officerName.replace(/"/g, '""')}"`,
      `"${photo}"`,
      `"${time}"`
    ].join(",");
  });

  const csvString = [headers.join(","), ...rows].join("\n");

  // Download CSV
  const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const csvUrl = URL.createObjectURL(csvBlob);
  const csvLink = document.createElement("a");
  csvLink.href = csvUrl;
  csvLink.download = `Velora_Full_Case_History_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(csvLink);
  csvLink.click();
  document.body.removeChild(csvLink);
  URL.revokeObjectURL(csvUrl);

  // 2. Also Generate Printable HTML History Document
  const pendingCount = cases.filter(c => (c.status || "").toUpperCase() === "PENDING").length;
  const investigationCount = cases.filter(c => {
    const st = (c.status || "").toUpperCase();
    return st === "UNDER_INVESTIGATION" || st === "IN_PROGRESS" || st === "ASSIGNED";
  }).length;
  const resolvedCount = cases.filter(c => (c.status || "").toUpperCase() === "RESOLVED").length;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Velora Full Case History Summary Report</title>
    <style>
        body { font-family: sans-serif; background: #0b0f17; color: #f3f4f6; padding: 30px; }
        .container { max-width: 1100px; margin: 0 auto; background: #111827; border: 1px solid #374151; border-radius: 12px; padding: 30px; }
        h1 { color: #ec4899; margin-top: 0; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { background: #1f2937; padding: 15px 20px; border-radius: 8px; flex: 1; border: 1px solid #374151; }
        .stat-card h3 { margin: 0; font-size: 13px; color: #9ca3af; }
        .stat-card h2 { margin: 5px 0 0 0; font-size: 24px; color: #f3f4f6; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left; }
        th, td { padding: 12px; border-bottom: 1px solid #374151; }
        th { background: #1f2937; color: #9ca3af; font-size: 13px; }
        .btn-print { background: #3b82f6; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; float: right; }
        @media print { .btn-print { display: none; } body { background: #fff; color: #000; } .container { background: #fff; color: #000; border: none; } th { background: #eee; color: #000; } td { color: #000; } .stat-card { background: #f5f5f5; color: #000; } .stat-card h2 { color: #000; } }
    </style>
</head>
<body>
    <div class="container">
        <button class="btn-print" onclick="window.print()">🖨️ Print / Save Summary PDF</button>
        <h1>Velora Police Operations - Full Case History Report</h1>
        <p style="color: #9ca3af;">Generated on: ${new Date().toLocaleString()} | Total Recorded Incidents: ${cases.length}</p>

        <div class="stats">
            <div class="stat-card">
                <h3>Total Incident Logged</h3>
                <h2>${cases.length}</h2>
            </div>
            <div class="stat-card">
                <h3>Pending Action</h3>
                <h2 style="color: #ef4444;">${pendingCount}</h2>
            </div>
            <div class="stat-card">
                <h3>Under Investigation</h3>
                <h2 style="color: #f59e0b;">${investigationCount}</h2>
            </div>
            <div class="stat-card">
                <h3>Resolved Cases</h3>
                <h2 style="color: #10b981;">${resolvedCount}</h2>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Case ID</th>
                    <th>Reporter</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Assigned Officer</th>
                </tr>
            </thead>
            <tbody>
                ${cases.map(c => {
                  const cId = c.complaintId || c.id || "";
                  const reporter = c.userName || c.title || c.victimName || "Citizen User";
                  const category = c.category || c.type || "GENERAL";
                  const loc = typeof c.location === "object" ? c.location?.address : (c.location || c.address || "");
                  const status = (c.status || "PENDING").toUpperCase();
                  const officerId = c.assignedOfficerId || c.assignedOfficer || c.officerId || "";
                  const officerObj = officers.find(o => String(o.id || o.policeId) === String(officerId));
                  const officerName = officerObj ? officerObj.name : (c.assignedOfficerName || "Unassigned");
                  return `
                    <tr>
                        <td><strong>INC-${cId}</strong></td>
                        <td>${reporter}</td>
                        <td>${category}</td>
                        <td>📍 ${loc}</td>
                        <td>${status}</td>
                        <td>👮 ${officerName}</td>
                    </tr>
                  `;
                }).join("")}
            </tbody>
        </table>
    </div>
</body>
</html>
  `;

  let winOpened = false;
  try {
    const reportWin = window.open("", "_blank");
    if (reportWin) {
      reportWin.document.write(htmlContent);
      reportWin.document.close();
      reportWin.focus();
      winOpened = true;
    }
  } catch (err) {
    console.warn("Popup blocked or window.open failed, falling back to direct download:", err);
  }

  if (!winOpened) {
    const encoded = encodeURIComponent(htmlContent);
    const htmlLink = document.createElement("a");
    htmlLink.href = `data:text/html;charset=utf-8,${encoded}`;
    htmlLink.download = `Velora_Full_Case_History_Summary_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(htmlLink);
    htmlLink.click();
    document.body.removeChild(htmlLink);
  }
}
