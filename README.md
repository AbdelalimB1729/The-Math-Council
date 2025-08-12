# The Math Council 🧮

An interactive AI-powered mathematical debate simulation where fictional AI mathematicians with unique personalities debate complex problems in real-time.

## 🌟 Features

- **AI Mathematicians**: 7 unique personalities with different specialties and approaches
- **Real-time Debate**: Watch live discussions unfold with Socket.IO
- **Interactive Controls**: Pause, resume, kick participants, add new members
- **PDF Export**: Download complete debate transcripts
- **SQLite Storage**: All conversations and sessions are persisted
- **Beautiful UI**: Modern Bootstrap interface with real-time updates

## 🎭 Meet the Council

- **Professor Euclid**: Rigorous geometric proofs and classical mathematics
- **Dr. Chaos**: Probability theory and statistical analysis
- **Ms. Approximation**: Practical estimation and numerical methods
- **The Trickster**: Deliberately challenging conventional wisdom
- **The Philosopher**: Deep mathematical philosophy and foundations
- **Dr. Algorithm**: Computational methods and algorithmic thinking
- **Professor Infinity**: Abstract algebra and theoretical mathematics

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: EJS + Bootstrap 5
- **Database**: SQLite (better-sqlite3)
- **AI API**: OpenRouter (GPT-3.5-turbo)
- **Real-time**: Socket.IO
- **PDF Generation**: PDFKit
- **Styling**: Bootstrap Icons

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd the-math-council
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=your_api_key_here
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

5. **Visit the application**
   Open your browser and go to `http://localhost:3000`

## 🔧 Configuration

### OpenRouter API Setup

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Add it to your `.env` file

**Note**: If no API key is provided, the system will use simulated responses for demonstration purposes.

### Database

The SQLite database (`math_council.db`) will be created automatically on first run. It includes:

- `sessions`: Debate session information
- `participants`: AI mathematician details
- `messages`: All debate messages and timestamps

## 📖 Usage

### Starting a Debate

1. Go to the homepage
2. Enter a mathematical problem
3. Select difficulty level (easy/medium/hard)
4. Choose number of council members (3-7)
5. Click "Start Debate"

### During the Debate

- **Watch**: Real-time messages appear as AI mathematicians respond
- **Pause/Resume**: Control the debate flow
- **Kick Members**: Remove participants you don't want
- **Add Members**: Introduce new personalities mid-debate
- **Force Vote**: End the debate early
- **Export PDF**: Download the complete transcript

### Example Problems

**Easy**: "What is the area of a circle with radius 5 units?"

**Medium**: "Find all real solutions to the equation x³ - 6x² + 11x - 6 = 0"

**Hard**: "Prove that the sum of the reciprocals of the first n natural numbers diverges as n approaches infinity"

## 🏗️ Project Structure

```
the-math-council/
├── server.js              # Main Express server
├── database.js            # SQLite database setup
├── ai-personalities.js    # AI mathematician definitions
├── ai-service.js          # OpenRouter API integration
├── debate-manager.js      # Core debate logic
├── pdf-generator.js       # PDF export functionality
├── views/                 # EJS templates
│   ├── layout.ejs        # Main layout template
│   ├── index.ejs         # Homepage
│   ├── debate.ejs        # Debate page
│   ├── sessions.ejs      # Past debates list
│   └── error.ejs         # Error page
├── package.json           # Dependencies and scripts
├── env.example           # Environment variables template
└── README.md             # This file
```

## 🔌 API Endpoints

### Web Routes
- `GET /` - Homepage
- `GET /debate/:id` - Debate session page
- `GET /sessions` - Past debates list
- `POST /create-session` - Create new debate session
- `GET /debate/:id/export` - Export debate as PDF

### API Routes
- `GET /api/session/:id` - Get session data
- `POST /api/session/:id/generate-response` - Generate next AI response
- `POST /api/session/:id/pause` - Pause debate
- `POST /api/session/:id/resume` - Resume debate
- `POST /api/session/:id/force-vote` - Force debate end
- `POST /api/session/:id/kick-participant/:participantId` - Remove participant
- `POST /api/session/:id/add-participant` - Add new participant

## 🎯 Features in Detail

### Real-time Communication
- Socket.IO for live message updates
- Typing indicators when AI is thinking
- Session state synchronization

### Interactive Controls
- Pause/resume debate flow
- Kick out unwanted participants
- Add new AI personalities mid-session
- Force final vote to end debate

### PDF Export
- Complete debate transcript
- Participant information and specialties
- Timestamps and session details
- Professional formatting

### Database Persistence
- All sessions stored in SQLite
- Message history preserved
- Participant information tracked
- Session metadata maintained

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port in .env file
   PORT=3001
   ```

2. **Database errors**
   ```bash
   # Delete the database file to reset
   rm math_council.db
   ```

3. **OpenRouter API errors**
   - Check your API key in `.env`
   - Verify your OpenRouter account has credits
   - Check network connectivity

4. **Socket.IO connection issues**
   - Ensure no firewall blocking port 3000
   - Check browser console for errors

### Development

For development with auto-restart:
```bash
npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenRouter for providing AI API access
- Bootstrap for the beautiful UI components
- Socket.IO for real-time communication
- The mathematical community for inspiration

---

**The Math Council** - Where AI mathematicians debate the universe's most fascinating problems! 🧮✨
