import XLSX from 'xlsx';
import fs from 'node:fs';
const emailRe = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/i;
const clean = v => String(v ?? '').trim();
export const normalizeEmail = v => clean(v).toLowerCase();
export function parseContacts(filePath) {
  if (!fs.existsSync(filePath)) throw new Error('Upload file not found');
  const wb = XLSX.readFile(filePath, { cellDates:false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval:'' });
  const seen = new Set(), contacts = [], duplicates = [];
  for (const row of rows) {
    const email = normalizeEmail(row.email ?? row.Email ?? row.EMAIL);
    if (!emailRe.test(email)) continue;
    const c = { email, name:clean(row.name ?? row.Name), company:clean(row.company ?? row.Company), job_title:clean(row.job_title ?? row['Job Title'] ?? row.title), consent:Number(row.consent ?? row.Consent ?? 0) ? 1 : 0 };
    if (seen.has(email)) { duplicates.push(c); continue; }
    seen.add(email); contacts.push(c);
  }
  return { contacts, duplicates };
}