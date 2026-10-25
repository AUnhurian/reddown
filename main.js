import * as monaco from 'monaco-editor'
import { createMarkdownProcessor, getMarkdownMode, setMarkdownMode } from './markdown.js'

let editor
let markdownProcessor
const STORAGE_KEY = 'reddown-content'
const AI_KEY_STORAGE = 'reddown-openai-key'
const AI_MODEL_STORAGE = 'reddown-openai-model'
const DEFAULT_MODEL = 'o4-mini'
const KNOWN_MODELS = ['o4-mini', 'gpt-5-mini', 'gpt-4.1-mini', 'gpt-4o-mini', 'o3-mini']
const DRAFTS_KEY = 'reddown-drafts'
const ACTIVE_DRAFT_KEY = 'reddown-active-draft'
const SKILLS_KEY = 'reddown-ai-skills'
const ACTIVE_SKILL_KEY = 'reddown-active-skill'
const DRAFTS_HIDDEN_KEY = 'reddown-drafts-hidden'
const SPLIT_KEY = 'reddown-split'

let drafts = []
let activeDraftId = null
let skills = []
let skipDraftSave = false
let storageWarningShown = false

function initEditor() {
    const savedTheme = localStorage.getItem('reddown-theme') || 'vs'
    const isRedmineMode = getMarkdownMode()
    
    editor = monaco.editor.create(document.getElementById('monaco-editor'), {
        value: getActiveDraft().content,
        language: 'markdown',
        theme: savedTheme,
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

    // Apply saved theme to body
    document.body.classList.toggle('dark-theme', savedTheme === 'vs-dark')
    
    // Update theme button text
    const themeBtn = document.getElementById('theme-btn')
    if (themeBtn) {
        themeBtn.textContent = savedTheme === 'vs-dark' ? '☀️ Theme' : '🌙 Theme'
    }

    // Initialize markdown mode toggle
    const modeToggle = document.getElementById('markdown-mode')
    if (modeToggle) {
        modeToggle.checked = isRedmineMode
        modeToggle.addEventListener('change', handleModeToggle)
    }

    editor.onDidChangeModelContent(() => {
        const content = editor.getValue()
        updatePreview(content)
        if (!skipDraftSave) {
            saveActiveDraftContent(content)
        }
    })

    addEditorCommands()
    updatePreview(editor.getValue())
}

function handleModeToggle(event) {
    const isRedmineMode = event.target.checked
    setMarkdownMode(isRedmineMode)
    
    // Recreate markdown processor with new mode
    markdownProcessor = createMarkdownProcessor(isRedmineMode)
    
    // Update preview with new processor
    updatePreview(editor.getValue())
    
    // Update button tooltips
    updateButtonTooltips(isRedmineMode)
    
    showNotification(`Switched to ${isRedmineMode ? 'Redmine' : 'Standard'} Markdown mode`)
}

function updateButtonTooltips(isRedmineMode) {
    const underlineBtn = document.getElementById('underline-btn')
    if (underlineBtn) {
        if (isRedmineMode) {
            underlineBtn.title = 'Underline (Cmd+U) - Redmine specific'
            underlineBtn.style.opacity = '1'
        } else {
            underlineBtn.title = 'Underline not available in Standard Markdown'
            underlineBtn.style.opacity = '0.5'
        }
    }
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

    // Text formatting shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
        wrapSelection('**')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
        wrapSelection('*')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyU, () => {
        wrapSelection('_')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM, () => {
        wrapSelection('`')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
        wrapSelection('~~')
    })

    // Heading shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit1, () => {
        insertHeading(1)
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit2, () => {
        insertHeading(2)
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit3, () => {
        insertHeading(3)
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit4, () => {
        insertHeading(4)
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit5, () => {
        insertHeading(5)
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit6, () => {
        insertHeading(6)
    })

    // List shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL, () => {
        insertList(false) // unordered list
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyO, () => {
        insertList(true) // ordered list
    })

    // Link and image shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
        insertLink()
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyI, () => {
        insertImage()
    })

    // Code block shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC, () => {
        insertCodeBlock()
    })

    // Table shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyT, () => {
        document.getElementById('table-modal').style.display = 'flex'
        const event = new Event('click')
        document.getElementById('generate-table-structure').dispatchEvent(event)
    })
}

function updatePreview(content) {
    const html = markdownProcessor.render(content)
    document.getElementById('preview-content').innerHTML = html
}

function createInitialContent() {
    const isRedmineMode = getMarkdownMode()
    
    const redmineContent = `# Welcome to Reddown

This is a Markdown editor with live preview, designed for Redmine syntax.

## Features

- **Bold text** and *italic text*
- _Underlined text_ (Redmine-specific)
- \`Inline code\`
- Lists and tables
- 🤖 AI-powered enhancement

### Redmine Mode Active

In Redmine mode:
- Use \`_text_\` for _underlined text_
- Use \`*text*\` for *italic text*
- Use \`**text**\` for **bold text**

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

Try switching to Standard Markdown mode using the toggle above!`

    const standardContent = `# Welcome to Reddown

This is a Markdown editor with live preview, now in Standard Markdown mode.

## Features

- **Bold text** and *italic text*
- Standard CommonMark syntax
- \`Inline code\`
- Lists and tables
- 🤖 AI-powered enhancement

### Standard Mode Active

In Standard mode:
- Use \`_text_\` or \`*text*\` for *italic text*
- Use \`**text**\` or \`__text__\` for **bold text**
- No underline support (use HTML \`<u>text</u>\` if needed)

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

Try switching to Redmine mode using the toggle above!`
    
    return isRedmineMode ? redmineContent : standardContent
}

function createId() {
    return crypto.randomUUID()
}

function readJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return fallback
        return JSON.parse(raw)
    } catch {
        return fallback
    }
}

