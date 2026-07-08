/**
 * Lists fillable form fields in a PDF (AcroForm).
 * Usage: node scripts/list-pdf-form-fields.mjs [path/to/file.pdf]
 *        If no path is given, uses assorted/ttb editable.pdf (repo root).
 * Requires: pdf-lib
 */
import { PDFDocument } from 'pdf-lib'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultPdf = join(__dirname, '..', '..', '..', 'assorted', 'brewledger-ttb.pdf')
const pdfPath = process.argv[2] || defaultPdf

const buf = readFileSync(pdfPath)
const doc = await PDFDocument.load(buf)
const form = doc.getForm()
const fields = form.getFields()

const list = fields.map((f, i) => ({
  index: i + 1,
  name: f.getName(),
  type: f.constructor.name.replace(/^PDF/, '').replace(/([A-Z])/g, ' $1').trim() // e.g. "Text Field", "Check Box"
}))

console.log('Total fillable fields:', list.length)
console.log('Has XFA:', form.hasXFA?.() ?? false)
console.log('')
list.forEach(({ index, name, type }) => {
  console.log(`${index}. ${name} (${type})`)
})

// Also output JSON array for piping / programmatic use
if (process.argv.includes('--json')) {
  console.log('\n--- JSON ---')
  console.log(JSON.stringify(list, null, 2))
}
