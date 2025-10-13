

1. **Start the application**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev
   
   # Or start individually
   npm run server  # Backend only
   npm start       # Frontend only
   ```

2. **Access the application**
   - **Voice Agent**: http://localhost:3000
   - **Admin Dashboard**: http://localhost:3000/backoffice
   - **API Endpoints**: http://localhost:5001/api

## 📁 Project Structure

```
voice-ai-agent/
├── public/                 # Static files
├── src/                   # Frontend source code
│   ├── components/        # React components
│   │   ├── VoiceAgent.tsx # Main voice agent interface
│   │   ├── AdminDashboard.tsx # Admin panel
│   │   └── AdminLogin.tsx # Admin authentication
│   ├── services/          # API services
│   └── App.tsx           # Main application component
├── server.js             # Backend server
├── package.json          # Dependencies and scripts
├── DEPLOYMENT.md         # Detailed deployment guide
├── QUICK_DEPLOY.md       # Quick deployment guide
└── deploy.sh            # Automated deployment script
```