function loadDraftState() {
    const stored = readJson(DRAFTS_KEY, null)
    if (Array.isArray(stored) && stored.length > 0) {
        drafts = stored.filter(draft => draft && draft.id).map(draft => ({
            id: draft.id,
            name: typeof draft.name === 'string' && draft.name.trim() ? draft.name : 'Untitled',
            content: typeof draft.content === 'string' ? draft.content : '',
            updatedAt: draft.updatedAt || Date.now()
        }))
        if (drafts.length > 0) {
            const savedId = localStorage.getItem(ACTIVE_DRAFT_KEY)
            activeDraftId = drafts.some(draft => draft.id === savedId) ? savedId : drafts[0].id
            return
        }
    }

    const legacy = localStorage.getItem(STORAGE_KEY)
    const draft = {
        id: createId(),
        name: legacy !== null ? 'Untitled' : 'Welcome',
        content: legacy !== null ? legacy : createInitialContent(),
        updatedAt: Date.now()
    }
    drafts = [draft]
    activeDraftId = draft.id
    persistDrafts()
    if (legacy !== null) {
        localStorage.removeItem(STORAGE_KEY)
    }
}

function persistDrafts() {
    try {
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
        localStorage.setItem(ACTIVE_DRAFT_KEY, activeDraftId)
        storageWarningShown = false
    } catch {
        if (!storageWarningShown) {
            storageWarningShown = true
            showNotification('Could not save drafts. Browser storage is full.', 'error')
        }
    }
}

function getActiveDraft() {
    return drafts.find(draft => draft.id === activeDraftId)
}

function saveActiveDraftContent(content) {
    const draft = getActiveDraft()
    if (!draft || draft.content === content) return
    draft.content = content
    draft.updatedAt = Date.now()
    persistDrafts()
}

function uniqueDraftName(base) {
    const names = new Set(drafts.map(draft => draft.name))
    if (!names.has(base)) return base
    let index = 2
    while (names.has(`${base} ${index}`)) index += 1
    return `${base} ${index}`
}

function draftFileName(name) {
    const safe = name.trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-')
    return `${safe || 'document'}.md`
}

function openDraftContent(content) {
    skipDraftSave = true
    editor.setValue(content)
    skipDraftSave = false
    updatePreview(content)
}

function selectDraft(id) {
    if (!editor || id === activeDraftId) return
    saveActiveDraftContent(editor.getValue())
    activeDraftId = id
    openDraftContent(getActiveDraft().content)
    persistDrafts()
    document.querySelectorAll('.draft-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === activeDraftId)
    })
    editor.focus()
}

function createDraft(name, content) {
    if (editor) saveActiveDraftContent(editor.getValue())
    const draft = {
        id: createId(),
        name: uniqueDraftName(name),
        content,
        updatedAt: Date.now()
    }
    drafts.unshift(draft)
    activeDraftId = draft.id
    if (editor) openDraftContent(content)
    persistDrafts()
    renderDraftList()
    if (editor) editor.focus()
}

function deleteDraft(id) {
    const draft = drafts.find(item => item.id === id)
    if (!draft) return
    const message = drafts.length === 1
        ? `Delete the only draft "${draft.name}"? A new empty draft will replace it.`
        : `Delete draft "${draft.name}"?`
    if (!confirm(message)) return

    drafts = drafts.filter(item => item.id !== id)
    if (drafts.length === 0) {
        drafts = [{
            id: createId(),
            name: 'Untitled',
            content: '',
            updatedAt: Date.now()
        }]
    }
    if (!drafts.some(item => item.id === activeDraftId)) {
        activeDraftId = drafts[0].id
        openDraftContent(getActiveDraft().content)
    }
    persistDrafts()
    renderDraftList()
}

function renameDraft(id, name) {
    const trimmed = name.trim()
    if (!trimmed) return false
    const draft = drafts.find(item => item.id === id)
    if (!draft) return false
    draft.name = trimmed
    draft.updatedAt = Date.now()
    persistDrafts()
    renderDraftList()
    return true
}

function renderDraftList() {
    const list = document.getElementById('draft-list')
    list.replaceChildren()
    drafts.forEach(draft => {
        const item = document.createElement('li')
        item.className = draft.id === activeDraftId ? 'draft-item active' : 'draft-item'
        item.dataset.id = draft.id

        const nameButton = document.createElement('button')
        nameButton.type = 'button'
        nameButton.className = 'draft-name'
        nameButton.textContent = draft.name
        nameButton.title = 'Open draft. Double-click to rename.'
        nameButton.addEventListener('click', () => selectDraft(draft.id))
        nameButton.addEventListener('dblclick', event => {
            event.preventDefault()
            startDraftRename(item, draft)
        })

        const deleteButton = document.createElement('button')
        deleteButton.type = 'button'
        deleteButton.className = 'draft-delete'
        deleteButton.textContent = '×'
        deleteButton.title = 'Delete draft'
        deleteButton.addEventListener('click', event => {
            event.stopPropagation()
            deleteDraft(draft.id)
        })

        item.append(nameButton, deleteButton)
        list.append(item)
    })
}

function startDraftRename(item, draft) {
    const input = document.createElement('input')
    input.className = 'draft-rename'
    input.value = draft.name
    input.setAttribute('aria-label', 'Draft name')
    item.querySelector('.draft-name').replaceWith(input)
    input.focus()
    input.select()

    let closed = false
    const finish = save => {
        if (closed) return
        if (save && !renameDraft(draft.id, input.value)) {
            input.focus()
            return
        }
        closed = true
        if (!save) renderDraftList()
    }

    input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault()
            finish(true)
        }
        if (event.key === 'Escape') {
            event.preventDefault()
            finish(false)
        }
    })
    input.addEventListener('blur', () => finish(true))
}

function initDraftsUI() {
    renderDraftList()
    document.getElementById('new-draft-btn').addEventListener('click', () => {
        createDraft('Untitled', '')
    })

    const fileInput = document.getElementById('open-draft-file')
    document.getElementById('open-draft-btn').addEventListener('click', () => fileInput.click())
    fileInput.addEventListener('change', async () => {
        const file = fileInput.files && fileInput.files[0]
        fileInput.value = ''
        if (!file) return
        try {
            const content = await file.text()
            const name = file.name.replace(/\.(md|markdown|txt)$/i, '') || 'Untitled'
            createDraft(name, content)
        } catch {
            showNotification('Could not read that file', 'error')
        }
    })
}

function downloadFile() {
    const content = editor.getValue()
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = draftFileName(getActiveDraft().name)
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
    }
}

