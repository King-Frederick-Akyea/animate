# 🎬 Animate - AI-Powered Cartoon Animation Creator

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-3.0-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)

**Create stunning animated cartoon stories with AI in minutes, not hours.**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Deployment](#-deployment)

</div>

---

## 📖 Overview

**Animate** is a cutting-edge web application that revolutionizes cartoon animation creation. Using advanced AI technologies, it transforms simple text prompts into complete animated stories with characters, scenes, dialogue, and voiceovers. Perfect for content creators, educators, parents, and storytellers who want to bring their ideas to life without technical expertise.

### ✨ What Makes It Special

- **Zero Learning Curve**: Just describe your story idea, and AI handles the rest
- **End-to-End Pipeline**: From story generation to final video export in one platform
- **Professional Quality**: Export high-resolution MP4 videos ready for sharing
- **Fully Customizable**: Edit every aspect - characters, scenes, dialogue, and timing
- **Real-time Preview**: See your animation come to life as you build it

---

## 🎯 Features

### 🎨 AI Story Generation

- **Intelligent Story Creation**: Generate complete stories from simple prompts
- **Customizable Parameters**: Control genre, age group, and story length
- **Structured Output**: Automatically parses stories into scenes with dialogue
- **Multiple AI Models**: Supports Groq (Llama) and Hugging Face with automatic fallback
- **Rate Limiting**: Built-in protection against API abuse

### 👥 Smart Character Creation

- **AI-Powered Character Design**: Describe your character, AI generates the image
- **DiceBear Integration**: Automatic avatar generation with multiple styles
- **Character Management**: Duplicate, delete, and organize characters
- **Scene Integration**: Drag-and-drop characters into scenes with real-time positioning
- **Visual Customization**: Adjust scale, position, and expressions

### 🏞️ Intelligent Scene Generation

- **Context-Aware Backgrounds**: Scenes match your story's locations and genre
- **Unsplash Integration**: High-quality background images
- **Location-Based Selection**: Automatically selects appropriate backgrounds (forest, castle, beach, etc.)
- **Story Integration**: Scenes automatically include relevant characters from your story
- **Manual Override**: Generate custom scenes with specific descriptions

### 🔊 Audio & Voiceover

- **Text-to-Speech**: Convert dialogue to natural-sounding voiceovers
- **Multiple Voices**: Choose from various AI voices (Groq TTS)
- **Scene-Specific Audio**: Attach audio to individual scenes
- **Dialogue Selection**: Easily select dialogue from story scenes
- **Audio Playback**: Preview audio before adding to scenes

### 🎬 Animation & Playback

- **Real-time Preview**: Watch your animation as you build it
- **Scene Transitions**: Smooth transitions between scenes
- **Character Animation**: Characters positioned and scaled in scenes
- **Playback Controls**: Play, pause, skip scenes, adjust volume
- **All Scenes Mode**: Automatically play through entire story

### 📤 Video Export

- **MP4 Export**: High-quality video output (720p, 1080p)
- **FFmpeg Integration**: Professional video encoding using FFmpeg.wasm
- **Audio Synchronization**: Perfect audio-video sync
- **Multiple Resolutions**: Export in SD, HD, or Full HD
- **Progress Tracking**: Real-time export progress with detailed status

### 💾 Project Management

- **Save & Load**: Persist projects in Supabase database
- **Project Dashboard**: View and manage all your projects
- **Auto-save**: Automatic saving of changes
- **Project Organization**: Multiple projects with unique IDs
- **Data Persistence**: All scenes, characters, and audio saved securely

### 🎨 Modern UI/UX

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Theme**: Beautiful dark mode interface
- **Drag & Drop**: Intuitive character positioning
- **Real-time Updates**: Instant visual feedback
- **Toast Notifications**: Clear status messages for all actions

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Lucide React](https://lucide.dev/) (Icons)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

### Backend & Database

- **Backend**: Next.js API Routes
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for future media storage)

### AI & ML Services

