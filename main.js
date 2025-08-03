import * as monaco from 'monaco-editor'
import { createMarkdownProcessor } from './markdown.js'

let editor
let markdownProcessor
const STORAGE_KEY = 'reddown-content'

function initEditor() {
    editor = monaco.editor.create(document.getElementById('monaco-editor'), {
        value: getStoredContent(),
        language: 'markdown',
        theme: 'vs-dark',
        automaticLayout: true,
        wordWrap: 'on',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        folding: true,
        renderLineHighlight: 'line',
        cursorBlinking: 'blink',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoIndent: 'advanced'
    })

    editor.onDidChangeModelContent(() => {
        const content = editor.getValue()
        updatePreview(content)
        saveToStorage(content)
    })

    addEditorCommands()
    updatePreview(editor.getValue())
}

function addEditorCommands() {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
        editor.trigger('keyboard', 'editor.action.copyLinesDownAction', {})
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Delete, () => {
        editor.trigger('keyboard', 'editor.action.deleteLines', {})
    })

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
        editor.trigger('keyboard', 'editor.action.moveLinesUpAction', {})
    })

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
        editor.trigger('keyboard', 'editor.action.moveLinesDownAction', {})
    })
}

function updatePreview(content) {
    const html = markdownProcessor.render(content)
    document.getElementById('preview-content').innerHTML = html
}

function getStoredContent() {
    return localStorage.getItem(STORAGE_KEY) || `# Welcome to Reddown

This is a Markdown editor with live preview, designed for Redmine syntax.

## Features

- **Bold text** and *italic text*
- _Underlined text_ (Redmine-specific)
- \`Inline code\`
- Lists and tables
- Live preview

### Example List

1. First item
2. Second item
   - Nested item
   - Another nested item

### Example Table

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

### Code Block

\`\`\`javascript
function hello() {
    console.log("Hello, Reddown!");
}
\`\`\`

Try editing this content to see the live preview in action!`
}

function saveToStorage(content) {
    localStorage.setItem(STORAGE_KEY, content)
}

function downloadFile() {
    const content = editor.getValue()
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

function copyToClipboard() {
    const content = editor.getValue()
    navigator.clipboard.writeText(content).then(() => {
        showNotification('Content copied to clipboard!')
    }).catch(() => {
        showNotification('Failed to copy content', 'error')
    })
}

function clearEditor() {
    if (confirm('Are you sure you want to clear the editor?')) {
        editor.setValue('')
        localStorage.removeItem(STORAGE_KEY)
    }
}

function toggleTheme() {
    const currentTheme = editor.getModel().getOptions().theme
    const newTheme = currentTheme === 'vs-dark' ? 'vs' : 'vs-dark'
    monaco.editor.setTheme(newTheme)
    document.body.classList.toggle('light-theme', newTheme === 'vs')
    
    const themeBtn = document.getElementById('theme-btn')
    themeBtn.textContent = newTheme === 'vs-dark' ? '🌙 Theme' : '☀️ Theme'
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
        notification.remove()
    }, 3000)
}

function initEventListeners() {
    document.getElementById('save-btn').addEventListener('click', downloadFile)
    document.getElementById('copy-btn').addEventListener('click', copyToClipboard)
    document.getElementById('clear-btn').addEventListener('click', clearEditor)
    document.getElementById('theme-btn').addEventListener('click', toggleTheme)
}

async function init() {
    markdownProcessor = createMarkdownProcessor()
    initEditor()
    initEventListeners()
}

init()