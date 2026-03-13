/**
 * Love Storm — PDF Report Generator
 * Uses jsPDF + jspdf-autotable to produce branded impact reports.
 *
 * Two entry points:
 *   exportStormReport(data)   — single storm, deep-dive
 *   exportSummaryReport(data) — platform-wide snapshot
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Storm, Drop, Request } from "@shared/schema";

// ── Brand palette (RGB) ────────────────────────────────────────────────────
const NAVY   = [15, 23, 50]   as [number, number, number]; // deep navy hero
const CORAL  = [210, 95, 60]  as [number, number, number]; // accent orange-coral
const SLATE  = [71, 85, 105]  as [number, number, number]; // muted text
const WHITE  = [255, 255, 255] as [number, number, number];
const LIGHT  = [248, 250, 252] as [number, number, number]; // surface
const BORDER = [226, 232, 240] as [number, number, number];

const PAGE_W = 210; // A4 mm
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function urgencyLabel(u: string): string {
  return { critical: "CRITICAL", high: "HIGH", medium: "MEDIUM", low: "LOW" }[u] ?? u.toUpperCase();
}

/** Draw the branded header block at the top of a page */
function drawHeader(doc: jsPDF, subtitle: string) {
  // Navy banner
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, 28, "F");

  // Heart-bolt logo mark (simplified geometric)
  const lx = MARGIN;
  const ly = 6;
  doc.setFillColor(...CORAL);
  // Heart left bump
  doc.circle(lx + 3.5, ly + 4, 3.5, "F");
  // Heart right bump
  doc.circle(lx + 7.5, ly + 4, 3.5, "F");
  // Heart bottom triangle (approximated with polygon)
  doc.setFillColor(...CORAL);
  doc.triangle(lx, ly + 5.5, lx + 11, ly + 5.5, lx + 5.5, ly + 13, "F");

  // Wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...WHITE);
  doc.text("LoveStorm", lx + 15, ly + 9);

  // Subtitle / report type
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 230);
  doc.text(subtitle, lx + 15, ly + 15);

  // Right-aligned date
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.setFontSize(7.5);
  doc.setTextColor(180, 195, 220);
  doc.text(`Generated ${now}`, PAGE_W - MARGIN, ly + 9, { align: "right" });

  // Tagline
  doc.setFontSize(7);
  doc.text("Community Mobilization Platform · Louisville, KY", PAGE_W - MARGIN, ly + 15, { align: "right" });
}

/** Draw a section heading with coral left-bar */
function drawSection(doc: jsPDF, label: string, y: number): number {
  doc.setFillColor(...CORAL);
  doc.rect(MARGIN, y, 3, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(label.toUpperCase(), MARGIN + 6, y + 4.2);
  return y + 10;
}

/** Stat box: small kpi card */
function drawStatBox(doc: jsPDF, x: number, y: number, w: number, h: number, value: string, label: string) {
  doc.setFillColor(...LIGHT);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text(value, x + w / 2, y + h / 2 - 0.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...SLATE);
  doc.text(label, x + w / 2, y + h / 2 + 5, { align: "center" });
}

/** Draw branded footer with page number */
function drawFooter(doc: jsPDF, pageNum: number, pageCount: number) {
  const y = 292;
  doc.setDrawColor(...BORDER);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...SLATE);
  doc.text("LoveStorm · Community Mobilization Platform", MARGIN, y + 4);
  doc.text(`Page ${pageNum} of ${pageCount}`, PAGE_W - MARGIN, y + 4, { align: "right" });
  doc.text("Created with Perplexity Computer · perplexity.ai/computer", PAGE_W / 2, y + 4, { align: "center" });
}

/** Wrapped text block, returns new Y position */
function drawTextBlock(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, fontSize = 9): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...SLATE);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * (fontSize * 0.45);
}

// ── Per-Storm Report ───────────────────────────────────────────────────────

interface StormReportData {
  generatedAt: string;
  storm: Storm;
  drops: Drop[];
  completedDrops: Drop[];
  pendingDrops: Drop[];
  completionPct: number;
  categoryBreakdown: Record<string, number>;
}

