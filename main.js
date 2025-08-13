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
            showDiffModal(content, enhancedContent)
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

function showDiffModal(originalContent, enhancedContent) {
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
    const isRedmineMode = getMarkdownMode()
    markdownProcessor = createMarkdownProcessor(isRedmineMode)
    initEditor()
    initEventListeners()
    
    // Initialize button tooltips based on mode
    updateButtonTooltips(isRedmineMode)
}

init()