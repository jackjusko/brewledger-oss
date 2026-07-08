/**
 * TTB PDF Export Service
 * Handles exporting TTB Form 5130.9 data to a fillable PDF
 */

import { PDFDocument, StandardFonts } from 'pdf-lib'
import { BreweryInfoService } from './BreweryInfoService'

/**
 * Format a number to 2 decimal places for TTB form
 */
function formatBarrels(value) {
  if (value === null || value === undefined || isNaN(value)) return '0.00'
  const n = Number(value)
  // Clamp to non-negative for PDF (avoid negative display from any calculation bug)
  const clamped = n < 0 ? 0 : n
  return clamped.toFixed(2)
}

/**
 * Format period string for PDF
 */
function formatPeriod(header) {
  if (!header) return ''
  if (header.reportType === 'monthly') {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December']
    return months[Math.max(0, (header.period || 1) - 1)] ?? ''
  }
  const quarters = ['January - March', 'April - June', 'July - September', 'October - December']
  return quarters[Math.max(0, (header.period || 1) - 1)] ?? ''
}

/**
 * Load the TTB PDF template
 * Uses ttb-final.pdf which contains fillable form fields with mapped names
 */
async function loadTTBTemplate() {
  try {
    // Try to load from public folder (Vite serves public folder at root)
    const response = await fetch('/ttb-final.pdf')
    if (!response.ok) {
      // Try alternative path
      const altResponse = await fetch('/public/ttb-final.pdf')
      if (!altResponse.ok) {
        throw new Error('TTB PDF template not found at /ttb-final.pdf or /public/ttb-final.pdf')
      }
      const arrayBuffer = await altResponse.arrayBuffer()
      return await PDFDocument.load(arrayBuffer)
    }
    const arrayBuffer = await response.arrayBuffer()
    return await PDFDocument.load(arrayBuffer)
  } catch (error) {
    console.error('Failed to load TTB template:', error)
    throw new Error('TTB PDF template is required. Please ensure ttb-final.pdf is in platforms/console/public/ttb-final.pdf')
  }
}

/**
 * Map logical keys to actual PDF form field names in ttb-final.pdf
 * Field names match exactly what's in the fillable PDF template
 */