export function exportStormReport(data: StormReportData) {
  const { storm, drops, completedDrops, pendingDrops, completionPct, categoryBreakdown } = data;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // ── Page 1: Overview ────────────────────────────────────────────────────
  drawHeader(doc, "Storm Impact Report");

  let y = 36;

  // Storm title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  const titleLines = doc.splitTextToSize(storm.title, CONTENT_W);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 8 + 2;

  // Urgency badge
  const urgencyColors: Record<string, [number, number, number]> = {
    critical: [220, 38, 38],
    high: [234, 88, 12],
    medium: [202, 138, 4],
    low: [22, 163, 74],
  };
  const badgeColor = urgencyColors[storm.urgency] ?? CORAL;
  doc.setFillColor(...badgeColor);
  doc.roundedRect(MARGIN, y, 28, 6, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text(urgencyLabel(storm.urgency), MARGIN + 14, y + 4, { align: "center" });

  // Status badge
  const statusColor: [number, number, number] = storm.status === "active" ? [22, 163, 74] : [100, 116, 139];
  doc.setFillColor(...statusColor);
  doc.roundedRect(MARGIN + 31, y, 22, 6, 1, 1, "F");
  doc.setTextColor(...WHITE);
  doc.text(storm.status.toUpperCase(), MARGIN + 31 + 11, y + 4, { align: "center" });
  y += 12;

  // Metadata row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE);
  doc.text(`📍 ${storm.location}`, MARGIN, y);
  doc.text(`👤 ${storm.stewardName}`, MARGIN + CONTENT_W / 2, y);
  y += 5.5;
  doc.text(`📅 Created ${formatDate(storm.createdAt)}`, MARGIN, y);
  if (storm.expiresAt) doc.text(`⏳ Expires ${formatDate(storm.expiresAt)}`, MARGIN + CONTENT_W / 2, y);
  y += 10;

  // KPI boxes: 4 across
  const boxW = (CONTENT_W - 9) / 4;
  const boxH = 20;
  drawStatBox(doc, MARGIN, y, boxW, boxH, `${storm.dropCount}`, "Total Drops");
  drawStatBox(doc, MARGIN + boxW + 3, y, boxW, boxH, `${completedDrops.length}`, "Completed");
  drawStatBox(doc, MARGIN + (boxW + 3) * 2, y, boxW, boxH, `${pendingDrops.length}`, "In Progress");
  drawStatBox(doc, MARGIN + (boxW + 3) * 3, y, boxW, boxH, `${storm.participantCount}`, "Participants");
  y += boxH + 8;

  // Progress bar
  y = drawSection(doc, "Mission Progress", y);
  doc.setFillColor(...BORDER);
  doc.roundedRect(MARGIN, y, CONTENT_W, 7, 3.5, 3.5, "F");
  const fillW = Math.max(7, (completionPct / 100) * CONTENT_W);
  doc.setFillColor(...CORAL);
  doc.roundedRect(MARGIN, y, fillW, 7, 3.5, 3.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text(`${completionPct}% complete — ${storm.dropCount} of ${storm.targetDrops} drops`, MARGIN + fillW / 2, y + 4.8, { align: "center" });
  y += 15;

  // Description
  y = drawSection(doc, "About This Storm", y);
  y = drawTextBlock(doc, storm.description, MARGIN, y, CONTENT_W, 9);
  y += 6;

  // Need
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text("Needs:", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SLATE);
  doc.text(storm.need, MARGIN + 14, y);
  y += 8;

  // Tags
  if (storm.tags && storm.tags.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text("Tags:", MARGIN, y);
    let tx = MARGIN + 12;
    for (const tag of storm.tags) {
      const tw = doc.getTextWidth(tag) + 6;
      doc.setFillColor(...LIGHT);
      doc.setDrawColor(...BORDER);
      doc.roundedRect(tx, y - 3.5, tw, 5.5, 1, 1, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE);
      doc.text(tag, tx + tw / 2, y + 0.5, { align: "center" });
      tx += tw + 3;
    }
    y += 10;
  }

  // Category breakdown
  y = drawSection(doc, "Support by Category", y);
  const cats = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const totalCatDrops = cats.reduce((s, [, n]) => s + n, 0);
  for (const [cat, count] of cats) {
    const pct = totalCatDrops > 0 ? (count / totalCatDrops) : 0;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE);
    doc.text(capitalize(cat), MARGIN, y + 3.5);
    doc.text(`${count} drop${count !== 1 ? "s" : ""}`, MARGIN + CONTENT_W, y + 3.5, { align: "right" });
    // Bar bg
    doc.setFillColor(...BORDER);
    doc.roundedRect(MARGIN + 30, y, CONTENT_W - 50, 5, 2.5, 2.5, "F");
    // Bar fill
    doc.setFillColor(...CORAL);
    doc.roundedRect(MARGIN + 30, y, Math.max(5, pct * (CONTENT_W - 50)), 5, 2.5, 2.5, "F");
    y += 9;
  }
  y += 4;

  // ── Page 2: Drop Log ────────────────────────────────────────────────────
  doc.addPage();
  drawHeader(doc, `Drop Log — ${storm.title}`);
  y = 36;

  y = drawSection(doc, "All Drops", y);

  if (drops.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...SLATE);
    doc.text("No drops have been recorded for this storm yet.", MARGIN, y + 4);
    y += 14;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Contributor", "Action", "Category", "Status", "Date"]],
      body: drops.map(d => [
        d.actorName,
        d.action + (d.note ? `\n  ↳ ${d.note}` : ""),
        capitalize(d.category),
        d.completed ? "✓ Done" : "In Progress",
        formatDate(d.createdAt),
      ]),
      headStyles: {
        fillColor: NAVY,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      },
      alternateRowStyles: { fillColor: LIGHT },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 24 },
        3: { cellWidth: 24 },
        4: { cellWidth: 26 },
      },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.section === "body") {
          if (String(data.cell.raw).startsWith("✓")) {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.textColor = [234, 88, 12];
          }
        }
      },
    });
  }

  // Footer on all pages
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  const filename = `love-storm-${storm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.pdf`;
  doc.save(filename);
}

