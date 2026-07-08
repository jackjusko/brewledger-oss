/**
 * Lists form field names in platforms/console/public/ttb.pdf
 * Run from repo root: node platforms/console/scripts/list-ttb-pdf-fields.mjs
 * Or from platforms/console: node scripts/list-ttb-pdf-fields.mjs
 */
import { PDFDocument } from 'pdf-lib'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pdfFileName = process.argv[2] || 'ttb.pdf'
const pdfPath = join(__dirname, '..', 'public', pdfFileName)
const buf = readFileSync(pdfPath)
const doc = await PDFDocument.load(buf)
const form = doc.getForm()
const fields = form.getFields()
console.log('Total fields:', fields.length)
console.log('Has XFA:', form.hasXFA?.())
fields.forEach((f, i) => {
  console.log(`${i + 1}. ${f.getName()} (${f.constructor.name})`)
})
