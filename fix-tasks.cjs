const fs = require('fs')
const path = require('path')

const files = [
  { file: path.join(__dirname, 'src', 'pages', 'TasksPage.jsx'), name: 'TasksPage' },
  { file: path.join(__dirname, 'src', 'components', 'TaskDrawer.jsx'), name: 'TaskDrawer' },
  { file: path.join(__dirname, 'src', 'components', 'TaskModal.jsx'), name: 'TaskModal' },
]

files.forEach(({ file, name }) => {
  const content = fs.readFileSync(file, 'utf8')
  const marker = 'export default ' + name
  const firstIdx = content.indexOf(marker)
  if (firstIdx >= 0) {
    const truncated = content.slice(0, firstIdx + marker.length) + '\n'
    if (truncated.length < content.length) {
      fs.writeFileSync(file, truncated, 'utf8')
      console.log('Fixed: ' + name)
    } else {
      console.log('Clean: ' + name)
    }
  }
})