function getFormFieldNameVariants() {
  return {
    // Header fields (exact names from ttb-final.pdf)
    breweryEIN: ['EIN'],
    ttbBreweryNumber: ['brew number'],
    breweryPhone: ['brewery phone number'],
    breweryName: ['brewery name'],
    breweryStreet: ['brewery address, number + street'],
    breweryCity: ['brewery city'],
    breweryCounty: ['brewery county'],
    breweryState: ['brewery state'],
    breweryZip: ['brewery zip'],
    reportYear: ['reporting period year'],
    reportMonth: ['name of reporting month'],
    // Quarter checkboxes
    q1Checkbox: ['Q1 checkbox'],
    q2Checkbox: ['Q2 Checkbox'],
    q3Checkbox: ['Q3 Checkbox'],
    q4Checkbox: ['Q4 Checkbox'],
    // Line fields - using exact field names from ttb-final.pdf
    // Note: Many lines don't have column (a) fields in this PDF template
    // Line 2: 2b, 2g
    line2b: ['2b'], line2g: ['2g'],
    // Line 3: 3b, 3g
    line3b: ['3b'], line3g: ['3g'],
    // Line 4: 4b, 4g
    line4b: ['4b'], line4g: ['4g'],
    // Line 5: 5b, 5d, 5f, 5g
    line5b: ['5b'], line5d: ['5d'], line5f: ['5f'], line5g: ['5g'],
    // Line 6: 6c, 6e, 6g
    line6c: ['6c'], line6e: ['6e'], line6g: ['6g'],
    // Line 7: 7b, 7d, 7f, 7g
    line7b: ['7b'], line7d: ['7d'], line7f: ['7f'], line7g: ['7g'],
    // Line 8: 8b, 8d, 8f, 8g
    line8b: ['8b'], line8d: ['8d'], line8f: ['8f'], line8g: ['8g'],
    // Line 9: 9d, 9g
    line9d: ['9d'], line9g: ['9g'],
    // Line 10: 10f, 10g
    line10f: ['10f'], line10g: ['10g'],
    // Line 11: 11b, 11c, 11d, 11e, 11f, 11g
    line11b: ['11b'], line11c: ['11c'], line11d: ['11d'], line11e: ['11e'], line11f: ['11f'], line11g: ['11g'],
    // Line 12/13: 12/13b, 12/13c, 12/13d, 12/13e, 12/13f, 12/13g
    line12_13b: ['12/13b'], line12_13c: ['12/13c'], line12_13d: ['12/13d'], line12_13e: ['12/13e'], line12_13f: ['12/13f'], line12_13g: ['12/13g'],
    // Line 14: 14d, 14f, 14g
    line14d: ['14d'], line14f: ['14f'], line14g: ['14g'],
    // Line 15/16: 15/16b, 15/16d, 15/16f, 15/16g
    line15_16b: ['15/16b'], line15_16d: ['15/16d'], line15_16f: ['15/16f'], line15_16g: ['15/16g'],
    // Line 17: 17d, 17f, 17g
    line17d: ['17d'], line17f: ['17f'], line17g: ['17g'],
    // Line 18: 18b, 18d, 18f, 18g
    line18b: ['18b'], line18d: ['18d'], line18f: ['18f'], line18g: ['18g'],
    // Line 19: 19b, 19d, 19f, 19g
    line19b: ['19b'], line19d: ['19d'], line19f: ['19f'], line19g: ['19g'],
    // Line 20: 20b, 20g
    line20b: ['20b'], line20g: ['20g'],
    // Line 21: 21b, 21d, 21f, 21g
    line21b: ['21b'], line21d: ['21d'], line21f: ['21f'], line21g: ['21g'],
    // Line 22: 22b, 22g
    line22b: ['22b'], line22g: ['22g'],
    // Line 23: 23b, 23g
    line23b: ['23b'], line23g: ['23g'],
    // Line 24: 24c, 24e, 24g
    line24c: ['24c'], line24e: ['24e'], line24g: ['24g'],
    // Line 25: 25c, 25g
    line25c: ['25c'], line25g: ['25g'],
    // Line 26: 26e, 26g
    line26e: ['26e'], line26g: ['26g'],
    // Line 27: 27b, 27c, 27d, 27e, 27f, 27g
    line27b: ['27b'], line27c: ['27c'], line27d: ['27d'], line27e: ['27e'], line27f: ['27f'], line27g: ['27g'],
    // Line 28: 28b, 28c, 28d, 28e, 28f, 28g
    line28b: ['28b'], line28c: ['28c'], line28d: ['28d'], line28e: ['28e'], line28f: ['28f'], line28g: ['28g'],
    // Line 29: 29b, 29c, 29d, 29e, 29f, 29g
    line29b: ['29b'], line29c: ['29c'], line29d: ['29d'], line29e: ['29e'], line29f: ['29f'], line29g: ['29g'],
    // Line 30: 30b, 30c, 30d, 30e, 30f, 30g
    line30b: ['30b'], line30c: ['30c'], line30d: ['30d'], line30e: ['30e'], line30f: ['30f'], line30g: ['30g'],
    // Line 31: 31b, 31c, 31d, 31e, 31f, 31g
    line31b: ['31b'], line31c: ['31c'], line31d: ['31d'], line31e: ['31e'], line31f: ['31f'], line31g: ['31g'],
    // Line 33: 33b, 33c, 33d, 33e, 33f, 33g (no 33a in PDF)
    line33b: ['33b'], line33c: ['33c'], line33d: ['33d'], line33e: ['33e'], line33f: ['33f'], line33g: ['33g'],
    // Line 34: 34b, 34c, 34d, 34e, 34f, 34g (no 34a in PDF)
    line34b: ['34b'], line34c: ['34c'], line34d: ['34d'], line34e: ['34e'], line34f: ['34f'], line34g: ['34g'],
    // Additional fields
    remarks: ['remarks'],
    sig: ['sig'],
    title: ['title'],
    date: ['date']
  }
}


