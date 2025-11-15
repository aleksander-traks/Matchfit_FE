# MatchFit - AI-Powered Fitness Trainer Matching

MatchFit is a mobile-first web application that uses AI to match clients with fitness trainers based on their goals, health conditions, experience, and preferences.

## Features

- **AI-Powered Matching**: Uses OpenAI (via Python service) to generate client overviews and match with expert trainers
- **Comprehensive Intake**: Multi-step wizard collecting fitness goals, experience, health conditions, injuries, and preferences
- **Expert Database**: Pre-seeded with 10 expert trainers with various specializations
- **Real-time Chat**: Message your selected trainer directly
- **Smart Dashboard**: View your trainer, get AI recommendations, and track your progress
- **Mobile-First Design**: Optimized for mobile devices with responsive layouts

## Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Lucide React for icons
- Context API for state management

### Backend
- Node.js with Express
- TypeScript
- JWT authentication
- Supabase (PostgreSQL) for database
- Python service integration for AI features

### Database (Supabase)
- Users, ClientProfiles, Experts, MatchResults, SelectedTrainers, Messages tables
- Row Level Security (RLS) policies
- Full-text search capabilities

## Getting Started

### Prerequisites
- Node.js 18+
- Python service running on port 5000 (for AI features)
- Supabase project (already configured)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_API_URL` - Backend API URL (default: http://localhost:3001/api)
- `PYTHON_SERVICE_URL` - Python AI service URL (default: http://localhost:5000)
- `JWT_SECRET` - Secret for JWT token generation

### Running the Application

1. Start the backend server:
```bash
npm run server
```

2. In a separate terminal, start the frontend:
```bash
npm run dev
```

3. Ensure your Python AI service is running on port 5000

4. Open http://localhost:5173 in your browser

## Project Structure

```
├── server/                 # Backend Express server
│   ├── config/            # Supabase configuration
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API routes
│   └── services/          # Python service client
├── src/
│   ├── components/        # Reusable React components
│   ├── constants/         # Reference data constants
│   ├── context/           # React contexts (Auth, Intake)
│   ├── lib/               # API client
│   └── pages/             # Page components
│       ├── intake/        # Intake wizard steps
│       ├── Chat.tsx       # Chat interface
│       ├── Dashboard.tsx  # User dashboard
│       ├── Landing.tsx    # Landing page
│       └── Matches.tsx    # Match results
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Options (Reference Data)
- `GET /api/options/training-experience`
- `GET /api/options/goals`
- `GET /api/options/chronic-diseases`
- `GET /api/options/injuries`
- And more...

### Client
- `POST /api/client/overview` - Generate AI overview (calls Python service)
- `POST /api/client/intake` - Save intake data
- `POST /api/client/match` - Match with experts (calls Python service)
- `POST /api/client/select-trainer` - Select a trainer
- `PUT /api/client/profile` - Update profile

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### Messages
- `GET /api/messages` - Get conversation messages
- `POST /api/messages` - Send message

## Python Service Integration

The backend communicates with a separate Python service for AI features:

### Expected Endpoints:

1. **Generate Overview** - `POST /generate-overview`
   - Request: `{ training_experience, goals, sessions_per_week, chronic_diseases, injuries, weight_goal }`
   - Response: `{ overview: string }`

2. **Match Experts** - `POST /match-experts`
   - Request: `{ client_overview, experts: [{ id, overview }] }`
   - Response: `{ matches: [{ expert_id, match_score, reason1, reason2 }] }`

## Database Schema

The database includes:
- `users` - User accounts
- `experts` - Pre-seeded trainer database
- `client_profiles` - Client intake data and overview
- `match_results` - AI-generated matches with scores and reasons
- `selected_trainers` - User's chosen trainer
- `messages` - Client-trainer conversations

All tables have Row Level Security enabled.

## Development Notes

- The intake wizard generates the client overview in the background during Step 2
- Match scores are stored as decimals (0-1) and displayed as percentages
- Anonymous users can complete intake and see matches, but must log in to select a trainer
- The chat interface supports real-time messaging between clients and trainers

## Build

Build the production bundle:
```bash
npm run build
```

## License

Private project
