const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, LevelFormat, PageBreak
} = require("docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function cell(text, opts = {}) {
  const runs = Array.isArray(text)
    ? text
    : [new TextRun({ text, bold: opts.bold || false, font: "Arial", size: opts.size || 22 })];
  return new TableCell({
    borders,
    width: { size: opts.width || 4680, type: WidthType.DXA },
    margins: cellMargins,
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({ children: runs })],
  });
}

function heading(text, level) {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 200 },
    children: [new TextRun({ text, font: "Arial", bold: true })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, font: "Arial", size: 22, ...opts })],
  });
}

function bulletItem(text, reference) {
  return new Paragraph({
    numbering: { reference, level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22 })],
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: "1B4332" },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2D6A4F" },
        paragraph: { spacing: { before: 280, after: 180 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "40916C" },
        paragraph: { spacing: { before: 240, after: 140 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "phase1-bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "phase2-bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "phase3-bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    // ── TITLE PAGE ──
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        new Paragraph({ spacing: { before: 4000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Tameion", font: "Arial", size: 72, bold: true, color: "1B4332" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Automated Library Management System", font: "Arial", size: 28, color: "555555" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2D6A4F", space: 1 } },
          spacing: { after: 600 },
          children: [],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Project Status & Roadmap", font: "Arial", size: 32, color: "333333" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "June 15, 2026", font: "Arial", size: 24, color: "777777" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Prepared by: Selorm Tetteh Abotsi", font: "Arial", size: 24, color: "777777" })],
        }),
      ],
    },
    // ── MAIN CONTENT ──
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Tameion — Project Status & Roadmap", font: "Arial", size: 18, color: "999999", italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", font: "Arial", size: 18, color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "999999" }),
            ],
          })],
        }),
      },
      children: [
        // ── 1. PROJECT OVERVIEW ──
        heading("1. Project Overview", HeadingLevel.HEADING_1),
        para("Tameion is an Automated Library Management System designed to digitize and streamline library operations. It provides separate interfaces for library patrons (students, faculty, and postgraduates) and library staff (librarians and administrators)."),
        para("The system handles the core workflows of a modern academic library: user registration and authentication, book cataloging, loan management, reservation handling, and fine tracking."),

        heading("Technology Stack", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3120, 6240],
          rows: [
            new TableRow({
              children: [
                cell("Layer", { bold: true, width: 3120, shading: "D5E8D0" }),
                cell("Technology", { bold: true, width: 6240, shading: "D5E8D0" }),
              ],
            }),
            new TableRow({ children: [cell("Frontend", { width: 3120 }), cell("React 18 + TypeScript, Tailwind CSS, Vite", { width: 6240 })] }),
            new TableRow({ children: [cell("Backend", { width: 3120 }), cell("Express.js (Node 20), express-session", { width: 6240 })] }),
            new TableRow({ children: [cell("Database", { width: 3120 }), cell("PostgreSQL 14+", { width: 6240 })] }),
            new TableRow({ children: [cell("Auth", { width: 3120 }), cell("bcrypt password hashing, server-side sessions (connect-pg-simple)", { width: 6240 })] }),
            new TableRow({ children: [cell("DevOps", { width: 3120 }), cell("Docker Compose (multi-container: db, server, client)", { width: 6240 })] }),
          ],
        }),

        // ── 2. WHAT HAS BEEN BUILT ──
        heading("2. What Has Been Built (Current State)", HeadingLevel.HEADING_1),
        para("The foundation of Tameion is complete. The following modules are implemented and functional:"),

        heading("2.1 Database Schema", HeadingLevel.HEADING_2),
        para("A full relational schema is in place covering seven core tables:"),
        bulletItem("branch_libraries — physical library locations with college and campus info", "bullets"),
        bulletItem("members — patrons with unique IDs, role (student/faculty/postgraduate), programme, and hashed credentials", "bullets"),
        bulletItem("staff — librarians and admins linked to a branch, with separate credentials", "bullets"),
        bulletItem("books — catalog entries with ISBN, title, author, genre, shelf location, and copy tracking (total vs. available)", "bullets"),
        bulletItem("loan_transactions — checkout/due/return dates and status tracking (active, returned, overdue)", "bullets"),
        bulletItem("reservations — hold requests with expiry dates and status (pending, fulfilled, expired)", "bullets"),
        bulletItem("fine_accounts and fine_transactions — per-member balance tracking with per-loan fine line items", "bullets"),
        para("The schema also includes a session table for persistent server-side sessions via connect-pg-simple."),

        heading("2.2 Authentication System", HeadingLevel.HEADING_2),
        para("A working session-based authentication system supports two login paths:"),
        bulletItem("Patron login — members authenticate with their student/staff ID and password", "phase1-bullets"),
        bulletItem("Staff login — librarians authenticate with their staff ID and password", "phase1-bullets"),
        bulletItem("Registration — new patrons can self-register with their ID, name, email, user type, and password", "phase1-bullets"),
        para("Passwords are hashed with bcrypt (cost factor 12). Sessions are stored in PostgreSQL and persist across server restarts."),

        heading("2.3 Patron Dashboard & Pages", HeadingLevel.HEADING_2),
        para("Authenticated patrons see a full dashboard with real-time data:"),
        bulletItem("Dashboard — summary cards showing total borrowed, currently on loan, overdue count, and fine balance; active loans table; pending reservations list", "phase2-bullets"),
        bulletItem("Loans page — full borrowing history with checkout date, due date, return date, and status badges", "phase2-bullets"),
        bulletItem("Fines page — outstanding balance display with a detailed breakdown table (book, days overdue, rate, amount, settlement status)", "phase2-bullets"),
        para("All pages are protected by a route guard that checks the session and redirects unauthenticated users to the login page."),

        heading("2.4 API Endpoints", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2200, 3580, 3580],
          rows: [
            new TableRow({
              children: [
                cell("Method", { bold: true, width: 2200, shading: "D5E8D0" }),
                cell("Endpoint", { bold: true, width: 3580, shading: "D5E8D0" }),
                cell("Purpose", { bold: true, width: 3580, shading: "D5E8D0" }),
              ],
            }),
            new TableRow({ children: [cell("POST", { width: 2200 }), cell("/api/auth/register", { width: 3580 }), cell("Register a new patron", { width: 3580 })] }),
            new TableRow({ children: [cell("POST", { width: 2200 }), cell("/api/auth/login", { width: 3580 }), cell("Authenticate and create session", { width: 3580 })] }),
            new TableRow({ children: [cell("POST", { width: 2200 }), cell("/api/auth/logout", { width: 3580 }), cell("Destroy session", { width: 3580 })] }),
            new TableRow({ children: [cell("GET", { width: 2200 }), cell("/api/auth/me", { width: 3580 }), cell("Get current user info", { width: 3580 })] }),
            new TableRow({ children: [cell("GET", { width: 2200 }), cell("/api/patron/dashboard", { width: 3580 }), cell("Dashboard summary data", { width: 3580 })] }),
            new TableRow({ children: [cell("GET", { width: 2200 }), cell("/api/patron/loans", { width: 3580 }), cell("Borrowing history", { width: 3580 })] }),
            new TableRow({ children: [cell("GET", { width: 2200 }), cell("/api/patron/fines", { width: 3580 }), cell("Fine account and transactions", { width: 3580 })] }),
            new TableRow({ children: [cell("GET", { width: 2200 }), cell("/api/patron/reservations", { width: 3580 }), cell("Reservation list", { width: 3580 })] }),
          ],
        }),

        heading("2.5 Infrastructure", HeadingLevel.HEADING_2),
        para("The entire stack runs with a single docker compose up --build command. Docker Compose orchestrates three services: PostgreSQL (with automatic schema and seed execution), the Express API server, and the Vite dev server for the React frontend. Seed data includes test accounts for each role with pre-existing loans, fines, and reservations for immediate testing."),

        // ── PAGE BREAK ──
        new Paragraph({ children: [new PageBreak()] }),

        // ── 3. ROADMAP ──
        heading("3. Roadmap: What We Will Build Next", HeadingLevel.HEADING_1),
        para("Development will proceed in three phases, each building on the previous:"),

        heading("Phase 1: Book Catalog & Search", HeadingLevel.HEADING_2),
        para("This phase makes the library’s collection browsable and searchable for all users."),

        heading("What it entails:", HeadingLevel.HEADING_3),
        bulletItem("Public book catalog page — a browsable grid/list view of all books in the system, accessible without login", "phase1-bullets"),
        bulletItem("Full-text search — search by title, author, ISBN, or genre with instant results", "phase1-bullets"),
        bulletItem("Filters and sorting — filter by genre, branch library, and availability; sort by title, author, or date added", "phase1-bullets"),
        bulletItem("Book detail page — view full metadata (publisher, shelf location, branch), availability status, and a reserve button for authenticated patrons", "phase1-bullets"),
        bulletItem("Reservation flow — patrons can place a hold on an available book, which creates a reservation record with an expiry window", "phase1-bullets"),

        heading("API additions:", HeadingLevel.HEADING_3),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2200, 3580, 3580],
          rows: [
            new TableRow({
              children: [
                cell("Method", { bold: true, width: 2200, shading: "D5E8D0" }),
                cell("Endpoint", { bold: true, width: 3580, shading: "D5E8D0" }),
                cell("Purpose", { bold: true, width: 3580, shading: "D5E8D0" }),
              ],
            }),
            new TableRow({ children: [cell("GET", { width: 2200 }), cell("/api/books", { width: 3580 }), cell("List/search books with filters", { width: 3580 })] }),
            new TableRow({ children: [cell("GET", { width: 2200 }), cell("/api/books/:isbn", { width: 3580 }), cell("Single book detail", { width: 3580 })] }),
            new TableRow({ children: [cell("POST", { width: 2200 }), cell("/api/patron/reservations", { width: 3580 }), cell("Place a hold on a book", { width: 3580 })] }),
          ],
        }),

        new Paragraph({ spacing: { after: 200 } }),

        heading("Phase 2: Admin Dashboard & CRUD Management Layer", HeadingLevel.HEADING_2),
        para("This phase builds the staff-facing side of Tameion, giving librarians full control over library operations."),

        heading("What it entails:", HeadingLevel.HEADING_3),
        bulletItem("Admin dashboard — at-a-glance stats: total members, active loans, overdue items, total fines collected, books by branch", "phase2-bullets"),
        bulletItem("Member management — view, search, edit, and deactivate patron accounts; view a member’s loan and fine history", "phase2-bullets"),
        bulletItem("Book management — full CRUD for the book catalog: add new titles, update metadata, adjust copy counts, remove books", "phase2-bullets"),
        bulletItem("Loan management — check out books to patrons, process returns, mark overdue items, extend due dates", "phase2-bullets"),
        bulletItem("Fine management — view outstanding fines across all patrons, record payments, waive fines, auto-calculate overdue charges", "phase2-bullets"),
        bulletItem("Reservation management — view pending reservations, fulfill them (convert to a loan), expire stale holds", "phase2-bullets"),
        bulletItem("Branch management — add/edit branch library locations", "phase2-bullets"),
        bulletItem("Staff management — admin-only ability to create new staff accounts and assign roles/branches", "phase2-bullets"),

        heading("API additions:", HeadingLevel.HEADING_3),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2200, 3580, 3580],
          rows: [
            new TableRow({
              children: [
                cell("Method", { bold: true, width: 2200, shading: "D5E8D0" }),
                cell("Endpoint", { bold: true, width: 3580, shading: "D5E8D0" }),
                cell("Purpose", { bold: true, width: 3580, shading: "D5E8D0" }),
              ],
            }),
            new TableRow({ children: [cell("GET", { width: 2200 }), cell("/api/admin/dashboard", { width: 3580 }), cell("Staff dashboard stats", { width: 3580 })] }),
            new TableRow({ children: [cell("CRUD", { width: 2200 }), cell("/api/admin/members", { width: 3580 }), cell("Member management", { width: 3580 })] }),
            new TableRow({ children: [cell("CRUD", { width: 2200 }), cell("/api/admin/books", { width: 3580 }), cell("Book catalog management", { width: 3580 })] }),
            new TableRow({ children: [cell("POST", { width: 2200 }), cell("/api/admin/loans/checkout", { width: 3580 }), cell("Issue a book to a patron", { width: 3580 })] }),
            new TableRow({ children: [cell("POST", { width: 2200 }), cell("/api/admin/loans/:id/return", { width: 3580 }), cell("Process a book return", { width: 3580 })] }),
            new TableRow({ children: [cell("POST", { width: 2200 }), cell("/api/admin/fines/:id/pay", { width: 3580 }), cell("Record a fine payment", { width: 3580 })] }),
            new TableRow({ children: [cell("CRUD", { width: 2200 }), cell("/api/admin/branches", { width: 3580 }), cell("Branch management", { width: 3580 })] }),
          ],
        }),

        new Paragraph({ spacing: { after: 200 } }),

        heading("Phase 3: Authentication Hardening", HeadingLevel.HEADING_2),
        para("This phase strengthens security and improves the authentication user experience."),

        heading("What it entails:", HeadingLevel.HEADING_3),
        bulletItem("Password reset flow — email-based password reset with time-limited tokens; requires integrating an email service (e.g., Nodemailer with SMTP or a provider like SendGrid)", "phase3-bullets"),
        bulletItem("Email verification — new accounts must verify their email address before gaining full access; verification link sent at registration", "phase3-bullets"),
        bulletItem("Role-based access control refinement — middleware-level enforcement ensuring patrons cannot access admin routes and vice versa; granular permissions (e.g., only admins can create staff accounts)", "phase3-bullets"),
        bulletItem("Session security improvements — CSRF protection, secure cookie flags for production (Secure, SameSite=Strict), session rotation on login to prevent fixation attacks", "phase3-bullets"),
        bulletItem("Rate limiting — throttle login attempts to prevent brute-force attacks", "phase3-bullets"),
        bulletItem("Password policy — enforce minimum length, complexity requirements, and prevent reuse of recent passwords", "phase3-bullets"),

        // ── 4. SUMMARY ──
        heading("4. Summary", HeadingLevel.HEADING_1),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2340, 4680, 2340],
          rows: [
            new TableRow({
              children: [
                cell("Phase", { bold: true, width: 2340, shading: "1B4332", size: 22 }),
                cell("Scope", { bold: true, width: 4680, shading: "1B4332", size: 22 }),
                cell("Status", { bold: true, width: 2340, shading: "1B4332", size: 22 }),
              ].map((c, i) => {
                // Recreate with white text for header
                return new TableCell({
                  borders,
                  width: { size: [2340, 4680, 2340][i], type: WidthType.DXA },
                  margins: cellMargins,
                  shading: { fill: "1B4332", type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: ["Phase", "Scope", "Status"][i], font: "Arial", size: 22, bold: true, color: "FFFFFF" })] })],
                });
              }),
            }),
            new TableRow({
              children: [
                cell("Foundation", { width: 2340 }),
                cell("Auth, patron dashboard, loans, fines, Docker setup, TypeScript migration", { width: 4680 }),
                cell([new TextRun({ text: "Complete", font: "Arial", size: 22, bold: true, color: "2D6A4F" })], { width: 2340 }),
              ],
            }),
            new TableRow({
              children: [
                cell("Phase 1", { width: 2340 }),
                cell("Book catalog, search, filtering, reservation flow", { width: 4680 }),
                cell([new TextRun({ text: "Up Next", font: "Arial", size: 22, bold: true, color: "E07A00" })], { width: 2340 }),
              ],
            }),
            new TableRow({
              children: [
                cell("Phase 2", { width: 2340 }),
                cell("Admin dashboard, full CRUD for books/members/loans/fines/branches/staff", { width: 4680 }),
                cell([new TextRun({ text: "Planned", font: "Arial", size: 22, color: "777777" })], { width: 2340 }),
              ],
            }),
            new TableRow({
              children: [
                cell("Phase 3", { width: 2340 }),
                cell("Password reset, email verification, RBAC, CSRF, rate limiting, password policy", { width: 4680 }),
                cell([new TextRun({ text: "Planned", font: "Arial", size: 22, color: "777777" })], { width: 2340 }),
              ],
            }),
          ],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("Tameion_Project_Status.docx", buffer);
  console.log("Created Tameion_Project_Status.docx");
});
