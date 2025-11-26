# Notes App - Frontend

React frontend for the AI-powered note-taking application.

## 🚀 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **TipTap** - Rich text editor
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Icons** - Icon library
- **Tailwind CSS** - Styling (via CDN/inline)
- **React OAuth Google** - Google authentication

## 📋 Prerequisites

- Node.js 16+
- npm or yarn
- Backend API running

## 🛠️ Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables (Optional)

For local development, the default settings work fine. Create `.env` only if you need custom configuration:

```bash
cp .env.example .env
```

```env
# Optional - defaults to localhost:8000
VITE_API_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

App will be available at `http://localhost:5173`

## 🏗️ Build for Production

```bash
npm run build
```

Build output will be in `/dist` directory.

## 📁 Project Structure

```
frontend/
├── public/
│   └── _redirects        # Netlify SPA routing (legacy)
├── src/
│   ├── components/       # React components
│   │   ├── AIAssistant.jsx
│   │   ├── Editor.jsx
│   │   ├── RichTextEditor.jsx
│   │   ├── Sidebar.jsx
│   │   ├── FolderModal.jsx
│   │   ├── SettingsModal.jsx
│   │   └── MongoDBSetupModal.jsx
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   ├── pages/            # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx
│   │   └── ResetPassword.jsx
│   ├── services/         # API services
│   │   └── api.js
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── netlify.toml          # Netlify configuration
├── package.json          # Dependencies
└── .gitignore           # Git ignore rules
```

## 🎨 Key Features

### Rich Text Editor
- Headings (H1, H2, H3)
- Text formatting (Bold, Italic, Underline, Code)
- Lists (Bullet, Numbered, Checklist)
- Links and highlights
- Markdown support
- Dark mode

### AI Assistant
- Multiple AI models
- Edit mode (AI modifies notes)
- Insert mode (Insert at cursor)
- Chat history
- Model selection

### Organization
- Folder hierarchy
- Drag and drop
- Search and filter
- Note sharing

### Authentication
- Email/Password
- Google OAuth
- Password reset
- JWT sessions

## 🌐 Deployment (Netlify)

### Method 1: Netlify UI

1. Go to [app.netlify.com](https://app.netlify.com)
2. "Add new site" → "Import an existing project"
3. Connect GitHub
4. Configure:
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```
5. Deploy!

### Method 2: Netlify CLI

```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
npm run build
netlify deploy --prod
```

### Important: Update API URLs

Before deploying, update API URLs in:

**`src/services/api.js`:**
```javascript
const API_BASE_URL = 'https://your-backend.onrender.com/api';
```

**`src/pages/Register.jsx`:**
```javascript
//Update fetch URLs from:
'http://localhost:8000/api/auth/register'
// To:
'https://your-backend.onrender.com/api/auth/register'
```

**`src/pages/Login.jsx`:**
```javascript
// Update fetch URLs from:
'http://localhost:8000/api/auth/login'
// To:
'https://your-backend.onrender.com/api/auth/login'
```

## 📝 Configuration Files

### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist/"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This handles client-side routing for React Router.

### package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## 🎨 Styling

The app uses a combination of:
- Inline styles with CSS classes
- CSS modules
- Dynamic className based on state
- Dark mode via CSS variables

## 🔧 API Integration

All API calls go through `src/services/api.js`:

```javascript
import { notesAPI } from '../services/api';

// Example: Get all notes
const notes = await notesAPI.getAllNotes(accessToken);
```

## 🌙 Dark Mode

Dark mode is implemented using:
- CSS classes (`.dark`)
- Tailwind dark mode utilities
- Context-based theme switching

Toggle in Settings modal.

## 🔐 Authentication Flow

1. User logs in (email or Google)
2. Receive JWT access token
3. Store in AuthContext
4. Include in API requests
5. Refresh token when expired

## 🐛 Troubleshooting

**API calls failing:**
- Check API_BASE_URL in `api.js`
- Verify backend is running
- Check CORS settings in backend

**Google OAuth not working:**
- Verify redirect URI in Google Console
- Check client ID in code
- Ensure HTTPS in production

**Build fails:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node --version`
- Review error messages

**Routing not working on Netlify:**
- Ensure `netlify.toml` exists
- Verify redirects configuration
- Check build output directory

## 📦 Dependencies

### Core
- react
- react-dom
- react-router-dom

### UI & Editor
- @tiptap/react
- @tiptap/starter-kit
- @tiptap/extension-*
- react-icons
- marked (Markdown parser)

### Auth & API
- axios
- @react-oauth/google

### Build
- vite
- @vitejs/plugin-react

## 🚀 Performance Tips

1. **Lazy Loading**: Components are loaded on demand
2. **Code Splitting**: Vite automatically splits code
3. **Image Optimization**: Use WebP format
4. **Caching**: Service worker for offline support
5. **Bundle Size**: Keep dependencies minimal

## 📄 License

MIT License - see LICENSE file for details

## 👤 Author

**Kanish** - [kanishshivan@gmail.com](mailto:kanishshivan@gmail.com)
