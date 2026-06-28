import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Generate screenplay / storyboard scenes via Gemini 3.5 Flash
app.post('/api/generate-scenes', async (req, res) => {
  try {
    const { prompt, style, duration, motionIntensity } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in your Secrets panel.' });
    }
    
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `You are an expert cinematic storyboard director, cinematic editor, and screenwriter.
Your task is to take a user's prompt and transform it into a highly detailed, coherent scene-by-scene script and animation storyboard for an AI-generated video.
Each generated video MUST consist of 3 to 5 sequentially consistent scenes that tell a visual story or capture an emotional mood perfectly.
Choose a matching soundtrack style and select particle overlay effects.
Each scene must be highly descriptive and contain camera motion controls (zoom-in, zoom-out, pan-left, pan-right, dolly-in, orbit) with speed and intensity details.
Importantly, generate procedural styling attributes (hex background, shape colors, glows, accent tones) that match the chosen style aesthetic (Cinematic, Noir, Synthwave, or Anime) so the application can render a stunning dynamic canvas fallback preview.`;

    const promptText = `Generate a video storyboard structure for the prompt: "${prompt}".
Style choice: "${style || 'Cinematic'}"
Desired overall length: approx ${duration || 15} seconds.
Motion Intensity level: "${motionIntensity || 'medium'}".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Cinematic title of the generated video.' },
            mood: { type: Type.STRING, description: 'Visual style/mood: Cinematic, Noir, Synthwave, or Anime.' },
            soundtrackPreset: { type: Type.STRING, description: 'Recommended soundtrack preset: retro_synthwave, ambient_dark, fantasy_orchestra, or lofi_chill.' },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Unique identifier for the scene (e.g. scene_1).' },
                  title: { type: Type.STRING, description: 'Brief scene title or shot name.' },
                  narration: { type: Type.STRING, description: 'Narration voiceover script or detailed screenplay subtitle.' },
                  visualDescription: { type: Type.STRING, description: 'Detailed visual prompt describing characters, foreground, background, lighting, and layout.' },
                  imagePrompt: { type: Type.STRING, description: 'Short optimized prompt for text-to-image generator models (Imagen 3).' },
                  duration: { type: Type.NUMBER, description: 'Duration of the scene in seconds (typically between 3.0 and 6.0).' },
                  cameraMotion: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: 'Type of camera transition: zoom-in, zoom-out, pan-left, pan-right, dolly-in, orbit.' },
                      speed: { type: Type.STRING, description: 'Speed of the transition: slow, medium, fast.' },
                      intensity: { type: Type.NUMBER, description: 'Intensity score from 0.1 to 1.0.' }
                    },
                    required: ['type', 'speed', 'intensity']
                  },
                  overlayText: { type: Type.STRING, description: 'Text overlay caption shown on screen during this scene.' },
                  particleEffect: { type: Type.STRING, description: 'Visual particle filter effect: rain, snow, embers, grid, dust, none.' },
                  proceduralStyle: {
                    type: Type.OBJECT,
                    properties: {
                      backgroundColor: { type: Type.STRING, description: 'Hex color for the canvas background.' },
                      primaryColor: { type: Type.STRING, description: 'Hex color for primary shapes/layers.' },
                      secondaryColor: { type: Type.STRING, description: 'Hex color for secondary elements/glows.' },
                      accentColor: { type: Type.STRING, description: 'Hex accent color (like bright neon pink or warm yellow).' },
                      glowColor: { type: Type.STRING, description: 'RGBA glow styling for effects.' }
                    },
                    required: ['backgroundColor', 'primaryColor', 'secondaryColor', 'accentColor', 'glowColor']
                  }
                },
                required: ['id', 'title', 'narration', 'visualDescription', 'imagePrompt', 'duration', 'cameraMotion', 'overlayText', 'particleEffect', 'proceduralStyle']
              }
            }
          },
          required: ['title', 'mood', 'soundtrackPreset', 'scenes']
        }
      }
    });

    const parsedData = JSON.parse(response.text);
    res.json(parsedData);
  } catch (err: any) {
    console.error('Error generating scenes:', err);
    res.status(500).json({ error: err.message || 'Failed to generate video scenes.' });
  }
});

// Generate realistic keyframes via Gemini 2.5 Flash Image
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in your Secrets panel.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    console.log('Generating image for prompt:', prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt || 'Cinematic conceptual landscape, 8k resolution, photorealistic, high visual quality' }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || '16:9',
        }
      }
    });

    let base64Data = '';
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Data) {
      return res.status(400).json({ error: 'No image data returned from Gemini Image.' });
    }

    res.json({ imageUrl: `data:image/png;base64,${base64Data}` });
  } catch (err: any) {
    console.error('Image generation error:', err);
    res.status(500).json({ 
      error: 'image_generation_failed', 
      message: err.message || 'Failed to generate image.' 
    });
  }
});

// Community Feed System with persistent local JSON DB
const POSTS_DB_PATH = path.resolve(__dirname, 'posts-db.json');

interface Comment {
  id: string;
  authorEmail: string;
  text: string;
  timestamp: string;
}

interface CommunityPost {
  id: string;
  authorEmail: string;
  title: string;
  mood: string;
  projectData: any;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  createdAt: string;
}

// Function to safely initialize & load posts database
function loadPostsDB(): CommunityPost[] {
  try {
    if (fs.existsSync(POSTS_DB_PATH)) {
      const rawData = fs.readFileSync(POSTS_DB_PATH, 'utf8');
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error('Error reading posts database, falling back to initial seed data:', error);
  }

  // Pre-seed some gorgeous cinematic user creations to make the feed beautiful and interactive from the start!
  const seedPosts: CommunityPost[] = [
    {
      id: 'seed-cyberpunk-syndicate',
      authorEmail: 'hendjack45@gmail.com',
      title: 'The Neon Syndicate',
      mood: 'Synthwave',
      projectData: {
        id: 'seed-cyberpunk',
        title: 'The Neon Syndicate',
        mood: 'Synthwave',
        soundtrackPreset: 'retro_synthwave',
        scenes: [
          {
            id: 'sc1',
            title: 'Neon Rainfall',
            narration: 'Beneath the obsidian towers of Neo-Vigo, memory merchants peddle digital dreams in the rain.',
            visualDescription: 'Cyberpunk street with giant neon billboards, heavy rain, glowing asphalt reflections, purple and teal aesthetic',
            imagePrompt: 'Cyberpunk street with giant neon billboards, heavy rain, glowing asphalt reflections, futuristic cinematic 35mm composition, purple and teal aesthetic',
            duration: 5,
            cameraMotion: { type: 'zoom-in', speed: 'slow', intensity: 0.5 },
            overlayText: 'NEO-VIGO DISTRICT: 2099',
            particleEffect: 'rain',
            proceduralStyle: { backgroundColor: '#070514', primaryColor: '#2b0b45', secondaryColor: '#ff007f', accentColor: '#00f6ff', glowColor: 'rgba(255, 0, 127, 0.4)' },
            imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80'
          },
          {
            id: 'sc2',
            title: 'The Alleyway Dealer',
            narration: 'In the shadows of Sector 4, a cybernetic silhouette waits. The package is secure.',
            visualDescription: 'Mysterious figure in dark techwear raincoat with glowing trim walking down narrow cyberpunk alley, cozy soft lighting',
            imagePrompt: 'Mysterious figure in dark techwear raincoat with glowing trim walking down narrow cyberpunk alley, rain, cozy soft lighting, cinema visual',
            duration: 5,
            cameraMotion: { type: 'pan-right', speed: 'medium', intensity: 0.7 },
            overlayText: 'THE TRANSACTION',
            particleEffect: 'rain',
            proceduralStyle: { backgroundColor: '#050508', primaryColor: '#12121e', secondaryColor: '#ff0055', accentColor: '#39ff14', glowColor: 'rgba(57, 255, 20, 0.3)' },
            imageUrl: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=1200&q=80'
          }
        ]
      },
      likes: 124,
      likedBy: ['alpha@cinematic.io', 'beta@scifi.net'],
      comments: [
        { id: 'c1', authorEmail: 'synth_fan_99@hotmail.com', text: 'This looks incredibly authentic! The neon reflections and ambient dark tune are immaculate.', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
        { id: 'c2', authorEmail: 'vfx_director@creative.org', text: 'The camera movement timing perfectly tracks the soundtrack beats. Remarkable work!', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
      ],
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'seed-ancient-monolith',
      authorEmail: 'sara.director@gmail.com',
      title: 'Obsidian Sands',
      mood: 'Noir',
      projectData: {
        id: 'seed-desert',
        title: 'Obsidian Sands',
        mood: 'Noir',
        soundtrackPreset: 'ambient_dark',
        scenes: [
          {
            id: 'sc3',
            title: 'Monolith Ascent',
            narration: 'Lost among shifting dunes, a towering spire of liquid glass absorbs the final embers of the sun.',
            visualDescription: 'Epic tall black obsidian monolith standing in desert sand storm, warm setting sun, mysterious ancient sci-fi architecture',
            imagePrompt: 'Epic tall black obsidian monolith standing in desert sand storm, warm setting sun, mysterious ancient sci-fi architecture',
            duration: 6,
            cameraMotion: { type: 'orbit', speed: 'slow', intensity: 0.8 },
            overlayText: 'OBSIDIAN MONOLITH - KERNELS',
            particleEffect: 'embers',
            proceduralStyle: { backgroundColor: '#150f0a', primaryColor: '#301c10', secondaryColor: '#d97706', accentColor: '#ffffff', glowColor: 'rgba(217, 119, 6, 0.4)' },
            imageUrl: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=1200&q=80'
          }
        ]
      },
      likes: 89,
      likedBy: ['hendjack45@gmail.com'],
      comments: [
        { id: 'c3', authorEmail: 'dune_rider@outerspace.com', text: 'Stunning monolith visual. Generates a real sense of deep-space isolation.', timestamp: new Date(Date.now() - 3600000 * 12).toISOString() }
      ],
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
    }
  ];

  savePostsDB(seedPosts);
  return seedPosts;
}

// Function to safely persist posts to disk
function savePostsDB(posts: CommunityPost[]) {
  try {
    fs.writeFileSync(POSTS_DB_PATH, JSON.stringify(posts, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing posts database:', error);
  }
}

// REST API Endpoints for Community Board
app.get('/api/posts', (req, res) => {
  const posts = loadPostsDB();
  res.json(posts);
});

app.post('/api/posts', (req, res) => {
  try {
    const { authorEmail, title, mood, projectData } = req.body;

    if (!authorEmail || !title || !projectData) {
      return res.status(400).json({ error: 'Missing required post fields: authorEmail, title, projectData' });
    }

    const posts = loadPostsDB();
    const newPost: CommunityPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      authorEmail,
      title,
      mood: mood || 'Cinematic',
      projectData,
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: new Date().toISOString()
    };

    posts.unshift(newPost);
    savePostsDB(posts);

    res.status(201).json(newPost);
  } catch (err: any) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: err.message || 'Failed to publish post' });
  }
});

app.post('/api/posts/:id/like', (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required to like a post' });
    }

    const posts = loadPostsDB();
    const postIndex = posts.findIndex(p => p.id === id);

    if (postIndex === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = posts[postIndex];
    const likedIndex = post.likedBy.indexOf(userEmail);

    if (likedIndex > -1) {
      // Unlike
      post.likedBy.splice(likedIndex, 1);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // Like
      post.likedBy.push(userEmail);
      post.likes += 1;
    }

    posts[postIndex] = post;
    savePostsDB(posts);

    res.json({ id: post.id, likes: post.likes, likedBy: post.likedBy });
  } catch (err: any) {
    console.error('Error liking post:', err);
    res.status(500).json({ error: err.message || 'Failed to toggle like' });
  }
});

app.post('/api/posts/:id/comment', (req, res) => {
  try {
    const { id } = req.params;
    const { authorEmail, text } = req.body;

    if (!authorEmail || !text || !text.trim()) {
      return res.status(400).json({ error: 'Comment author and text are required' });
    }

    const posts = loadPostsDB();
    const postIndex = posts.findIndex(p => p.id === id);

    if (postIndex === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      authorEmail,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    posts[postIndex].comments.push(newComment);
    savePostsDB(posts);

    res.status(201).json(newComment);
  } catch (err: any) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: err.message || 'Failed to post comment' });
  }
});

const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = await fs.promises.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
});