function toggleTheme() {
    const isDarkTheme = document.body.classList.contains('dark-theme')
    const newTheme = isDarkTheme ? 'vs' : 'vs-dark'
    
    monaco.editor.setTheme(newTheme)
    document.body.classList.toggle('dark-theme', newTheme === 'vs-dark')
    
    const themeBtn = document.getElementById('theme-btn')
    themeBtn.textContent = newTheme === 'vs-dark' ? '☀️ Theme' : '🌙 Theme'
    
    // Save theme preference
    localStorage.setItem('reddown-theme', newTheme)
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

function wrapSelection(before, after = before) {
    // Check if underline is being used in non-Redmine mode
    if (before === '_' && !getMarkdownMode()) {
        showNotification('Underline is only available in Redmine mode', 'error')
        return
    }
    
    const selection = editor.getSelection()
    const selectedText = editor.getModel().getValueInRange(selection)
    
    if (selectedText) {
        const wrappedText = before + selectedText + after
        editor.executeEdits('format', [{
            range: selection,
            text: wrappedText,
            forceMoveMarkers: true
        }])
    } else {
        const position = editor.getPosition()
        const placeholderText = 'text'
        const wrappedText = before + placeholderText + after
        editor.executeEdits('format', [{
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            text: wrappedText,
            forceMoveMarkers: true
        }])
        
        editor.setSelection(new monaco.Range(
            position.lineNumber, 
            position.column + before.length,
            position.lineNumber, 
            position.column + before.length + placeholderText.length
        ))
    }
    editor.focus()
}

function insertAtCursor(text, selectText = '') {
    const position = editor.getPosition()
    editor.executeEdits('insert', [{
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text: text,
        forceMoveMarkers: true
    }])
    
    if (selectText) {
        const startIndex = text.indexOf(selectText)
        if (startIndex !== -1) {
            editor.setSelection(new monaco.Range(
                position.lineNumber, 
                position.column + startIndex,
                position.lineNumber, 
                position.column + startIndex + selectText.length
            ))
        }
    }
    editor.focus()
}

function insertHeading(level) {
    const position = editor.getPosition()
    const lineContent = editor.getModel().getLineContent(position.lineNumber)
    const headingPrefix = '#'.repeat(level) + ' '
    
    if (lineContent.trim() === '') {
        insertAtCursor(headingPrefix + 'Heading text', 'Heading text')
    } else {
        const range = new monaco.Range(position.lineNumber, 1, position.lineNumber, 1)
        editor.executeEdits('heading', [{
            range: range,
            text: headingPrefix,
            forceMoveMarkers: true
        }])
    }
    editor.focus()
}

function insertLinePrefix(prefix, placeholder) {
    const position = editor.getPosition()
    const lineContent = editor.getModel().getLineContent(position.lineNumber)

    if (lineContent.trim() === '') {
        insertAtCursor(prefix + placeholder, placeholder)
    } else {
        editor.executeEdits('prefix', [{
            range: new monaco.Range(position.lineNumber, 1, position.lineNumber, 1),
            text: prefix,
            forceMoveMarkers: true
        }])
    }
    editor.focus()
}

function insertList(ordered = false) {
    insertLinePrefix(ordered ? '1. ' : '- ', 'List item')
}

function insertTask() {
    insertLinePrefix('- [ ] ', 'Task')
}

function insertQuote() {
    insertLinePrefix('> ', 'Quote')
}

function insertHorizontalRule() {
    insertAtCursor('\n---\n')
}

function insertLink() {
    const selection = editor.getSelection()
    const selectedText = editor.getModel().getValueInRange(selection)
    
    if (selectedText) {
        const linkText = `[${selectedText}](url)`
        editor.executeEdits('link', [{
            range: selection,
            text: linkText,
            forceMoveMarkers: true
        }])
        
        const urlStart = selectedText.length + 3
        editor.setSelection(new monaco.Range(
            selection.startLineNumber,
            selection.startColumn + urlStart,
            selection.startLineNumber,
            selection.startColumn + urlStart + 3
        ))
    } else {
        insertAtCursor('[link text](url)', 'link text')
    }
}

function insertImage() {
    insertAtCursor('![alt text](image-url)', 'alt text')
}

function insertCodeBlock() {
    const position = editor.getPosition()
    const codeBlockText = '```language\ncode here\n```'
    
    editor.executeEdits('codeblock', [{
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text: codeBlockText,
        forceMoveMarkers: true
    }])
    
    editor.setSelection(new monaco.Range(
        position.lineNumber,
        position.column + 3,
        position.lineNumber,
        position.column + 11
    ))
    editor.focus()
}

function initTableModal() {
    const modal = document.getElementById('table-modal')
    const closeBtn = document.getElementById('close-modal')
    const cancelBtn = document.getElementById('cancel-table')
    const generateBtn = document.getElementById('generate-table-structure')
    const insertBtn = document.getElementById('insert-table')
    const tableEditor = document.getElementById('table-editor')
    
    let tableData = []
    
    function showModal() {
        modal.style.display = 'flex'
        generateTableStructure()
    }
    
    function hideModal() {
        modal.style.display = 'none'
        tableEditor.innerHTML = ''
    }
    
    function generateTableStructure() {
        const rows = parseInt(document.getElementById('table-rows').value)
        const cols = parseInt(document.getElementById('table-cols').value)
        
        // Preserve existing data when regenerating
        const oldTableData = tableData
        const oldRows = oldTableData.length
        const oldCols = oldTableData.length > 0 ? oldTableData[0].length : 0
        
        // Create new structure
        tableData = Array(rows + 1).fill().map((_, rowIndex) => 
            Array(cols).fill().map((_, colIndex) => {
                // Preserve existing data if it exists
                if (rowIndex < oldRows && colIndex < oldCols && oldTableData[rowIndex] && oldTableData[rowIndex][colIndex]) {
                    return oldTableData[rowIndex][colIndex]
                }
                // Use default values for new cells
                return rowIndex === 0 ? 'Header' : 'Cell'
            })
        )
        
        renderTableEditor()
    }
    
    function renderTableEditor() {
        const rows = tableData.length
        const cols = tableData[0].length
        
        let html = '<table class="table-editor-table">'
        
        for (let i = 0; i < rows; i++) {
            html += '<tr>'
            for (let j = 0; j < cols; j++) {
                const isHeader = i === 0
                const cellClass = isHeader ? 'header-cell' : 'data-cell'
                html += `<td class="${cellClass}">
                    <input type="text" value="${tableData[i][j]}" 
                           data-row="${i}" data-col="${j}" 
                           placeholder="${isHeader ? 'Header' : 'Cell'}">
                </td>`
            }
            html += '</tr>'
        }
        
        html += '</table>'
        tableEditor.innerHTML = html
        
        // Remove existing event listeners to prevent duplicates
        tableEditor.querySelectorAll('input').forEach(input => {
            // Clone node to remove all event listeners
            const newInput = input.cloneNode(true)
            input.parentNode.replaceChild(newInput, input)
        })
        
        // Add fresh event listeners
        tableEditor.querySelectorAll('input').forEach(input => {
            // Save data on input
            input.addEventListener('input', (e) => {
                const row = parseInt(e.target.dataset.row)
                const col = parseInt(e.target.dataset.col)
                tableData[row][col] = e.target.value
            })
            
            // Handle keyboard navigation
            input.addEventListener('keydown', (e) => {
                const inputs = Array.from(tableEditor.querySelectorAll('input'))
                const currentIndex = inputs.indexOf(e.target)
                
                switch (e.key) {
                    case 'Enter':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault()
                            insertBtn.click()
                            return
                        }
                        // Fall through to Tab behavior for regular Enter
                    case 'Tab':
                        e.preventDefault()
                        if (e.shiftKey) {
                            const prevIndex = (currentIndex - 1 + inputs.length) % inputs.length
                            inputs[prevIndex].focus()
                            inputs[prevIndex].select()
                        } else {
                            const nextIndex = (currentIndex + 1) % inputs.length
                            inputs[nextIndex].focus()
                            inputs[nextIndex].select()
                        }
                        break
                        
                    case 'Escape':
                        e.preventDefault()
                        hideModal()
                        break
                        
                    // Text formatting shortcuts
                    case 'b':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault()
                            formatTextInCell(e.target, '**')
                        }
                        break
                        
                    case 'i':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault()
                            formatTextInCell(e.target, '*')
                        }
                        break
                        
                    case 'u':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault()
                            formatTextInCell(e.target, '_')
                        }
                        break
                        
                    case 'm':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault()
                            formatTextInCell(e.target, '`')
                        }
                        break
                        
                    case 'h':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault()
                            formatTextInCell(e.target, '~~')
                        }
                        break
                        
                    case 'ArrowRight':
                        if (e.target.selectionStart === e.target.value.length) {
                            e.preventDefault()
                            const nextIndex = (currentIndex + 1) % inputs.length
                            inputs[nextIndex].focus()
                        }
                        break
                        
                    case 'ArrowLeft':
                        if (e.target.selectionStart === 0) {
                            e.preventDefault()
                            const prevIndex = (currentIndex - 1 + inputs.length) % inputs.length
                            inputs[prevIndex].focus()
                        }
                        break
                        
                    case 'ArrowDown':
                        e.preventDefault()
                        const currentRow = parseInt(e.target.dataset.row)
                        const currentCol = parseInt(e.target.dataset.col)
                        const downInput = inputs.find(inp => 
                            parseInt(inp.dataset.row) === currentRow + 1 && 
                            parseInt(inp.dataset.col) === currentCol
                        )
                        if (downInput) {
                            downInput.focus()
                            downInput.select()
                        }
                        break
                        
                    case 'ArrowUp':
                        e.preventDefault()
                        const upRow = parseInt(e.target.dataset.row)
                        const upCol = parseInt(e.target.dataset.col)
                        const upInput = inputs.find(inp => 
                            parseInt(inp.dataset.row) === upRow - 1 && 
                            parseInt(inp.dataset.col) === upCol
                        )
                        if (upInput) {
                            upInput.focus()
                            upInput.select()
                        }
                        break
                }
            })
        })
        
        // Focus first input after rendering
        const firstInput = tableEditor.querySelector('input')
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100)
        }
    }
    
    function formatTextInCell(input, wrapper) {
        const start = input.selectionStart
        const end = input.selectionEnd
        const selectedText = input.value.substring(start, end)
        
        if (selectedText) {
            // Format selected text
            const formattedText = wrapper + selectedText + wrapper
            const newValue = input.value.substring(0, start) + formattedText + input.value.substring(end)
            input.value = newValue
            
            // Update tableData
            const row = parseInt(input.dataset.row)
            const col = parseInt(input.dataset.col)
            tableData[row][col] = newValue
            
            // Set cursor position after formatting
            const newStart = start + wrapper.length
            const newEnd = newStart + selectedText.length
            setTimeout(() => {
                input.focus()
                input.setSelectionRange(newStart, newEnd)
            }, 0)
        } else {
            // No selection - insert wrapper with placeholder
            const placeholder = 'text'
            const formattedText = wrapper + placeholder + wrapper
            const newValue = input.value.substring(0, start) + formattedText + input.value.substring(start)
            input.value = newValue
            
            // Update tableData
            const row = parseInt(input.dataset.row)
            const col = parseInt(input.dataset.col)
            tableData[row][col] = newValue
            
            // Select the placeholder text
            const newStart = start + wrapper.length
            const newEnd = newStart + placeholder.length
            setTimeout(() => {
                input.focus()
                input.setSelectionRange(newStart, newEnd)
            }, 0)
        }
        
        // Trigger input event to save changes
        input.dispatchEvent(new Event('input'))
    }
    
    function generateMarkdownTable() {
        if (tableData.length === 0) return ''
        
        let markdown = ''
        
        const headers = tableData[0]
        markdown += '| ' + headers.join(' | ') + ' |\n'
        markdown += '|' + headers.map(() => '----------|').join('') + '\n'
        
        for (let i = 1; i < tableData.length; i++) {
            markdown += '| ' + tableData[i].join(' | ') + ' |\n'
        }
        
        return markdown
    }
    
    document.getElementById('table-btn').addEventListener('click', showModal)
    closeBtn.addEventListener('click', hideModal)
    cancelBtn.addEventListener('click', hideModal)
    generateBtn.addEventListener('click', generateTableStructure)
    
    insertBtn.addEventListener('click', () => {
        const tableMarkdown = generateMarkdownTable()
        insertAtCursor('\n' + tableMarkdown + '\n')
        hideModal()
    })
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal()
    })
}