- **Story Generation**:
  - [Groq API](https://console.groq.com/) (Primary - Llama models)
  - [Hugging Face](https://huggingface.co/) (Fallback)
- **Text-to-Speech**: [Groq TTS](https://console.groq.com/) (PlayAI TTS)
- **Character Generation**: [DiceBear API](https://dicebear.com/)
- **Image Search**: [Unsplash API](https://unsplash.com/developers) (Optional)

### Video Processing

- **Video Encoding**: [FFmpeg.wasm](https://ffmpegwasm.netlify.app/)
- **Format**: MP4 (H.264/AAC)
- **Resolution**: 480p, 720p, 1080p

### Development Tools

- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Version Control**: Git

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Supabase Account** ([Sign up free](https://supabase.com/))
- **Groq API Key** ([Get free key](https://console.groq.com/))
- **Git** ([Download](https://git-scm.com/))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/animate.git
   cd animate
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Supabase Configuration (Required)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Groq API (Required for story generation and TTS)
   GROQ_API_KEY=your_groq_api_key

   # Hugging Face (Optional - fallback for story generation)
   HUGGINGFACE_API_TOKEN=your_huggingface_token

   # Unsplash (Optional - for better background images)
   UNSPLASH_ACCESS_KEY=your_unsplash_access_key
   ```

4. **Set up Supabase Database**

   Run these SQL commands in your Supabase SQL Editor:

   ```sql
   -- Projects table
   CREATE TABLE projects (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     title TEXT NOT NULL,
     story_text TEXT,
     user_id UUID REFERENCES auth.users(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Scenes table
   CREATE TABLE scenes (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
     scene_number INTEGER NOT NULL,
     description TEXT,
     background_image_url TEXT,
     audio_url TEXT,
     duration INTEGER DEFAULT 5,
     animations JSONB DEFAULT '[]',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Characters table
   CREATE TABLE characters (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     description TEXT,
     character_type TEXT DEFAULT 'cartoon',
     image_url TEXT,
     is_ai_generated BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Scene Characters (junction table)
   CREATE TABLE scene_characters (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
     character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
     position_x NUMERIC DEFAULT 50,
     position_y NUMERIC DEFAULT 50,
     scale NUMERIC DEFAULT 1.0,
     expression TEXT DEFAULT 'happy',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
   ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
   ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
   ALTER TABLE scene_characters ENABLE ROW LEVEL SECURITY;

   -- Create policies (adjust based on your auth needs)
   CREATE POLICY "Users can view own projects" ON projects
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can create projects" ON projects
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update own projects" ON projects
     FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete own projects" ON projects
     FOR DELETE USING (auth.uid() = user_id);

   -- Similar policies for scenes, characters, and scene_characters
   -- (Add as needed based on your requirements)
   ```

5. **Get API Keys**

   - **Groq API Key**:

     1. Visit [console.groq.com](https://console.groq.com/)
     2. Sign up for a free account
     3. Navigate to API Keys section
     4. Create a new API key
     5. Accept terms for `playai-tts` model if using TTS

   - **Hugging Face Token** (Optional):

     1. Visit [huggingface.co](https://huggingface.co/)
     2. Create account and go to Settings → Access Tokens
     3. Create a new token with read permissions

   - **Unsplash Access Key** (Optional):
     1. Visit [unsplash.com/developers](https://unsplash.com/developers)
     2. Create a developer account
     3. Create a new application
     4. Copy your Access Key

6. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

7. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📚 Usage Guide

### Creating Your First Animation

1. **Create a New Project**

   - Click "New Project" on the dashboard
   - Enter a project name
   - You'll be redirected to the editor

2. **Generate a Story**

   - Enter a story prompt (e.g., "A story about a brave bear and a friendly bee")
   - Optionally customize:
     - **Genre**: Fantasy, Adventure, Sci-Fi, etc.
     - **Age Group**: Children, Teens, All Ages
     - **Length**: Short, Medium, Long
   - Click "Generate Story"
   - Wait for AI to create your story (usually 10-30 seconds)

3. **Review Generated Scenes**

   - The story automatically creates scenes with backgrounds
   - Characters are automatically added to scenes
   - Review each scene in the scene list

4. **Customize Characters**

   - Click "Generate Character with AI"
   - Enter character name and detailed description
   - AI generates a character image matching your description
   - Drag characters to reposition in scenes

5. **Add Audio**

   - Click "Generate Voiceover" button
   - Select dialogue from a scene or enter custom text
   - Choose a voice
   - Click "Generate Audio"
   - Click "Insert into Scene" to attach audio

6. **Preview Animation**

   - Click "Play" to preview the current scene
   - Use playback controls to navigate scenes
   - Click "Play All Scenes" to watch the full animation

7. **Export Video**
   - Click "Export as Video"
   - Choose format (MP4) and resolution (720p recommended)
   - Wait for export to complete (may take 1-5 minutes)
   - Download your video file

### Advanced Features

- **Manual Scene Creation**: Create custom scenes without story generation
- **Character Duplication**: Duplicate characters for variations
- **Scene Editing**: Modify scene descriptions and backgrounds
- **Character Positioning**: Drag characters to exact positions
- **Audio Timing**: Audio automatically syncs with scene duration

---

## 📁 Project Structure

```
animate/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── ai/
│   │   │   ├── character/        # Character generation API
│   │   │   └── scene/            # Scene generation API
│   │   ├── audio/
│   │   │   └── speech/           # Text-to-speech API
│   │   ├── export/
│   │   │   └── download/         # Video export API
│   │   └── story/                # Story generation API
│   ├── auth/                     # Authentication pages
│   │   ├── signin/
│   │   └── signup/
│   ├── dashboard/                # Project dashboard
│   ├── editor/
│   │   └── [projectId]/          # Editor page (dynamic)
│   ├── play/
│   │   └── [projectId]/          # Playback page (dynamic)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── lib/                          # Shared libraries
│   ├── supabase.ts              # Supabase client
│   ├── storyParser.ts           # Story text parser
│   ├── type.ts                  # TypeScript types
│   └── utils.ts                 # Utility functions
├── utils/                        # Utility modules
│   ├── videoGenerator.ts        # FFmpeg video generator
│   └── simpleVideoGenerator.ts  # Fallback generator
├── types/                        # Type definitions
│   └── ffmpeg.d.ts              # FFmpeg types
├── public/                       # Static assets
├── .env.local                    # Environment variables (not in git)
├── next.config.ts               # Next.js configuration
├── package.json                  # Dependencies
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

---

## 🔌 API Documentation

### Story Generation

**Endpoint**: `POST /api/story`

**Request Body**:

```json
{
  "prompt": "A story about a brave bear",
  "genre": "fantasy",
  "ageGroup": "children",
  "length": "medium"
}
```

**Response**:

```json
{
  "success": true,
  "story": "=== STORY START ===\nTITLE: ...",
  "model": "llama-3.1-8b-instant"
}
```

### Audio Generation

**Endpoint**: `POST /api/audio/speech`

**Request Body**:

```json
{
  "text": "Hello, this is a test",
  "voice": "Fritz-PlayAI",
  "response_format": "wav"
}
```

**Response**:

```json
{
  "success": true,
  "audio": "base64_encoded_audio",
  "format": "wav",
  "length": 105680
}
```

### Character Generation

**Endpoint**: `POST /api/ai/character`

**Request Body**:

```json
{
  "characterName": "Brave Bear",
  "description": "A friendly brown bear with a red scarf"
}
```

**Response**:

```json
{
  "name": "Brave Bear",
  "imageUrl": "https://...",
  "description": "..."
}
```

### Scene Generation

**Endpoint**: `POST /api/ai/scene`

**Request Body**:

```json
{
  "sceneNumber": 1,
  "sceneTitle": "The Forest",
  "sceneLocation": "A magical forest",
  "storyTitle": "Brave Bear Adventure",
  "storyGenre": "fantasy"
}
```

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**

   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `GROQ_API_KEY`
     - `HUGGINGFACE_API_TOKEN` (optional)
     - `UNSPLASH_ACCESS_KEY` (optional)

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live!

### Deploy to Other Platforms

The app can be deployed to any platform supporting Next.js:

- **Netlify**: Use Netlify's Next.js plugin
- **Railway**: Connect GitHub repo
- **AWS Amplify**: Import from GitHub
- **Self-hosted**: Use Docker with Node.js

---

## 🧪 Development

### Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Environment Variables

All environment variables should be set in `.env.local`:

| Variable                        | Required | Description                       |
| ------------------------------- | -------- | --------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅       | Supabase project URL              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅       | Supabase anonymous key            |
| `GROQ_API_KEY`                  | ✅       | Groq API key for story/TTS        |
| `HUGGINGFACE_API_TOKEN`         | ⚠️       | Hugging Face token (fallback)     |
| `UNSPLASH_ACCESS_KEY`           | ⚠️       | Unsplash key (better backgrounds) |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with clear messages**
   ```bash
   git commit -m "Add amazing feature"
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Contribution Guidelines

- Follow TypeScript best practices
- Write clear commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation if needed

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Groq](https://groq.com/) - Fast AI inference
- [FFmpeg](https://ffmpeg.org/) - Video processing
- [DiceBear](https://dicebear.com/) - Avatar generation
- [Unsplash](https://unsplash.com/) - Beautiful images

---

## 📞 Support

- **Documentation**: Check this README and code comments
- **Issues**: [GitHub Issues](https://github.com/yourusername/animate/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/animate/discussions)

---

## 🗺️ Roadmap

- [ ] User authentication and project sharing
- [ ] More AI voice options
- [ ] Character animation (walking, talking)
- [ ] Lip-sync for dialogue
- [ ] Scene transitions and effects
- [ ] Music and sound effects library
- [ ] Collaboration features
- [ ] Mobile app version
- [ ] Template library
- [ ] Export to YouTube directly

---

<div align="center">

**Made with ❤️ by the Animate Team**

⭐ Star this repo if you find it helpful!

[⬆ Back to Top](#-animate---ai-powered-cartoon-animation-creator)

</div>
