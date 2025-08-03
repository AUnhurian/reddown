import MarkdownIt from 'markdown-it'

function underlinePlugin(md) {
    const underlineRule = (state, silent) => {
        const start = state.pos
        const marker = state.src.charCodeAt(start)
        
        if (marker !== 0x5F) return false
        
        const scanned = state.scanDelims(state.pos, true)
        const len = scanned.length
        const ch = String.fromCharCode(marker)
        
        if (len < 1) return false
        
        if (silent) return true
        
        const token_o = state.push('underline_open', 'u', 1)
        token_o.markup = ch
        token_o.block = false
        
        const token_c = state.push('underline_close', 'u', -1)
        token_c.markup = ch
        token_c.block = false
        
        state.pos += len
        return true
    }
    
    md.inline.ruler.before('emphasis', 'underline', (state, silent) => {
        const start = state.pos
        const marker = state.src.charCodeAt(start)
        
        if (marker !== 0x5F) return false
        
        if (state.pos + 1 >= state.posMax) return false
        
        const next = state.src.charCodeAt(start + 1)
        if (next === 0x5F) return false
        
        const scanned = state.scanDelims(state.pos, true)
        if (scanned.length === 0) return false
        
        const oldPos = state.pos
        let found = false
        let pos = start + 1
        
        while (pos < state.posMax) {
            if (state.src.charCodeAt(pos) === 0x5F) {
                const scanEnd = state.scanDelims(pos, false)
                if (scanEnd.length > 0) {
                    found = true
                    break
                }
            }
            pos++
        }
        
        if (!found) return false
        
        if (silent) return true
        
        const content = state.src.slice(start + 1, pos)
        
        const token_o = state.push('underline_open', 'u', 1)
        token_o.markup = '_'
        
        const token_t = state.push('text', '', 0)
        token_t.content = content
        
        const token_c = state.push('underline_close', 'u', -1)
        token_c.markup = '_'
        
        state.pos = pos + 1
        return true
    })
    
    md.renderer.rules.underline_open = () => '<u>'
    md.renderer.rules.underline_close = () => '</u>'
}

export function createMarkdownProcessor(isRedmineMode = true) {
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        breaks: true
    })
    
    // Only use underline plugin in Redmine mode
    if (isRedmineMode) {
        md.use(underlinePlugin)
    }
    
    return md
}

export function getMarkdownMode() {
    return localStorage.getItem('reddown-markdown-mode') !== 'standard'
}

export function setMarkdownMode(isRedmineMode) {
    localStorage.setItem('reddown-markdown-mode', isRedmineMode ? 'redmine' : 'standard')
}