function initFormattingButtons() {
    document.getElementById('bold-btn').addEventListener('click', () => wrapSelection('**'))
    document.getElementById('italic-btn').addEventListener('click', () => wrapSelection('*'))
    document.getElementById('underline-btn').addEventListener('click', () => wrapSelection('_'))
    document.getElementById('strikethrough-btn').addEventListener('click', () => wrapSelection('~~'))
    document.getElementById('code-btn').addEventListener('click', () => wrapSelection('`'))
    
    document.getElementById('h1-btn').addEventListener('click', () => insertHeading(1))
    document.getElementById('h2-btn').addEventListener('click', () => insertHeading(2))
    document.getElementById('h3-btn').addEventListener('click', () => insertHeading(3))
    
    document.getElementById('ul-btn').addEventListener('click', () => insertList(false))
    document.getElementById('ol-btn').addEventListener('click', () => insertList(true))
    document.getElementById('task-btn').addEventListener('click', insertTask)
    document.getElementById('quote-btn').addEventListener('click', insertQuote)
    
    document.getElementById('link-btn').addEventListener('click', insertLink)
    document.getElementById('image-btn').addEventListener('click', insertImage)
    document.getElementById('codeblock-btn').addEventListener('click', insertCodeBlock)
    document.getElementById('rule-btn').addEventListener('click', insertHorizontalRule)
}

