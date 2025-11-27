const fs = require('fs');
const crypto = require('crypto');
const pdfParse = require("pdf-parse");
const path = require('path');
const pdfjsLib = require("pdfjs-dist/build/pdf.js");


const AES_KEY =
  process.env.FILE_ENCRYPTION_KEY ||
  "32_byte_min_secret_here________"; // must be 32 bytes

const IV_LENGTH = 16;

/* HASH */
function sha256File(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/* ENCRYPT */
function encryptFile(inputPath, outputPath) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(AES_KEY),
    iv
  );
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  output.write(iv);

  return new Promise((resolve, reject) => {
    input.pipe(cipher).pipe(output)
      .on('finish', () => resolve(true))
      .on('error', reject);
  });
}

/* DECRYPT */
function decryptFile(encryptedPath, outputPath) {
  const iv = Buffer.alloc(IV_LENGTH);

  return new Promise((resolve, reject) => {
    const handle = fs.openSync(encryptedPath, 'r');
    fs.read(handle, iv, 0, IV_LENGTH, 0, (err) => {
      if (err) return reject(err);

      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(AES_KEY),
        iv
      );

      const input = fs.createReadStream(encryptedPath, { start: IV_LENGTH });
      const output = fs.createWriteStream(outputPath);

      input.pipe(decipher).pipe(output)
        .on('finish', () => resolve(true))
        .on('error', reject);
    });
  });
}

/* PDF-PARSE */
async function extractTextFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || '';
}

/* PDF.js FALLBACK */
async function extractTextWithPdfjs(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument({ data });
  const doc = await loadingTask.promise;

  let fullText = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(it => it.str).join(" ") + "\n";
  }
  return fullText;
}

/* REDACTION */
function redactSensitive(text) {
  if (!text) return '';

  return text
    .replace(/\b\d{4}\s\d{4}\s\d{4}\b/g, "[REDACTED_AADHAAR]")
    .replace(/[A-Z]{5}\d{4}[A-Z]/gi, "[REDACTED_PAN]")
    .replace(/\b\d{10}\b/g, "[REDACTED_PHONE]")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]");
}

/* STRICT LEGAL DOCUMENT VALIDATION */
function deterministicChecks(text) {
  const t = text.toLowerCase();

  if (!t || t.length < 80) {
    return { result: "not_legal", reasons: ["Document too short"] };
  }

  const govtIdPatterns = [
    /\b\d{4}\s\d{4}\s\d{4}\b/,            // Aadhaar
    /[A-Z]{5}\d{4}[A-Z]/,                // PAN
    /\b[A-Z]{2}\d{2}\s?\d{11}\b/,        // Driving License
    /\b[A-Z]{2}\d{2}[A-Z]{2}\d{4}\b/     // Vehicle RC
  ];

  const isGovtId = govtIdPatterns.some((r) => r.test(t));
  if (isGovtId) return { result: "legal", reasons: ["Government-issued ID"] };

  const courtHeaders = [
    "in the court of",
    "before the",
    "high court",
    "district court",
    "sessions court",
    "metropolitan magistrate",
    "civil judge",
    "judicial magistrate"
  ];

  const legalKeywords = [
    "plaintiff",
    "defendant",
    "petitioner",
    "respondent",
    "affidavit",
    "petition",
    "writ",
    "fir no",
    "case no",
    "cnr no",
    "summons",
    "notice",
    "order",
    "judgment",
    "judgement",
    "chargesheet",
    "section",
    "u/s",
    "act",
    "registry",
    "hearing"
  ];

  const forbidden = [
    "syllabus",
    "unit",
    "module",
    "assignment",
    "project report",
    "startup",
    "company profile",
    "vision",
    "mission",
    "marketing",
    "newsletter",
    "research",
    "analysis",
    "overview",
    "whitepaper"
  ];

  if (forbidden.some(w => t.includes(w))) {
    return { result: "not_legal", reasons: ["Non-legal content detected"] };
  }

  let headerHits = courtHeaders.filter(h => t.includes(h)).length;
  let keywordHits = legalKeywords.filter(k => t.includes(k)).length;

  if (headerHits >= 1 || keywordHits >= 4) {
    return {
      result: "legal",
      reasons: [`headerHits=${headerHits}`, `keywordHits=${keywordHits}`]
    };
  }

  return { result: "not_legal", reasons: ["Does not match any legal format"] };
}

/* EXPORT */
module.exports = {
  sha256File,
  encryptFile,
  decryptFile,
  extractTextFromPDF,
  extractTextWithPdfjs,
  redactSensitive,
  deterministicChecks
};