/**
 * Fill PDF form with calculated data.
 * Uses field name variants so templates with different naming (e.g. "1a" vs "line_1_a") still get filled.
 * If the PDF has no fillable fields or different names, logs actual field names to console for debugging.
 */
async function fillPDFForm(pdfDoc, formData, breweryInfo) {
  const form = pdfDoc.getForm()
  const variants = getFormFieldNameVariants()

  // Use getTextField in try/catch for each candidate name (pdf-lib requires getTextField to set text)
  function setText(key, value) {
    const names = variants[key]
    if (!names) return false
    const str = value !== undefined && value !== null ? String(value) : ''
    for (const name of names) {
      try {
        form.getTextField(name).setText(str)
        return true
      } catch (_) {}
    }
    return false
  }

  function checkBox(key) {
    const names = variants[key]
    if (!names) return false
    for (const name of names) {
      try {
        form.getCheckBox(name).check()
        return true
      } catch (_) {}
    }
    return false
  }

  let filled = 0

  const columns = formData?.columnsByLine || {}

  const setColumns = (cols, fields) => {
    if (!cols || !fields) return
    const mapAndSet = (colKey, variantKey) => {
      if (!variantKey) return
      if (cols[colKey] === undefined || cols[colKey] === null) return
      if (setText(variantKey, formatBarrels(cols[colKey]))) filled++
    }
    mapAndSet('b', fields.b)
    mapAndSet('c', fields.c)
    mapAndSet('d', fields.d)
    mapAndSet('e', fields.e)
    mapAndSet('f', fields.f)
    mapAndSet('g', fields.g)
  }

  const mergeColumns = (lineKeys) => {
    const merged = { b: 0, c: 0, d: 0, e: 0, f: 0, g: 0 }
    for (const key of lineKeys) {
      const cols = columns[key]
      if (!cols) continue
      merged.b += Number(cols.b || 0)
      merged.c += Number(cols.c || 0)
      merged.d += Number(cols.d || 0)
      merged.e += Number(cols.e || 0)
      merged.f += Number(cols.f || 0)
      merged.g += Number(cols.g || cols.a || 0)
    }
    return merged
  }

  // Header fields - map brewery info to PDF field names
  if (breweryInfo.brewery_name && setText('breweryName', breweryInfo.brewery_name)) filled++
  if (breweryInfo.brewery_ein && setText('breweryEIN', breweryInfo.brewery_ein)) filled++
  if (breweryInfo.ttb_brewery_number && setText('ttbBreweryNumber', breweryInfo.ttb_brewery_number)) filled++
  if (breweryInfo.brewery_phone && setText('breweryPhone', breweryInfo.brewery_phone)) filled++
  if (breweryInfo.brewery_address_street && setText('breweryStreet', breweryInfo.brewery_address_street)) filled++
  if (breweryInfo.brewery_address_city && setText('breweryCity', breweryInfo.brewery_address_city)) filled++
  if (breweryInfo.brewery_address_county && setText('breweryCounty', breweryInfo.brewery_address_county)) filled++
  if (breweryInfo.brewery_address_state && setText('breweryState', breweryInfo.brewery_address_state)) filled++
  if (breweryInfo.brewery_address_zip && setText('breweryZip', breweryInfo.brewery_address_zip)) filled++
  
  const header = formData?.header || {}
  if (setText('reportYear', header.year)) filled++
  
  // Period selection (monthly vs quarterly)
  if (header.reportType === 'monthly') {
    if (setText('reportMonth', formatPeriod(header))) filled++
    // Monthly reports don't use quarter checkboxes
  } else {
    // Quarterly: check the appropriate quarter checkbox (Q1-Q4)
    const quarter = header.period || 1
    if (quarter === 1 && checkBox('q1Checkbox')) filled++
    if (quarter === 2 && checkBox('q2Checkbox')) filled++
    if (quarter === 3 && checkBox('q3Checkbox')) filled++
    if (quarter === 4 && checkBox('q4Checkbox')) filled++
  }

  // Line data mapping
  setColumns(columns.line2, { b: 'line2b', g: 'line2g' })
  setColumns(columns.line3, { b: 'line3b', g: 'line3g' })
  setColumns(columns.line4, { b: 'line4b', g: 'line4g' })
  setColumns(columns.line5, { b: 'line5b', d: 'line5d', f: 'line5f', g: 'line5g' })
  setColumns(columns.line6, { c: 'line6c', e: 'line6e', g: 'line6g' })
  setColumns(columns.line7, { b: 'line7b', d: 'line7d', f: 'line7f', g: 'line7g' })
  setColumns(columns.line8, { b: 'line8b', d: 'line8d', f: 'line8f', g: 'line8g' })
  setColumns(columns.line9, { d: 'line9d', g: 'line9g' })
  setColumns(columns.line10, { f: 'line10f', g: 'line10g' })
  setColumns(columns.line11, { b: 'line11b', c: 'line11c', d: 'line11d', e: 'line11e', f: 'line11f', g: 'line11g' })
  // PDF has combined 12/13 fields; fill with Line 13 totals to reflect additions sum
  setColumns(columns.line13, { b: 'line12_13b', c: 'line12_13c', d: 'line12_13d', e: 'line12_13e', f: 'line12_13f', g: 'line12_13g' })
  setColumns(columns.line14, { d: 'line14d', f: 'line14f', g: 'line14g' })
  setColumns(mergeColumns(['line15', 'line16']), { b: 'line15_16b', d: 'line15_16d', f: 'line15_16f', g: 'line15_16g' })
  setColumns(columns.line17, { d: 'line17d', f: 'line17f', g: 'line17g' })
  setColumns(columns.line18, { b: 'line18b', d: 'line18d', f: 'line18f', g: 'line18g' })
  setColumns(columns.line19, { b: 'line19b', d: 'line19d', f: 'line19f', g: 'line19g' })
  setColumns(columns.line20, { b: 'line20b', g: 'line20g' })
  setColumns(columns.line21, { b: 'line21b', d: 'line21d', f: 'line21f', g: 'line21g' })
  setColumns(columns.line22, { b: 'line22b', g: 'line22g' })
  setColumns(columns.line23, { b: 'line23b', g: 'line23g' })
  setColumns(columns.line24, { c: 'line24c', e: 'line24e', g: 'line24g' })
  setColumns(columns.line25, { c: 'line25c', g: 'line25g' })
  setColumns(columns.line26, { e: 'line26e', g: 'line26g' })
  setColumns(columns.line27, { b: 'line27b', c: 'line27c', d: 'line27d', e: 'line27e', f: 'line27f', g: 'line27g' })
  setColumns(columns.line28, { b: 'line28b', c: 'line28c', d: 'line28d', e: 'line28e', f: 'line28f', g: 'line28g' })
  setColumns(columns.line29, { b: 'line29b', c: 'line29c', d: 'line29d', e: 'line29e', f: 'line29f', g: 'line29g' })
  setColumns(columns.line30, { b: 'line30b', c: 'line30c', d: 'line30d', e: 'line30e', f: 'line30f', g: 'line30g' })
  setColumns(columns.line31, { b: 'line31b', c: 'line31c', d: 'line31d', e: 'line31e', f: 'line31f', g: 'line31g' })
  setColumns(columns.line33, { b: 'line33b', c: 'line33c', d: 'line33d', e: 'line33e', f: 'line33f', g: 'line33g' })
  setColumns(columns.line34, { b: 'line34b', c: 'line34c', d: 'line34d', e: 'line34e', f: 'line34f', g: 'line34g' })
  
  // Remarks field
  if (formData.remarks && setText('remarks', formData.remarks)) filled++

  const allFields = form.getFields()
  if (filled === 0 && allFields.length > 0) {
    const names = allFields.map(f => f.getName())
    console.warn('TTB PDF export: no fields were filled. Template field names in this PDF:', names.slice(0, 50).join(', ') + (names.length > 50 ? '...' : ''))
  } else if (allFields.length === 0) {
    console.warn('TTB PDF export: template has no fillable form fields. Falling back to data-only PDF.')
  } else {
    console.log(`TTB PDF export: successfully filled ${filled} field(s) in ttb-final.pdf`)
  }

  try {
    form.updateFieldAppearances()
  } catch (_) {}
  form.flatten()
}