function setDraftsHidden(hidden) {
    document.getElementById('drafts-panel').classList.toggle('is-collapsed', hidden)
    document.getElementById('show-drafts-btn').hidden = !hidden
    localStorage.setItem(DRAFTS_HIDDEN_KEY, hidden ? '1' : '0')
    if (editor) editor.layout()
}

function applySplit(editorPercent) {
    const editorPanel = document.querySelector('.editor-panel')
    const previewPanel = document.querySelector('.preview-panel')
    editorPanel.style.flex = `${editorPercent} 1 0%`
    previewPanel.style.flex = `${100 - editorPercent} 1 0%`
}

function initPaneResize() {
    const container = document.querySelector('.editor-container')
    const resizer = document.getElementById('pane-resizer')
    const saved = Number(localStorage.getItem(SPLIT_KEY))
    if (saved >= 20 && saved <= 80) applySplit(saved)

    resizer.addEventListener('pointerdown', event => {
        event.preventDefault()
        resizer.classList.add('is-dragging')
        document.body.classList.add('is-resizing')
        const stacked = getComputedStyle(container).flexDirection === 'column'

        const onMove = moveEvent => {
            const bounds = container.getBoundingClientRect()
            const draftsPanel = document.getElementById('drafts-panel')
            const draftsSize = draftsPanel.classList.contains('is-collapsed')
                ? 0
                : (stacked ? draftsPanel.getBoundingClientRect().height : draftsPanel.getBoundingClientRect().width)
            const available = (stacked ? bounds.height : bounds.width) - draftsSize - (stacked ? resizer.offsetHeight : resizer.offsetWidth)
            const offset = (stacked ? moveEvent.clientY - bounds.top : moveEvent.clientX - bounds.left) - draftsSize
            const percent = Math.min(80, Math.max(20, (offset / available) * 100))
            applySplit(percent)
            resizer.dataset.percent = String(Math.round(percent))
        }

        const onUp = () => {
            resizer.classList.remove('is-dragging')
            document.body.classList.remove('is-resizing')
            document.removeEventListener('pointermove', onMove)
            document.removeEventListener('pointerup', onUp)
            if (resizer.dataset.percent) localStorage.setItem(SPLIT_KEY, resizer.dataset.percent)
            if (editor) editor.layout()
        }

        document.addEventListener('pointermove', onMove)
        document.addEventListener('pointerup', onUp)
    })
}

function initLayout() {
    setDraftsHidden(localStorage.getItem(DRAFTS_HIDDEN_KEY) === '1')
    document.getElementById('hide-drafts-btn').addEventListener('click', () => setDraftsHidden(true))
    document.getElementById('show-drafts-btn').addEventListener('click', () => setDraftsHidden(false))
    initPaneResize()
}

async function callOpenAI(content) {
    const apiKey = localStorage.getItem(AI_KEY_STORAGE)
    if (!apiKey) {
        throw new Error('OpenAI API key not found. Please set it in AI settings.')
    }
    
    const isRedmineMode = getMarkdownMode()
    
    const redminePrompt = `You are a markdown formatter for Redmine syntax. Improve the text structure and formatting while keeping ALL links and images unchanged.

REDMINE SYNTAX:
- _text_ for underline
- *text* for italic  
- **text** for bold

IMPROVE ONLY:
- Text organization and spacing
- Heading structure
- List formatting
- Table alignment
- Code block formatting

NEVER TOUCH:
- Any text starting with http:// or https://
- Any text containing ![
- Any text containing ](
- Any email addresses
- Any file paths or URLs

If you see links or images in the content, copy them exactly character-by-character. Do not reformat, fix, or modify them in any way.

Content to improve:

${content}

Return only the formatted content.`

    const standardPrompt = `You are a markdown formatter for standard syntax. Improve the text structure and formatting while keeping ALL links and images unchanged.

STANDARD SYNTAX:
- *text* or _text_ for italic
- **text** or __text__ for bold
- \`text\` for inline code

IMPROVE ONLY:
- Text organization and spacing
- Heading structure
- List formatting
- Table alignment
- Code block formatting

NEVER TOUCH:
- Any text starting with http:// or https://
- Any text containing ![
- Any text containing ](
- Any email addresses
- Any file paths or URLs

If you see links or images in the content, copy them exactly character-by-character. Do not reformat, fix, or modify them in any way.

Content to improve:

${content}

Return only the formatted content.`

    const prompt = isRedmineMode ? redminePrompt : standardPrompt
    const skill = getSelectedSkill()
    const model = getActiveModel()
    const body = {
        model,
        messages: skill
            ? buildSkillMessages(content, skill, isRedmineMode)
            : [{ role: 'user', content: prompt }],
        max_completion_tokens: isReasoningModel(model) ? 16000 : 4000
    }
    if (!isReasoningModel(model)) body.temperature = 0.3

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'OpenAI API request failed')
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content
    if (!text || !text.trim()) {
        throw new Error('The model returned an empty response.')
    }
    return text.trim()
}

function isReasoningModel(model) {
    return /^o\d/.test(model)
}

function getActiveModel() {
    const select = document.getElementById('openai-model')
    if (select) {
        const model = select.value === 'custom'
            ? document.getElementById('openai-model-custom').value.trim()
            : select.value
        if (model) return model
    }
    return localStorage.getItem(AI_MODEL_STORAGE) || DEFAULT_MODEL
}

