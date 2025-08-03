<div align="center">
  <img src="./images/apple-touch-icon.png" alt="Reddown Logo" width="120" height="120">
  
  # 🚀 Reddown - Markdown Editor for Redmine
  
  A modern, feature-rich Markdown editor with live preview specifically designed for Redmine syntax, enhanced with AI-powered content improvement.
  
  [![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://AUnhurian.github.io/reddown/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Made with Vite](https://img.shields.io/badge/Made%20with-Vite-646CFF.svg)](https://vitejs.dev/)
  [![AI Powered](https://img.shields.io/badge/AI-Powered-blueviolet)](https://openai.com/)
</div>

## ✨ Features

### 📝 **Markdown Editing**
- **Monaco Editor** with syntax highlighting
- **Live Preview** with real-time rendering
- **Auto-save** to localStorage
- **Dual Mode Support**: Switch between Redmine and Standard Markdown
- **Smart Mode Detection** with visual toggle

### 🎨 **Rich Formatting Toolbar**
- Text formatting: **Bold**, *Italic*, _Underline_, `Code`
- Headings: H1-H6
- Lists: Ordered & Unordered
- Insert: Links, Images, Tables, Code blocks

### ⌨️ **IDE-like Features**
- Duplicate line: `Cmd+D`
- Delete line: `Cmd+Delete`
- Move lines: `Alt+↑/↓`
- Full keyboard shortcuts for all formatting

### 🤖 **AI Enhancement**
- **OpenAI integration** for content improvement
- **Mode-aware prompts**: Different AI behavior for Redmine vs Standard
- Maintains original content and meaning
- Enhances formatting and structure
- Respects selected markdown syntax rules

### 🎯 **User Experience**
- **Light/Dark theme** toggle
- **Table generator** with visual editor
- **Responsive design** for mobile
- **File operations**: Save, Copy, Clear

## 🚀 Quick Start

### 🌐 Online Version
Visit: **[https://AUnhurian.github.io/reddown](https://AUnhurian.github.io/reddown)**

### 📱 PWA Support
- Install as a Progressive Web App on mobile and desktop
- Works offline after first load
- Native app-like experience

### Local Development
```bash
# Clone the repository
git clone https://github.com/AUnhurian/reddown.git
cd reddown

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🤖 AI Setup

1. Click the **"🤖 AI"** button in the toolbar
2. Enter your OpenAI API key (starts with `sk-`)
3. Click **"Save Settings"**
4. Use **"🤖 Enhance Current Content"** to improve your markdown

Your API key is stored securely in your browser and never sent to our servers.

## 🔄 Switching Markdown Modes

1. Look for the **mode toggle** in the editor header (next to "Markdown Editor")
2. **Red position** = Redmine Mode (supports underline with `_text_`)
3. **Blue position** = Standard Mode (CommonMark compliant)
4. Your preference is **automatically saved** and restored on next visit
5. AI prompts **automatically adjust** based on selected mode

## ⌨️ Keyboard Shortcuts

### Text Formatting
- `Cmd+B` - **Bold**
- `Cmd+I` - *Italic*
- `Cmd+U` - _Underline_
- `Cmd+\`` - `Code`

### Headings
- `Cmd+1` to `Cmd+6` - H1 to H6

### Lists & Insertions
- `Cmd+Shift+L` - Unordered list
- `Cmd+Shift+O` - Ordered list
- `Cmd+K` - Insert link
- `Cmd+Shift+I` - Insert image
- `Cmd+Shift+C` - Code block
- `Cmd+Shift+T` - Insert table

### Editing
- `Cmd+D` - Duplicate line
- `Cmd+Delete` - Delete line
- `Alt+↑/↓` - Move line

## 🔄 Markdown Modes

Reddown supports two markdown modes that you can switch between using the toggle in the editor header:

### 🔴 Redmine Mode (Default)
Perfect for Redmine documentation and issues:

- `_text_` → <u>Underlined text</u> (Redmine-specific)
- `*text*` → *Italic text*
- `**text**` → **Bold text**
- All standard Markdown features
- AI optimized for Redmine syntax

### 🔵 Standard Mode
Standard CommonMark compliance:

- `_text_` → *Italic text* (standard behavior)
- `*text*` → *Italic text*
- `**text**` → **Bold text**
- `__text__` → **Bold text**
- No underline support (use HTML `<u>text</u>` if needed)
- AI optimized for CommonMark syntax

### 🔧 Mode Features

| Feature | Redmine Mode | Standard Mode |
|---------|--------------|---------------|
| Underline button | ✅ Active | ❌ Disabled |
| `_text_` behavior | Underline | Italic |
| AI Enhancement | Redmine-aware | CommonMark-aware |
| Welcome content | Redmine examples | Standard examples |
| Auto-save mode | ✅ Remembered | ✅ Remembered |

## 🛠️ Tech Stack

- **Vite** - Build tool
- **Monaco Editor** - Code editor
- **markdown-it** - Markdown parser
- **OpenAI API** - AI enhancement
- **Vanilla JS** - No framework dependencies

## 📱 Browser Support

- Chrome/Edge 88+
- Firefox 87+
- Safari 14+

## 📈 Features Overview

| Feature | Description | Status |
|---------|-------------|--------|
| 🔄 Dual Markdown Modes | Redmine + Standard CommonMark | ✅ |
| 🤖 AI Enhancement | OpenAI-powered content improvement | ✅ |
| 📝 Live Preview | Real-time Markdown rendering | ✅ |
| ⌨️ Keyboard Shortcuts | Full IDE-like shortcuts | ✅ |
| 🎨 Themes | Light/Dark mode toggle | ✅ |
| 📊 Table Generator | Visual table creation | ✅ |
| 💾 Auto-save | Local storage persistence | ✅ |
| 📱 PWA | Installable web app | ✅ |
| 🔒 Privacy | Local-only data storage | ✅ |

## 🎯 Use Cases

- **Redmine Documentation** - Perfect for Redmine wikis and issue descriptions with native underline support
- **Standard Markdown** - GitHub README files, documentation sites, and general markdown content
- **Technical Documentation** - Create comprehensive docs with proper formatting in any mode
- **Project Planning** - Organize tasks and specifications with mode-appropriate formatting
- **Code Documentation** - Document APIs and code with syntax highlighting
- **Cross-platform Content** - Switch modes to match your target platform requirements

### 🤖 AI Enhancement in Action

**Redmine Mode:**
```markdown
Input:  Simple list: item1, item2, item3
Output: 
# Enhanced List

## Key Items:
- **Item 1**: Primary component
- **Item 2**: Secondary element  
- **Item 3**: Additional feature

_Enhanced formatting with proper structure and Redmine syntax_
```

**Standard Mode:**
```markdown
Input:  Simple list: item1, item2, item3
Output:
# Enhanced List

## Key Items:
- **Item 1**: Primary component
- *Item 2*: Secondary element  
- **Item 3**: Additional feature

*Enhanced formatting with CommonMark compliance*
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) by Microsoft
- [markdown-it](https://github.com/markdown-it/markdown-it) for Markdown parsing
- [OpenAI](https://openai.com/) for AI enhancement capabilities

---

Made with ❤️ for better Redmine documentation
