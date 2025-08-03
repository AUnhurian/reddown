# 🚀 Reddown - Markdown Editor for Redmine

A modern, feature-rich Markdown editor with live preview specifically designed for Redmine syntax, enhanced with AI-powered content improvement.

## ✨ Features

### 📝 **Markdown Editing**
- **Monaco Editor** with syntax highlighting
- **Live Preview** with real-time rendering
- **Auto-save** to localStorage
- **Redmine-specific syntax** support (`_text_` for underline)

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
- Maintains original content and meaning
- Enhances formatting and structure
- Respects Redmine-specific syntax

### 🎯 **User Experience**
- **Light/Dark theme** toggle
- **Table generator** with visual editor
- **Responsive design** for mobile
- **File operations**: Save, Copy, Clear

## 🚀 Quick Start

### Online Version
Visit: **[https://AUnhurian.github.io/reddown](https://AUnhurian.github.io/reddown)**

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

## 🔧 Redmine Syntax

This editor specifically supports Redmine's unique syntax:

- `_text_` → <u>Underlined text</u> (not italic)
- `*text*` → *Italic text*
- `**text**` → **Bold text**
- Standard Markdown for everything else

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