/**
 * Generate a data-only PDF when the template has no fillable form fields.
 * Produces a readable summary with header and all line values so the user gets the numbers on a PDF.
 */
async function generateDataOnlyPDF(formData, breweryInfo) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const page = pdfDoc.addPage([612, 792])
  const { width, height } = page.getSize()
  let y = height - 50
  const lineHeight = 14
  const margin = 50

  function draw(text, opts = {}) {
    page.drawText(text, { font: opts.bold ? fontBold : font, size: opts.size ?? 11, x: margin, y, ...opts })
    y -= (opts.size ?? 11) + 4
  }

  draw('TTB Form 5130.9 – Report Data (no fillable template)', { size: 14, bold: true })
  y -= 8
  if (breweryInfo?.brewery_name) draw(`Brewery: ${breweryInfo.brewery_name}`)
  if (breweryInfo?.ttb_brewery_number) draw(`TTB #: ${breweryInfo.ttb_brewery_number}`)
  const header = formData?.header || {}
  draw(`Period: ${formatPeriod(header)} ${header.year ?? ''}`)
  y -= 12

  draw('Additions to inventory (barrels)', { bold: true })
  for (let i = 1; i <= 13; i++) {
    const val = formData.additions?.['line' + i]
    page.drawText(`Line ${i}:`, { font, size: 10, x: margin, y })
    page.drawText(formatBarrels(val), { font, size: 10, x: margin + 120, y })
    y -= lineHeight
  }
  y -= 8
  draw('Removals from inventory (barrels)', { bold: true })
  let currentPage = page
  for (let i = 14; i <= 34; i++) {
    if (y < 100) {
      currentPage = pdfDoc.addPage([612, 792])
      y = currentPage.getSize().height - 50
      currentPage.drawText('Removals (continued)', { font: fontBold, size: 11, x: margin, y })
      y -= lineHeight + 4
    }
    const val = formData.removals?.['line' + i]
    currentPage.drawText(`Line ${i}:`, { font, size: 10, x: margin, y })
    currentPage.drawText(formatBarrels(val), { font, size: 10, x: margin + 120, y })
    y -= lineHeight
  }

  return pdfDoc
}