function persistModel() {
    const model = getActiveModel()
    localStorage.setItem(AI_MODEL_STORAGE, model)
}

function loadSkills() {
    const stored = readJson(SKILLS_KEY, [])
    skills = Array.isArray(stored) ? stored.filter(skill => skill && skill.id && skill.name && skill.instruction) : []
}

function persistSkills() {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(skills))
}

function getSelectedSkill() {
    const selectedId = localStorage.getItem(ACTIVE_SKILL_KEY)
    return skills.find(skill => skill.id === selectedId) || null
}

function setSelectedSkillId(id) {
    if (id) localStorage.setItem(ACTIVE_SKILL_KEY, id)
    else localStorage.removeItem(ACTIVE_SKILL_KEY)
}

function buildSkillMessages(content, skill, isRedmineMode) {
    const syntax = isRedmineMode
        ? 'Redmine Markdown: _text_ is underline, *text* is italic, **text** is bold.'
        : 'Standard Markdown: *text* or _text_ is italic, **text** or __text__ is bold, `text` is code.'

    return [
        {
            role: 'system',
            content: [
                'You transform the user text and return only the finished result.',
                'No preamble, no explanation, no closing note, and no code fence around the whole result.',
                'Follow the instruction exactly. If it defines headings or an order, use that structure and do not add other sections.',
                'Do not invent facts, links, or requirements that are not in the text or the instruction.',
                'Unless the instruction explicitly says to change them, copy links, images, and URLs character for character.',
                syntax
            ].join('\n')
        },
        {
            role: 'user',
            content: `Instruction:\n${skill.instruction}\n\nText:\n${content}`
        }
    ]
}

function initAIModal() {
    const aiModal = document.getElementById('ai-modal')
    const aiBtn = document.getElementById('ai-btn')
    const closeAiBtn = document.getElementById('close-ai-modal')
    const saveSettingsBtn = document.getElementById('save-ai-settings')
    const enhanceNowBtn = document.getElementById('enhance-now')
    const cancelSettingsBtn = document.getElementById('cancel-ai-settings')
    const apiKeyInput = document.getElementById('openai-key')
    const modelSelect = document.getElementById('openai-model')
    const modelCustomInput = document.getElementById('openai-model-custom')
    const skillSelect = document.getElementById('ai-skill-select')
    const skillList = document.getElementById('skill-list')
    const skillEditor = document.getElementById('skill-editor')
    const skillNameInput = document.getElementById('skill-name')
    const skillInstructionInput = document.getElementById('skill-instruction')
    let editingSkillId = null

    function updateEnhanceLabel() {
        const skill = getSelectedSkill()
        enhanceNowBtn.textContent = skill ? `Run: ${skill.name}` : '🤖 Enhance Current Content'
    }

    function hideSkillEditor() {
        editingSkillId = null
        skillEditor.hidden = true
        skillNameInput.value = ''
        skillInstructionInput.value = ''
    }

    function openSkillEditor(skill) {
        editingSkillId = skill ? skill.id : null
        skillNameInput.value = skill ? skill.name : ''
        skillInstructionInput.value = skill ? skill.instruction : ''
        skillEditor.hidden = false
        skillNameInput.focus()
    }

    function renderSkillControls() {
        const selectedId = getSelectedSkill() ? getSelectedSkill().id : ''
        skillSelect.replaceChildren()

        const defaultOption = document.createElement('option')
        defaultOption.value = ''
        defaultOption.textContent = 'Default enhance'
        skillSelect.append(defaultOption)

        skills.forEach(skill => {
            const option = document.createElement('option')
            option.value = skill.id
            option.textContent = skill.name
            skillSelect.append(option)
        })

        skillSelect.value = selectedId
        skillList.replaceChildren()

        if (skills.length === 0) {
            const empty = document.createElement('p')
            empty.className = 'skill-empty'
            empty.textContent = 'No saved skills yet.'
            skillList.append(empty)
            updateEnhanceLabel()
            return
        }

        skills.forEach(skill => {
            const row = document.createElement('div')
            row.className = 'skill-row'

            const name = document.createElement('span')
            name.className = 'skill-row-name'
            name.textContent = skill.name

            const editButton = document.createElement('button')
            editButton.type = 'button'
            editButton.className = 'secondary-btn small-btn'
            editButton.textContent = 'Edit'
            editButton.addEventListener('click', () => openSkillEditor(skill))

            const deleteButton = document.createElement('button')
            deleteButton.type = 'button'
            deleteButton.className = 'secondary-btn small-btn'
            deleteButton.textContent = 'Delete'
            deleteButton.addEventListener('click', () => deleteSkill(skill.id))

            row.append(name, editButton, deleteButton)
            skillList.append(row)
        })
        updateEnhanceLabel()
    }

    function deleteSkill(id) {
        const skill = skills.find(item => item.id === id)
        if (!skill || !confirm(`Delete skill "${skill.name}"?`)) return
        skills = skills.filter(item => item.id !== id)
        if (localStorage.getItem(ACTIVE_SKILL_KEY) === id) setSelectedSkillId('')
        if (editingSkillId === id) hideSkillEditor()
        persistSkills()
        renderSkillControls()
    }

    function saveSkillFromForm() {
        const name = skillNameInput.value.trim()
        const instruction = skillInstructionInput.value.trim()
        if (!name || !instruction) {
            showNotification('Skill needs a name and an instruction', 'error')
            return
        }

        if (editingSkillId) {
            const skill = skills.find(item => item.id === editingSkillId)
            if (!skill) return
            skill.name = name
            skill.instruction = instruction
            setSelectedSkillId(skill.id)
        } else {
            const skill = { id: createId(), name, instruction }
            skills.push(skill)
            setSelectedSkillId(skill.id)
        }

        persistSkills()
        hideSkillEditor()
        renderSkillControls()
        showNotification('Skill saved')
    }
    
    function showAiModal() {
        aiModal.style.display = 'flex'
        loadAISettings()
        hideSkillEditor()
        renderSkillControls()
    }
    
    function hideAiModal() {
        aiModal.style.display = 'none'
    }
    
    function loadAISettings() {
        const savedKey = localStorage.getItem(AI_KEY_STORAGE)
        if (savedKey) {
            apiKeyInput.value = savedKey
            enhanceNowBtn.disabled = false
        } else {
            apiKeyInput.value = ''
            enhanceNowBtn.disabled = true
        }

        const savedModel = localStorage.getItem(AI_MODEL_STORAGE) || DEFAULT_MODEL
        if (KNOWN_MODELS.includes(savedModel)) {
            modelSelect.value = savedModel
            modelCustomInput.value = ''
            modelCustomInput.hidden = true
        } else {
            modelSelect.value = 'custom'
            modelCustomInput.value = savedModel
            modelCustomInput.hidden = false
        }
    }
    
    function saveAISettings() {
        const apiKey = apiKeyInput.value.trim()
        if (!apiKey) {
            showNotification('Please enter a valid OpenAI API key', 'error')
            return
        }
        
        if (!apiKey.startsWith('sk-')) {
            showNotification('API key should start with "sk-"', 'error')
            return
        }

        if (modelSelect.value === 'custom' && !modelCustomInput.value.trim()) {
            showNotification('Enter a model id', 'error')
            return
        }
        
        localStorage.setItem(AI_KEY_STORAGE, apiKey)
        persistModel()
        enhanceNowBtn.disabled = false
        showNotification('AI settings saved successfully!')
    }
    
    async function enhanceContent() {
        const content = editor.getValue().trim()
        if (!content) {
            showNotification('No content to enhance', 'error')
            return
        }
        
        enhanceNowBtn.textContent = 'Enhancing...'
        enhanceNowBtn.disabled = true
        
        try {
            const skill = getSelectedSkill()
            const model = getActiveModel()
            persistModel()
            const enhancedContent = await callOpenAI(content)
            const title = skill ? `AI: ${skill.name} (${model})` : `AI Enhancement Preview (${model})`
            showDiffModal(content, enhancedContent, title)
            hideAiModal()
        } catch (error) {
            console.error('AI Enhancement error:', error)
            showNotification(`Enhancement failed: ${error.message}`, 'error')
        } finally {
            enhanceNowBtn.disabled = apiKeyInput.value.trim().length === 0
            updateEnhanceLabel()
        }
    }
    
    aiBtn.addEventListener('click', showAiModal)
    closeAiBtn.addEventListener('click', hideAiModal)
    cancelSettingsBtn.addEventListener('click', hideAiModal)
    saveSettingsBtn.addEventListener('click', saveAISettings)
    enhanceNowBtn.addEventListener('click', enhanceContent)
    document.getElementById('new-skill-btn').addEventListener('click', () => openSkillEditor(null))
    document.getElementById('save-skill-btn').addEventListener('click', saveSkillFromForm)
    document.getElementById('cancel-skill-btn').addEventListener('click', hideSkillEditor)
    skillSelect.addEventListener('change', () => {
        setSelectedSkillId(skillSelect.value)
        updateEnhanceLabel()
    })
    modelSelect.addEventListener('change', () => {
        modelCustomInput.hidden = modelSelect.value !== 'custom'
        if (modelSelect.value !== 'custom') persistModel()
    })
    modelCustomInput.addEventListener('change', persistModel)
    
    // Enable enhance button when API key is entered
    apiKeyInput.addEventListener('input', (e) => {
        const hasKey = e.target.value.trim().length > 0
        enhanceNowBtn.disabled = !hasKey
    })
    
    aiModal.addEventListener('click', (e) => {
        if (e.target === aiModal) hideAiModal()
    })

    loadAISettings()
}

