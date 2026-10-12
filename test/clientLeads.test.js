// Tenant isolation + CRUD for the multi-tenant client lead console.
// The whole product promise is that one client can never see or change
// another client's data — these tests lock that down.

const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");

// Use a throwaway DB file so the test never touches the dev database.
process.env.DB_FILE = path.join(os.tmpdir(), `cm-clientleads-test-${crypto.randomUUID()}.db`);

const test = require("node:test");
const assert = require("node:assert");
const cl = require("../server/clientLeads");

const A = "acct-A";
const B = "acct-B";

test("createLead requires a name", () => {
  const r = cl.createLead(A, { name: "   " });
  assert.ok(r.error, "empty name should be rejected");
});

test("create + list is scoped to the owning account", () => {
  const a1 = cl.createLead(A, { name: "מרכז צעירים A", email: "a@x.org" });
  const a2 = cl.createLead(A, { name: "מועצת נוער A" });
  const b1 = cl.createLead(B, { name: "ליד של B", email: "b@y.org" });
  assert.ok(a1.lead && a2.lead && b1.lead);

  const listA = cl.listLeads(A);
  const listB = cl.listLeads(B);
  assert.strictEqual(listA.length, 2, "A sees only its two leads");
  assert.strictEqual(listB.length, 1, "B sees only its one lead");
  assert.ok(listA.every((l) => l.name.includes("A")));
});

test("one account cannot read another's lead", () => {
  const b = cl.createLead(B, { name: "סודי של B" }).lead;
  assert.strictEqual(cl.getLead(A, b.id), null, "A must not read B's lead");
  assert.ok(cl.getLead(B, b.id), "B reads its own lead");
});

test("one account cannot update or delete another's lead", () => {
  const b = cl.createLead(B, { name: "לעדכון" }).lead;
  const up = cl.updateLead(A, b.id, { name: "נחטף" });
  assert.ok(up.error, "cross-tenant update must fail");
  const del = cl.deleteLead(A, b.id);
  assert.ok(del.error, "cross-tenant delete must fail");
  // B's lead is untouched
  assert.strictEqual(cl.getLead(B, b.id).name, "לעדכון");
});

test("owner can update own lead fields (incl. camelCase sourceUrl)", () => {
  const l = cl.createLead(A, { name: "לעריכה" }).lead;
  const r = cl.updateLead(A, l.id, { email: "new@x.org", subject: "נושא", body: "גוף", sourceUrl: "https://x.org" });
  assert.strictEqual(r.lead.email, "new@x.org");
  assert.strictEqual(r.lead.subject, "נושא");
  assert.strictEqual(r.lead.sourceUrl, "https://x.org");
});

test("markSent flips status and stamps sentAt", () => {
  const l = cl.createLead(A, { name: "לשליחה", email: "z@x.org" }).lead;
  const r = cl.markSent(A, l.id, "2026-10-12T10:00:00Z");
  assert.strictEqual(r.lead.status, "sent");
  assert.strictEqual(r.lead.sentAt, "2026-10-12T10:00:00Z");
});

test("stats counts ready / needEmail / sent per tenant", () => {
  const acct = "acct-stats";
  cl.createLead(acct, { name: "עם מייל", email: "a@x.org" });
  cl.createLead(acct, { name: "בלי מייל" });
  const sent = cl.createLead(acct, { name: "נשלח", email: "c@x.org" }).lead;
  cl.markSent(acct, sent.id);
  const s = cl.stats(acct);
  assert.strictEqual(s.total, 3);
  assert.strictEqual(s.ready, 1);
  assert.strictEqual(s.needEmail, 1);
  assert.strictEqual(s.sent, 1);
});