// ── Platform Summary Report ────────────────────────────────────────────────

interface StormWithDrops extends Storm {
  drops: Drop[];
  completionPct: number;
}

interface SummaryReportData {
  generatedAt: string;
  stats: {
    totalStorms: number;
    activeStorms: number;
    completedStorms: number;
    totalDrops: number;
    totalParticipants: number;
  };
  storms: StormWithDrops[];
  pendingRequests: Request[];
  categoryBreakdown: Record<string, number>;
}

export function exportSummaryReport(data: SummaryReportData) {
  const { stats, storms, pendingRequests, categoryBreakdown } = data;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // ── Page 1: Platform Overview ────────────────────────────────────────────
  drawHeader(doc, "Platform Summary Report");
  let y = 36;

  // Report title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...NAVY);
  doc.text("Love Storm — Impact Overview", MARGIN, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text(`All active and completed storms as of ${formatDate(data.generatedAt)}`, MARGIN, y);
  y += 12;

  // 5 KPI boxes
  const kpiW = (CONTENT_W - 12) / 5;
  const kpiH = 22;
  drawStatBox(doc, MARGIN, y, kpiW, kpiH, `${stats.totalStorms}`, "Total Storms");
  drawStatBox(doc, MARGIN + (kpiW + 3), y, kpiW, kpiH, `${stats.activeStorms}`, "Active");
  drawStatBox(doc, MARGIN + (kpiW + 3) * 2, y, kpiW, kpiH, `${stats.completedStorms}`, "Completed");
  drawStatBox(doc, MARGIN + (kpiW + 3) * 3, y, kpiW, kpiH, `${stats.totalDrops}`, "Total Drops");
  drawStatBox(doc, MARGIN + (kpiW + 3) * 4, y, kpiW, kpiH, `${stats.totalParticipants}`, "Participants");
  y += kpiH + 10;

  // Category breakdown
  y = drawSection(doc, "Drops by Category", y);
  const cats = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const totalCatDrops = cats.reduce((s, [, n]) => s + n, 0);
  for (const [cat, count] of cats) {
    const pct = totalCatDrops > 0 ? (count / totalCatDrops) : 0;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE);
    doc.text(capitalize(cat), MARGIN, y + 3.5);
    doc.text(`${count}`, MARGIN + CONTENT_W, y + 3.5, { align: "right" });
    doc.setFillColor(...BORDER);
    doc.roundedRect(MARGIN + 28, y, CONTENT_W - 42, 5, 2.5, 2.5, "F");
    doc.setFillColor(...CORAL);
    doc.roundedRect(MARGIN + 28, y, Math.max(5, pct * (CONTENT_W - 42)), 5, 2.5, 2.5, "F");
    y += 9;
  }
  y += 6;

  // All storms table
  y = drawSection(doc, "Storm Summary", y);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Storm", "Location", "Urgency", "Status", "Drops", "Progress", "Steward"]],
    body: storms.map(s => [
      s.title,
      s.location,
      urgencyLabel(s.urgency),
      capitalize(s.status),
      `${s.dropCount} / ${s.targetDrops}`,
      `${s.completionPct}%`,
      s.stewardName,
    ]),
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
    },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: "bold" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 16 },
      6: { cellWidth: 35 },
    },
    didParseCell: (data) => {
      if (data.column.index === 2 && data.section === "body") {
        const v = String(data.cell.raw);
        if (v === "CRITICAL") data.cell.styles.textColor = [220, 38, 38];
        else if (v === "HIGH") data.cell.styles.textColor = [234, 88, 12];
        else if (v === "MEDIUM") data.cell.styles.textColor = [202, 138, 4];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // ── Page 2: Per-Storm Detail ─────────────────────────────────────────────
  doc.addPage();
  drawHeader(doc, "Storm Detail Summaries");
  y = 36;

  for (const storm of storms) {
    // Check remaining space on page
    if (y > 240) {
      doc.addPage();
      drawHeader(doc, "Storm Detail Summaries (cont.)");
      y = 36;
    }

    // Storm card
    doc.setFillColor(...LIGHT);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(MARGIN, y, CONTENT_W, 6, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text(storm.title, MARGIN + 3, y + 4.2);

    // Urgency dot
    const urgencyColors: Record<string, [number, number, number]> = {
      critical: [220, 38, 38], high: [234, 88, 12], medium: [202, 138, 4], low: [22, 163, 74],
    };
    doc.setFillColor(...(urgencyColors[storm.urgency] ?? CORAL));
    doc.circle(PAGE_W - MARGIN - 3, y + 3, 2, "F");
    y += 9;

    // Location + steward
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text(`${storm.location} · Steward: ${storm.stewardName}`, MARGIN, y);
    y += 5;

    // Description (truncated)
    const descLines = doc.splitTextToSize(storm.description, CONTENT_W);
    const truncated = descLines.slice(0, 3);
    if (descLines.length > 3) truncated[2] = truncated[2].slice(0, -3) + "...";
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text(truncated, MARGIN, y);
    y += truncated.length * 3.8 + 4;

    // Mini stats row
    const miniBoxW = 28;
    const miniBoxH = 14;
    const boxes = [
      { val: String(storm.dropCount), lbl: "Drops" },
      { val: `${storm.completionPct}%`, lbl: "Complete" },
      { val: String(storm.participantCount), lbl: "People" },
      { val: capitalize(storm.status), lbl: "Status" },
    ];
    boxes.forEach((b, i) => {
      drawStatBox(doc, MARGIN + i * (miniBoxW + 3), y, miniBoxW, miniBoxH, b.val, b.lbl);
    });
    y += miniBoxH + 10;

    // Drop activity table (compact)
    if (storm.drops.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [["Contributor", "Action", "Category", "Status"]],
        body: storm.drops.slice(0, 8).map(d => [
          d.actorName,
          d.action,
          capitalize(d.category),
          d.completed ? "Done" : "Pending",
        ]),
        headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 7.5, fontStyle: "bold" },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59], cellPadding: 2 },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: "auto" },
          2: { cellWidth: 22 },
          3: { cellWidth: 20 },
        },
        didParseCell: (data) => {
          if (data.column.index === 3 && data.section === "body") {
            data.cell.styles.textColor = String(data.cell.raw) === "Done" ? [22, 163, 74] : [234, 88, 12];
          }
        },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    } else {
      y += 4;
    }
  }

  // ── Pending Requests page (if any) ───────────────────────────────────────
  if (pendingRequests.length > 0) {
    doc.addPage();
    drawHeader(doc, "Pending Help Requests");
    y = 36;
    y = drawSection(doc, `${pendingRequests.length} Pending Request${pendingRequests.length !== 1 ? "s" : ""}`, y);

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Name", "Description", "Location", "Need", "Urgency", "Submitted"]],
      body: pendingRequests.map(r => [
        r.name,
        r.description,
        r.location,
        capitalize(r.needCategory),
        urgencyLabel(r.urgency),
        formatDate(r.createdAt),
      ]),
      headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 2.5 },
      alternateRowStyles: { fillColor: LIGHT },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 30 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18 },
        5: { cellWidth: 22 },
      },
    });
  }

  // Footer on all pages
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  const date = new Date().toISOString().slice(0, 10);
  doc.save(`love-storm-summary-${date}.pdf`);
}
