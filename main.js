import * as monaco from 'monaco-editor'
import { createMarkdownProcessor, getMarkdownMode, setMarkdownMode } from './markdown.js'

let editor
let markdownProcessor
const STORAGE_KEY = 'reddown-content'
const AI_KEY_STORAGE = 'reddown-openai-key'

function initEditor() {
    const savedTheme = localStorage.getItem('reddown-theme') || 'vs'
    const isRedmineMode = getMarkdownMode()
    
    editor = monaco.editor.create(document.getElementById('monaco-editor'), {
        value: getStoredContent(),
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
        saveToStorage(content)
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

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote, () => {
        wrapSelection('`')
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

function getStoredContent() {
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
    
    return localStorage.getItem(STORAGE_KEY) || (isRedmineMode ? redmineContent : standardContent)
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

function insertList(ordered = false) {
    const position = editor.getPosition()
    const lineContent = editor.getModel().getLineContent(position.lineNumber)
    const prefix = ordered ? '1. ' : '- '
    
    if (lineContent.trim() === '') {
        insertAtCursor(prefix + 'List item', 'List item')
    } else {
        const range = new monaco.Range(position.lineNumber, 1, position.lineNumber, 1)
        editor.executeEdits('list', [{
            range: range,
            text: prefix,
            forceMoveMarkers: true
        }])
    }
    editor.focus()
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
        
        tableData = Array(rows + 1).fill().map((_, rowIndex) => 
            Array(cols).fill().map(() => rowIndex === 0 ? 'Header' : 'Cell')
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
        
        tableEditor.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const row = parseInt(e.target.dataset.row)
                const col = parseInt(e.target.dataset.col)
                tableData[row][col] = e.target.value
            })
        })
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
    document.getElementById('code-btn').addEventListener('click', () => wrapSelection('`'))
    
    document.getElementById('h1-btn').addEventListener('click', () => insertHeading(1))
    document.getElementById('h2-btn').addEventListener('click', () => insertHeading(2))
    document.getElementById('h3-btn').addEventListener('click', () => insertHeading(3))
    
    document.getElementById('ul-btn').addEventListener('click', () => insertList(false))
    document.getElementById('ol-btn').addEventListener('click', () => insertList(true))
    
    document.getElementById('link-btn').addEventListener('click', insertLink)
    document.getElementById('image-btn').addEventListener('click', insertImage)
    document.getElementById('codeblock-btn').addEventListener('click', insertCodeBlock)
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 4000
        })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'OpenAI API request failed')
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
}

function initAIModal() {
    const aiModal = document.getElementById('ai-modal')
    const aiBtn = document.getElementById('ai-btn')
    const closeAiBtn = document.getElementById('close-ai-modal')
    const saveSettingsBtn = document.getElementById('save-ai-settings')
    const enhanceNowBtn = document.getElementById('enhance-now')
    const cancelSettingsBtn = document.getElementById('cancel-ai-settings')
    const apiKeyInput = document.getElementById('openai-key')
    
    function showAiModal() {
        aiModal.style.display = 'flex'
        loadAISettings()
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
        
        localStorage.setItem(AI_KEY_STORAGE, apiKey)
        enhanceNowBtn.disabled = false
        showNotification('AI settings saved successfully!')
    }
    
    async function enhanceContent() {
        const content = editor.getValue().trim()
        if (!content) {
            showNotification('No content to enhance', 'error')
            return
        }
        
        const originalBtnText = enhanceNowBtn.textContent
        enhanceNowBtn.textContent = '🔄 Enhancing...'
        enhanceNowBtn.disabled = true
        
        try {
            const enhancedContent = await callOpenAI(content)
            editor.setValue(enhancedContent)
            showNotification('Content enhanced successfully!')
            hideAiModal()
        } catch (error) {
            console.error('AI Enhancement error:', error)
            showNotification(`Enhancement failed: ${error.message}`, 'error')
        } finally {
            enhanceNowBtn.textContent = originalBtnText
            enhanceNowBtn.disabled = false
        }
    }
    
    aiBtn.addEventListener('click', showAiModal)
    closeAiBtn.addEventListener('click', hideAiModal)
    cancelSettingsBtn.addEventListener('click', hideAiModal)
    saveSettingsBtn.addEventListener('click', saveAISettings)
    enhanceNowBtn.addEventListener('click', enhanceContent)
    
    // Enable enhance button when API key is entered
    apiKeyInput.addEventListener('input', (e) => {
        const hasKey = e.target.value.trim().length > 0
        enhanceNowBtn.disabled = !hasKey
    })
    
    aiModal.addEventListener('click', (e) => {
        if (e.target === aiModal) hideAiModal()
    })
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

function initEventListeners() {
    document.getElementById('save-btn').addEventListener('click', downloadFile)
    document.getElementById('copy-btn').addEventListener('click', copyToClipboard)
    document.getElementById('clear-btn').addEventListener('click', clearEditor)
    document.getElementById('theme-btn').addEventListener('click', toggleTheme)
    
    initFormattingButtons()
    initTableModal()
    initAIModal()
    initHelpModal()
}

async function init() {
    const isRedmineMode = getMarkdownMode()
    markdownProcessor = createMarkdownProcessor(isRedmineMode)
    initEditor()
    initEventListeners()
    
    // Initialize button tooltips based on mode
    updateButtonTooltips(isRedmineMode)
}

init()