function initHelpModal() {
    const helpModal = document.getElementById('help-modal')
    const helpBtn = document.getElementById('help-btn')
    const closeHelpBtn = document.getElementById('close-help-modal')
    
    function showHelpModal() {
        helpModal.style.display = 'flex'
    }
    
    function hideHelpModal() {
        helpModal.style.display = 'none'
    }
    
    helpBtn.addEventListener('click', showHelpModal)
    closeHelpBtn.addEventListener('click', hideHelpModal)
    
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) hideHelpModal()
    })
    
    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (helpModal.style.display === 'flex') {
                hideHelpModal()
            }
            if (document.getElementById('ai-modal').style.display === 'flex') {
                document.getElementById('ai-modal').style.display = 'none'
            }
        }
    })
}

function lcs(a, b) {
    const m = a.length
    const n = b.length
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0))
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
            }
        }
    }
    
    return dp
}

function createLineDiff(originalContent, enhancedContent) {
    const originalLines = originalContent.split('\n')
    const enhancedLines = enhancedContent.split('\n')
    
    // Use LCS (Longest Common Subsequence) for better diff
    const dp = lcs(originalLines, enhancedLines)
    const originalDiff = []
    const enhancedDiff = []
    
    let i = originalLines.length
    let j = enhancedLines.length
    
    // Backtrack to find the diff
    const operations = []
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && originalLines[i - 1] === enhancedLines[j - 1]) {
            operations.unshift({ type: 'unchanged', original: i - 1, enhanced: j - 1 })
            i--
            j--
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            operations.unshift({ type: 'added', enhanced: j - 1 })
            j--
        } else if (i > 0) {
            operations.unshift({ type: 'removed', original: i - 1 })
            i--
        }
    }
    
    // Convert operations to diff format
    for (const op of operations) {
        if (op.type === 'unchanged') {
            originalDiff.push({ 
                type: 'unchanged', 
                content: originalLines[op.original], 
                lineNum: op.original + 1 
            })
            enhancedDiff.push({ 
                type: 'unchanged', 
                content: enhancedLines[op.enhanced], 
                lineNum: op.enhanced + 1 
            })
        } else if (op.type === 'added') {
            originalDiff.push({ type: 'empty', content: '', lineNum: null })
            enhancedDiff.push({ 
                type: 'added', 
                content: enhancedLines[op.enhanced], 
                lineNum: op.enhanced + 1 
            })
        } else if (op.type === 'removed') {
            originalDiff.push({ 
                type: 'removed', 
                content: originalLines[op.original], 
                lineNum: op.original + 1 
            })
            enhancedDiff.push({ type: 'empty', content: '', lineNum: null })
        }
    }
    
    return { originalDiff, enhancedDiff }
}

function renderDiffContent(diffLines) {
    return diffLines.map(line => {
        const lineNumStr = line.lineNum ? String(line.lineNum).padStart(3, ' ') : '   '
        const content = line.content || ''
        
        return `<div class="diff-line diff-line-${line.type}">
            <span class="diff-line-number">${lineNumStr}</span>
            <span class="diff-line-content">${escapeHtml(content)}</span>
        </div>`
    }).join('')
}

