/**
 * Export service — CSV and PDF task reports.
 * jsPDF is loaded dynamically to keep the initial bundle smaller.
 */

export function exportCsv(tasks, interns = [], filename = 'safex-tasks.csv') {
  const headers = ['Title', 'Intern', 'Week', 'Due Date', 'Priority', 'Status', 'Category', 'Est. Time', 'Created']
  const rows = tasks.map((task) => {
    const intern = interns.find((i) => i.id === task.assignedInternId)
    return [
      `"${(task.title || '').replace(/"/g, '""')}"`,
      `"${intern?.name || 'Unassigned'}"`,
      task.week || '',
      task.dueDate || '',
      task.priority || '',
      task.status || '',
      task.category || '',
      task.estimatedTime || '',
      task.createdAt ? task.createdAt.split('T')[0] : '',
    ].join(',')
  })
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', filename)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportPdf(tasks, interns = [], filename = 'safex-tasks.pdf') {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Header banner
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('SafeX Intern Task Report', 14, 20)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Generated: ${new Date().toLocaleString()}  ·  ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`,
    pageW - 14,
    20,
    { align: 'right' }
  )

  const cols = [
    { header: 'Title',    w: 65 },
    { header: 'Intern',   w: 32 },
    { header: 'Week',     w: 18 },
    { header: 'Priority', w: 22 },
    { header: 'Status',   w: 30 },
    { header: 'Category', w: 26 },
    { header: 'Due Date', w: 26 },
    { header: 'Est.',     w: 14 },
  ]

  let y = 40
  const rowH = 7

  // Column headers
  doc.setFillColor(241, 245, 249)
  doc.rect(14, y - 5, pageW - 28, rowH, 'F')
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  let x = 14
  cols.forEach((col) => {
    doc.text(col.header, x + 1, y)
    x += col.w
  })
  y += rowH

  doc.setFont('helvetica', 'normal')
  tasks.slice(0, 100).forEach((task, idx) => {
    if (y > pageH - 14) {
      doc.addPage()
      y = 20
    }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 255)
      doc.rect(14, y - 5, pageW - 28, rowH, 'F')
    }
    doc.setTextColor(15, 23, 42)
    const intern = interns.find((i) => i.id === task.assignedInternId)
    const vals = [
      String(task.title || '').slice(0, 32),
      String(intern?.name || 'Unassigned').slice(0, 16),
      String(task.week || ''),
      String(task.priority || ''),
      String(task.status || ''),
      String(task.category || ''),
      String(task.dueDate || ''),
      String(task.estimatedTime || ''),
    ]
    x = 14
    vals.forEach((val, i) => {
      doc.text(val, x + 1, y)
      x += cols[i].w
    })
    y += rowH
  })

  doc.save(filename)
}