/**
 * Export TTB form to PDF
 * @param {Object} formData - Calculated form data from TTBFormService
 * @returns {Promise<Blob>} PDF blob ready for download
 */
export async function exportTTBFormToPDF(formData) {
  try {
    const breweryInfo = await BreweryInfoService.getBreweryInfo()
    const pdfDoc = await loadTTBTemplate()
    const form = pdfDoc.getForm()
    const fieldCount = form.getFields().length

    if (fieldCount === 0) {
      // Template has no fillable form fields (e.g. flat scan). Generate a data-only PDF so the numbers appear.
      const dataPdf = await generateDataOnlyPDF(formData, breweryInfo)
      const pdfBytes = await dataPdf.save()
      return new Blob([pdfBytes], { type: 'application/pdf' })
    }

    await fillPDFForm(pdfDoc, formData, breweryInfo)
    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
  } catch (error) {
    console.error('Failed to export TTB form to PDF:', error)
    throw new Error(`PDF export failed: ${error.message}`)
  }
}

/**
 * Download PDF file
 * @param {Blob} pdfBlob - PDF blob
 * @param {string} filename - Filename for download
 */
export function downloadPDF(pdfBlob, filename) {
  const url = URL.createObjectURL(pdfBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `TTB-Form-5130.9-${new Date().toISOString().split('T')[0]}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