function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

function showDiffModal(originalContent, enhancedContent, title = 'AI Enhancement Preview') {
    document.querySelector('#ai-diff-modal .modal-header h3').textContent = title
    const diffModal = document.getElementById('ai-diff-modal')
    const originalDiv = document.getElementById('original-content')
    const enhancedDiv = document.getElementById('enhanced-content')
    const summarySpan = document.getElementById('diff-summary')
    
    // Create line-by-line diff
    const { originalDiff, enhancedDiff } = createLineDiff(originalContent, enhancedContent)
    
    // Render diff content
    originalDiv.innerHTML = renderDiffContent(originalDiff)
    enhancedDiv.innerHTML = renderDiffContent(enhancedDiff)
    
    // Calculate stats
    const originalLines = originalContent.split('\n').length
    const enhancedLines = enhancedContent.split('\n').length
    const originalChars = originalContent.length
    const enhancedChars = enhancedContent.length
    const originalWords = originalContent.split(/\s+/).filter(w => w.length > 0).length
    const enhancedWords = enhancedContent.split(/\s+/).filter(w => w.length > 0).length
    
    // Count changes
    const addedLines = enhancedDiff.filter(line => line.type === 'added').length
    const removedLines = originalDiff.filter(line => line.type === 'removed').length
    const changedLines = addedLines + removedLines
    
    function getChangeClass(diff) {
        if (diff > 0) return 'positive'
        if (diff < 0) return 'negative'
        return 'neutral'
    }
    
    function formatDiff(diff) {
        if (diff === 0) return '±0'
        return diff > 0 ? `+${diff}` : `${diff}`
    }
    
    summarySpan.innerHTML = `
        <div class="diff-stats-item">
            <span class="diff-stats-label">Changes</span>
            <span class="diff-stats-value">${changedLines} lines</span>
            <span class="diff-stats-change ${changedLines > 0 ? 'positive' : 'neutral'}">+${addedLines} -${removedLines}</span>
        </div>
        <div class="diff-stats-item">
            <span class="diff-stats-label">Words</span>
            <span class="diff-stats-value">${originalWords} → ${enhancedWords}</span>
            <span class="diff-stats-change ${getChangeClass(enhancedWords - originalWords)}">${formatDiff(enhancedWords - originalWords)}</span>
        </div>
        <div class="diff-stats-item">
            <span class="diff-stats-label">Characters</span>
            <span class="diff-stats-value">${originalChars} → ${enhancedChars}</span>
            <span class="diff-stats-change ${getChangeClass(enhancedChars - originalChars)}">${formatDiff(enhancedChars - originalChars)}</span>
        </div>
    `
    
    // Store enhanced content for later use
    diffModal.setAttribute('data-enhanced-content', enhancedContent)
    
    diffModal.style.display = 'flex'
    
    // Setup sync scroll after modal is displayed
    setTimeout(() => {
        if (window.setupDiffSyncScroll) {
            window.setupDiffSyncScroll()
        }
    }, 150)
}

function initDiffModal() {
    const diffModal = document.getElementById('ai-diff-modal')
    const closeDiffBtn = document.getElementById('close-diff-modal')
    const applyBtn = document.getElementById('apply-changes')
    const rejectBtn = document.getElementById('reject-changes')
    
    function hideDiffModal() {
        diffModal.style.display = 'none'
        diffModal.removeAttribute('data-enhanced-content')
    }
    
    function applyChanges() {
        const enhancedContent = diffModal.getAttribute('data-enhanced-content')
        if (enhancedContent) {
            editor.setValue(enhancedContent)
            showNotification('Changes applied successfully!')
        }
        hideDiffModal()
    }
    
    function rejectChanges() {
        showNotification('Changes rejected')
        hideDiffModal()
    }
    
    // Synchronized scrolling
    function setupSyncScroll() {
        const originalDiv = document.getElementById('original-content')
        const enhancedDiv = document.getElementById('enhanced-content')
        
        if (!originalDiv || !enhancedDiv) return
        
        // Remove existing listeners to avoid duplicates
        originalDiv.removeEventListener('scroll', originalDiv._syncScrollHandler)
        enhancedDiv.removeEventListener('scroll', enhancedDiv._syncScrollHandler)
        
        let isScrolling = false
        
        function syncScroll(source, target) {
            if (isScrolling) return
            isScrolling = true
            target.scrollTop = source.scrollTop
            setTimeout(() => { isScrolling = false }, 16) // One frame delay
        }
        
        // Store handlers for removal later
        originalDiv._syncScrollHandler = () => syncScroll(originalDiv, enhancedDiv)
        enhancedDiv._syncScrollHandler = () => syncScroll(enhancedDiv, originalDiv)
        
        originalDiv.addEventListener('scroll', originalDiv._syncScrollHandler, { passive: true })
        enhancedDiv.addEventListener('scroll', enhancedDiv._syncScrollHandler, { passive: true })
    }
    
    closeDiffBtn.addEventListener('click', hideDiffModal)
    applyBtn.addEventListener('click', applyChanges)
    rejectBtn.addEventListener('click', rejectChanges)
    
    diffModal.addEventListener('click', (e) => {
        if (e.target === diffModal) hideDiffModal()
    })
    
    // Store the sync scroll setup function
    diffModal.setAttribute('data-sync-setup', 'true')
    window.setupDiffSyncScroll = setupSyncScroll
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && diffModal.style.display === 'flex') {
            hideDiffModal()
        }
    })
}

function initEventListeners() {
    document.getElementById('save-btn').addEventListener('click', downloadFile)
    document.getElementById('copy-btn').addEventListener('click', copyToClipboard)
    document.getElementById('clear-btn').addEventListener('click', clearEditor)
    document.getElementById('theme-btn').addEventListener('click', toggleTheme)
    
    initFormattingButtons()
    initTableModal()
    initAIModal()
    initHelpModal()
    initDiffModal()
}

async function init() {
    loadDraftState()
    loadSkills()
    const isRedmineMode = getMarkdownMode()
    markdownProcessor = createMarkdownProcessor(isRedmineMode)
    initEditor()
    initEventListeners()
    initDraftsUI()
    initLayout()
    
    // Initialize button tooltips based on mode
    updateButtonTooltips(isRedmineMode)
}

init()