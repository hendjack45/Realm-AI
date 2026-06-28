import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Toast from './components/Toast';
// @ts-ignore
import realmLogo from './assets/images/realm_logo_1782602029019.jpg';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Image as ImageIcon, 
  Settings, Film, Music, Type, Download, Trash2, Edit3, Save, Plus, ChevronRight,
  MonitorPlay, Check, Loader2, Info, Eye, Sliders, ExternalLink, Coins, Crown, Tv, X,
  Heart, MessageSquare, Share2, Send, Users
} from 'lucide-react';

// Interfaces for our video screenplay structure
interface CameraMotion {
  type: string; // zoom-in, zoom-out, pan-left, pan-right, dolly-in, orbit
  speed: string; // slow, medium, fast
  intensity: number; // 0.1 to 1.0
}

interface ProceduralStyle {
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
}

interface Scene {
  id: string;
  title: string;
  narration: string;
  visualDescription: string;
  imagePrompt: string;
  duration: number; // in seconds
  cameraMotion: CameraMotion;
  overlayText: string;
  particleEffect: string; // rain, snow, embers, grid, dust, none
  proceduralStyle: ProceduralStyle;
  imageUrl?: string; // If generated via Imagen AI
}

interface VideoProject {
  id: string;
  title: string;
  prompt: string;
  mood: 'Cinematic' | 'Noir' | 'Synthwave' | 'Anime';
  soundtrackPreset: 'retro_synthwave' | 'ambient_dark' | 'fantasy_orchestra' | 'lofi_chill';
  scenes: Scene[];
}

const RELATED_THUMBNAILS = [
  {
    id: 'cyberpunk-neon-ref',
    title: 'Cyberpunk Neon Alley',
    mood: 'Synthwave' as const,
    description: 'Vivid magenta, cybernetic rain, and reflection effects.',
    imageUrl: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=400&auto=format&fit=crop&q=60',
    proceduralStyle: {
      backgroundColor: '#0c071d',
      primaryColor: '#ff007f',
      secondaryColor: '#00f0ff',
      accentColor: '#ffff00',
      glowColor: 'rgba(255, 0, 127, 0.4)'
    },
    cameraMotion: { type: 'zoom-in', speed: 'medium', intensity: 1.5 },
    particleEffect: 'rain',
    overlayText: 'SYSTEM OFFLINE • SECTOR 4',
    narration: 'Raindrops sizzle against hot cybernetic circuitry. The city never speaks.'
  },
  {
    id: 'stellar-odyssey-ref',
    title: 'Interstellar Odyssey',
    mood: 'Cinematic' as const,
    description: 'Deep starlight, cosmic dust drifting, and camera tilt.',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=60',
    proceduralStyle: {
      backgroundColor: '#03020c',
      primaryColor: '#6366f1',
      secondaryColor: '#a855f7',
      accentColor: '#38bdf8',
      glowColor: 'rgba(99, 102, 241, 0.4)'
    },
    cameraMotion: { type: 'orbit', speed: 'medium', intensity: 1.2 },
    particleEffect: 'embers',
    overlayText: 'STELLAR BOUNDARY LIMITS',
    narration: 'Venturing into the unknown depths of the galactic core. Starlight is eternal.'
  },
  {
    id: 'noir-detective-ref',
    title: 'Noir Detective Room',
    mood: 'Noir' as const,
    description: 'Vintage high contrast, blinds shadows, smoke trails.',
    imageUrl: 'https://images.unsplash.com/photo-1496302662116-35cc4f36df92?w=400&auto=format&fit=crop&q=60',
    proceduralStyle: {
      backgroundColor: '#111111',
      primaryColor: '#444444',
      secondaryColor: '#888888',
      accentColor: '#ffffff',
      glowColor: 'rgba(255, 255, 255, 0.15)'
    },
    cameraMotion: { type: 'pan-right', speed: 'medium', intensity: 1.0 },
    particleEffect: 'dust',
    overlayText: 'THE LAST CORONER REPORT',
    narration: 'Rain beat a heavy drum on the window pane. Dust motes danced in the projector light.'
  },
  {
    id: 'desert-solitude-ref',
    title: 'Solitary Desert Dawn',
    mood: 'Cinematic' as const,
    description: 'Warm solar flare, low horizon sweep, glowing sun.',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&auto=format&fit=crop&q=60',
    proceduralStyle: {
      backgroundColor: '#1c100b',
      primaryColor: '#ea580c',
      secondaryColor: '#ca8a04',
      accentColor: '#fdba74',
      glowColor: 'rgba(234, 88, 12, 0.4)'
    },
    cameraMotion: { type: 'pan-left', speed: 'medium', intensity: 0.8 },
    particleEffect: 'dust',
    overlayText: 'OUTPOST SIGMA REACHED',
    narration: 'The desert sun burns through the morning mist, painting the dunes in warm copper gold.'
  },
  {
    id: 'anime-sakura-ref',
    title: 'Sakura Garden Dream',
    mood: 'Anime' as const,
    description: 'Dreamy soft pink sky, cherry blossom drifting petals.',
    imageUrl: 'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?w=400&auto=format&fit=crop&q=60',
    proceduralStyle: {
      backgroundColor: '#1f131a',
      primaryColor: '#f472b6',
      secondaryColor: '#fbcfe8',
      accentColor: '#f43f5e',
      glowColor: 'rgba(244, 114, 182, 0.3)'
    },
    cameraMotion: { type: 'zoom-out', speed: 'medium', intensity: 1.4 },
    particleEffect: 'snow',
    overlayText: 'EPHEMERAL MOMENT',
    narration: 'Soft spring petals float gently down, carrying whispers from a season long forgotten.'
  }
];

// Preset Recent Iterations to give a beautiful, interactive starting state out-of-the-box
const PRESET_PROJECTS: VideoProject[] = [
  {
    id: 'cyberpunk-sector-4',
    title: 'Neon Rain Over Sector 4',
    prompt: 'A cyberpunk alleyway in the year 2099, towering neon holo-billboards, heavy rain mirroring purple and pink lights, a mysterious figure in a dark trench coat walking away, cinematic wide shot, synthwave aesthetic.',
    mood: 'Synthwave',
    soundtrackPreset: 'retro_synthwave',
    scenes: [
      {
        id: 'scene_1',
        title: 'Sector 4 Streets',
        narration: 'Under the neon glare of Sector 4, the city sleeps with one eye open...',
        visualDescription: 'A towering digital advertisement of a futuristic cyborg glowing teal and magenta. Heavy rain forms glowing purple reflections on wet asphalt roads.',
        imagePrompt: 'Cyberpunk street with giant neon billboards, heavy rain, glowing asphalt reflections, futuristic cinematic 35mm composition, purple and teal aesthetic',
        duration: 4.5,
        cameraMotion: { type: 'zoom-in', speed: 'slow', intensity: 0.6 },
        overlayText: 'SECTOR 4 — 2099',
        particleEffect: 'rain',
        proceduralStyle: {
          backgroundColor: '#07050e',
          primaryColor: '#8a2be2',
          secondaryColor: '#00ffff',
          accentColor: '#ff007f',
          glowColor: 'rgba(0, 255, 255, 0.4)'
        }
      },
      {
        id: 'scene_2',
        title: 'The Silent Wanderer',
        narration: 'Amongst the wires and chrome, a solitary soul walks the neon canyon.',
        visualDescription: 'Medium shot of a person in a reflective techwear raincoat with glowing neon trims, holding a transparent umbrella, walking past vending machines.',
        imagePrompt: 'Mysterious figure in dark techwear raincoat with glowing trim walking down narrow cyberpunk alley, rain, cozy soft lighting, cinema visual',
        duration: 4.0,
        cameraMotion: { type: 'pan-left', speed: 'medium', intensity: 0.5 },
        overlayText: 'SYS_TRACE_04',
        particleEffect: 'rain',
        proceduralStyle: {
          backgroundColor: '#05040a',
          primaryColor: '#ff007f',
          secondaryColor: '#9d00ff',
          accentColor: '#00ffcc',
          glowColor: 'rgba(255, 0, 127, 0.3)'
        }
      },
      {
        id: 'scene_3',
        title: 'Skyline Orbit',
        narration: 'Above, the megacorporations touch the clouds, untouched by the storm below.',
        visualDescription: 'A majestic sweeping shot looking up at giant geometric skyscrapers with flying vehicles darting between cloud-line glass paths.',
        imagePrompt: 'Giant futuristic skyscrapers piercing dark stormy clouds, glowing orange and cyan windows, flying cars, low angle epic cinematic shot',
        duration: 5.5,
        cameraMotion: { type: 'orbit', speed: 'slow', intensity: 0.8 },
        overlayText: 'AETHER DIGITAL CORP.',
        particleEffect: 'grid',
        proceduralStyle: {
          backgroundColor: '#0b0c15',
          primaryColor: '#00ffff',
          secondaryColor: '#ffaa00',
          accentColor: '#ffffff',
          glowColor: 'rgba(0, 255, 255, 0.2)'
        }
      }
    ]
  },
  {
    id: 'desert-dunes',
    title: 'The Eternal Sands',
    prompt: 'Warm cinematic shot of a endless desert dune landscape during a golden twilight, wind blowing fine sand across the ridge, majestic ambient lighting, noir mood.',
    mood: 'Cinematic',
    soundtrackPreset: 'lofi_chill',
    scenes: [
      {
        id: 'scene_1',
        title: 'Golden Ridges',
        narration: 'A vast sea of orange sand ripples under the quiet amber twilight.',
        visualDescription: 'Wide angle shot of geometric desert dunes with crisp shadows, a warm sunset glowing at the horizon, sand dust blowing softly.',
        imagePrompt: 'Desert sand dunes at golden hour sunset, crisp sand ripples, windy dust particles, hyper-detailed cinematic photography',
        duration: 5.0,
        cameraMotion: { type: 'pan-right', speed: 'slow', intensity: 0.4 },
        overlayText: 'THE CHRONOS WASTES',
        particleEffect: 'dust',
        proceduralStyle: {
          backgroundColor: '#1a0d02',
          primaryColor: '#d4883b',
          secondaryColor: '#f3b469',
          accentColor: '#ffffff',
          glowColor: 'rgba(243, 180, 105, 0.25)'
        }
      },
      {
        id: 'scene_2',
        title: 'Solitary Monument',
        narration: 'A forgotten obsidian obelisk stands guard against the march of time.',
        visualDescription: 'Dolly-in shot towards a giant tall black monolith reflecting the red sky, sand whipping its base.',
        imagePrompt: 'Epic tall black obsidian monolith standing in desert sand storm, warm setting sun, mysterious ancient sci-fi architecture',
        duration: 5.0,
        cameraMotion: { type: 'dolly-in', speed: 'slow', intensity: 0.7 },
        overlayText: 'TEMPLE SECTOR ALPHA',
        particleEffect: 'dust',
        proceduralStyle: {
          backgroundColor: '#120803',
          primaryColor: '#111111',
          secondaryColor: '#ff6600',
          accentColor: '#ffb300',
          glowColor: 'rgba(255, 102, 0, 0.3)'
        }
      }
    ]
  },
  {
    id: 'anime-nebula',
    title: 'Dream of the Nebula',
    prompt: 'Anime style space explorer, standing on an asteroid looking at a giant purple nebula core, hand-drawn detailing, warm emotional anime lighting, floating cosmic particles.',
    mood: 'Anime',
    soundtrackPreset: 'ambient_dark',
    scenes: [
      {
        id: 'scene_1',
        title: 'Starry Outlook',
        narration: 'She watched the stars unfold, a quiet dream painting the stellar sea.',
        visualDescription: 'Anime style girl in astronaut suit with hair waving softly, back to the camera, looking at an astronomical violet cloud.',
        imagePrompt: 'Beautiful anime style space astronaut looking at massive colorful glowing stellar nebula, magical stars, handdrawn art',
        duration: 6.0,
        cameraMotion: { type: 'zoom-out', speed: 'slow', intensity: 0.5 },
        overlayText: 'STELLAR HORIZON',
        particleEffect: 'embers',
        proceduralStyle: {
          backgroundColor: '#0a0518',
          primaryColor: '#4f1a8c',
          secondaryColor: '#f74fa1',
          accentColor: '#4ff7e7',
          glowColor: 'rgba(247, 79, 161, 0.3)'
        }
      }
    ]
  }
];

export default function App() {
  // Application State
  const [projects, setProjects] = useState<VideoProject[]>(PRESET_PROJECTS);
  const [activeProject, setActiveProject] = useState<VideoProject>(PRESET_PROJECTS[0]);
  
  // Creation States
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'Cinematic' | 'Noir' | 'Synthwave' | 'Anime'>('Cinematic');
  const [inputDuration, setInputDuration] = useState(15);
  const [motionIntensity, setMotionIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Playback & Render States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [renderingMode, setRenderingMode] = useState<'free' | 'ai'>('free');
  const [aiGeneratingScenes, setAiGeneratingScenes] = useState<string[]>([]); // track which scene IDs are currently calling Imagen
  
  // Selected scene / editor state
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [isEditingOverlay, setIsEditingOverlay] = useState(false);
  const [tempOverlayText, setTempOverlayText] = useState('');
  const [tempNarration, setTempNarration] = useState('');
  const [tempCameraType, setTempCameraType] = useState('zoom-in');
  const [tempImagePrompt, setTempImagePrompt] = useState('');

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [toast, setToast] = useState<{
    id: string;
    message: string;
    downloadUrl: string;
    fileName: string;
  } | null>(null);

  // Premium, Credits & Ad States
  const [isPremium, setIsPremium] = useState(false);
  const [credits, setCredits] = useState(20); // Initial sign up gives 20 credits
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(5);
  const [adRewardClaimed, setAdRewardClaimed] = useState(false);
  const [currentAdTitle, setCurrentAdTitle] = useState('');
  
  // Related Thumbnail style reference state
  const [selectedStyleRefId, setSelectedStyleRefId] = useState<string | null>(null);
  const [welcomeAlert, setWelcomeAlert] = useState(true);

  // Community Showcase States
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
  const [communityFilter, setCommunityFilter] = useState<string>('All');

  const filteredPosts = communityPosts.filter(post => {
    if (communityFilter === 'All') return true;
    return post.mood?.toLowerCase() === communityFilter.toLowerCase();
  });

  const fetchCommunityPosts = async () => {
    setCommunityLoading(true);
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setCommunityPosts(data);
      }
    } catch (err) {
      console.error('Error fetching community posts:', err);
    } finally {
      setCommunityLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityPosts();
  }, []);

  const handleShareToCommunity = async () => {
    setIsSharing(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorEmail: 'hendjack45@gmail.com', // Logged in user email
          title: activeProject.title,
          mood: activeProject.mood,
          projectData: activeProject
        })
      });

      if (res.ok) {
        const newPost = await res.json();
        setCommunityPosts(prev => [newPost, ...prev]);
        setToast({
          id: `share-success-${Date.now()}`,
          message: `Successfully published "${activeProject.title}" to the Community Feed!`,
          downloadUrl: '#',
          fileName: 'Published'
        });
        setIsCommunityOpen(true);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to publish project.');
      }
    } catch (err) {
      console.error('Error sharing project:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: 'hendjack45@gmail.com' })
      });
      if (res.ok) {
        const updatedLikeData = await res.json();
        setCommunityPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, likes: updatedLikeData.likes, likedBy: updatedLikeData.likedBy };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId] || '';
    if (!text.trim()) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorEmail: 'hendjack45@gmail.com',
          text: text
        })
      });
      if (res.ok) {
        const newComment = await res.json();
        setCommunityPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, comments: [...p.comments, newComment] };
          }
          return p;
        }));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const handleLoadCommunityProject = (post: any) => {
    const loadedProj: VideoProject = {
      ...post.projectData,
      id: `community-${post.id}-${Date.now()}`
    };
    
    setProjects(prev => {
      if (prev.some(p => p.id === loadedProj.id)) return prev;
      return [loadedProj, ...prev];
    });
    setActiveProject(loadedProj);
    setSelectedSceneIndex(0);
    setIsCommunityOpen(false);
    
    setToast({
      id: `load-project-${Date.now()}`,
      message: `Loaded community showcase "${loadedProj.title}" into your local editor workspace!`,
      downloadUrl: '#',
      fileName: 'Project Loaded'
    });
  };

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);
  
  // Audio Synthesizer Reference (Web Audio API)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<any[]>([]);

  // Calculate total project duration
  const totalDuration = activeProject.scenes.reduce((sum, s) => sum + s.duration, 0);

  // Initialize editing state when active scene changes
  useEffect(() => {
    if (activeProject.scenes[selectedSceneIndex]) {
      const scene = activeProject.scenes[selectedSceneIndex];
      setTempOverlayText(scene.overlayText);
      setTempNarration(scene.narration);
      setTempCameraType(scene.cameraMotion.type);
      setTempImagePrompt(scene.imagePrompt || '');
    }
  }, [selectedSceneIndex, activeProject]);

  // Synchronize playback timeline when clicking different scenes
  const handleSceneClick = (index: number) => {
    setSelectedSceneIndex(index);
    let timeOffset = 0;
    for (let i = 0; i < index; i++) {
      timeOffset += activeProject.scenes[i].duration;
    }
    setCurrentTime(timeOffset + 0.1);
  };

  // Web Audio Synthesizer - Generate procedural soundtracks based on user style choice
  const startSynth = () => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Clear any older nodes
      stopSynth();

      const preset = activeProject.soundtrackPreset;
      const masterVolume = ctx.createGain();
      masterVolume.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
      masterVolume.connect(ctx.destination);
      synthNodesRef.current.push(masterVolume);

      if (preset === 'retro_synthwave') {
        // Heavy analog retro-synthwave bassline
        const synthNotes = [55, 65.41, 73.42, 82.41]; // A1, C2, D2, E2 frequencies
        const interval = setInterval(() => {
          if (!isPlaying) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sawtooth';
          const baseFreq = synthNotes[Math.floor(Math.random() * synthNotes.length)];
          osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
          
          // Lowpass filter for warm retro feel
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(450, ctx.currentTime);

          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(masterVolume);

          osc.start();
          osc.stop(ctx.currentTime + 0.8);
        }, 600);

        synthNodesRef.current.push({ stop: () => clearInterval(interval) });

        // Atmospheric glowing high lead
        const leadInterval = setInterval(() => {
          if (!isPlaying || Math.random() > 0.6) return;
          const oscLead = ctx.createOscillator();
          const gainLead = ctx.createGain();
          
          oscLead.type = 'triangle';
          const notes = [220, 261.63, 293.66, 329.63, 392.00]; // Pentatonic scales
          oscLead.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)] * 2, ctx.currentTime);
          
          gainLead.gain.setValueAtTime(0.15, ctx.currentTime);
          gainLead.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 1.5);

          oscLead.connect(gainLead);
          gainLead.connect(masterVolume);

          oscLead.start();
          oscLead.stop(ctx.currentTime + 1.5);
        }, 1200);

        synthNodesRef.current.push({ stop: () => clearInterval(leadInterval) });

      } else if (preset === 'ambient_dark') {
        // Immersive slow drone pad hum
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(80, ctx.currentTime);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(80.5, ctx.currentTime); // detuned slider

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, ctx.currentTime);

        gain1.gain.setValueAtTime(0.4, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain1);
        gain1.connect(masterVolume);

        osc1.start();
        osc2.start();
        synthNodesRef.current.push(osc1, osc2);

      } else if (preset === 'lofi_chill') {
        // Slow soft rhodes electric piano chord hums
        const lofiInterval = setInterval(() => {
          if (!isPlaying) return;
          const chords = [
            [130.81, 164.81, 196.00, 246.94], // Cmaj7
            [146.83, 174.61, 220.00, 261.63], // Dm7
            [110.00, 138.61, 164.81, 220.00]  // Amaj
          ];
          const selectedChord = chords[Math.floor(Math.random() * chords.length)];
          
          selectedChord.forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);
            
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

            osc.connect(gain);
            gain.connect(masterVolume);
            
            osc.start();
            osc.stop(ctx.currentTime + 2.5);
          });
        }, 3000);

        synthNodesRef.current.push({ stop: () => clearInterval(lofiInterval) });

      } else {
        // Fantasy Orchestra - Epic sweeping strings drone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(110, ctx.currentTime); // A2
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(164.81, ctx.currentTime); // E3

        gain.gain.setValueAtTime(0.2, ctx.currentTime);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(masterVolume);

        osc1.start();
        osc2.start();
        synthNodesRef.current.push(osc1, osc2);
      }
    } catch (e) {
      console.warn('Procedural audio synth load failed:', e);
    }
  };

  const stopSynth = () => {
    synthNodesRef.current.forEach(node => {
      try {
        if (typeof node.stop === 'function') {
          node.stop();
        } else if (node.disconnect) {
          node.disconnect();
        }
      } catch (e) {}
    });
    synthNodesRef.current = [];
  };

  // Listen to playing changes to play/pause soundtrack
  useEffect(() => {
    if (isPlaying) {
      startSynth();
    } else {
      stopSynth();
    }
    return () => stopSynth();
  }, [isPlaying, activeProject.soundtrackPreset, volume, isMuted]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localCurrentTime = currentTime;
    
    // Setup particle trackers for interactive cinematic overlays
    const particles: Array<{x: number, y: number, speed: number, size: number, opacity: number, vx?: number, vy?: number}> = [];
    const maxParticles = 60;
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 1 + Math.random() * 3,
        size: 1 + Math.random() * 2,
        opacity: 0.2 + Math.random() * 0.6,
        vx: -1 + Math.random() * 2,
        vy: 2 + Math.random() * 3
      });
    }

    const animate = (timestamp: number) => {
      if (!prevTimeRef.current) prevTimeRef.current = timestamp;
      const deltaTime = (timestamp - prevTimeRef.current) / 1000;
      prevTimeRef.current = timestamp;

      if (isPlaying) {
        localCurrentTime += deltaTime;
        if (localCurrentTime >= totalDuration) {
          localCurrentTime = 0; // loop video play
        }
        setCurrentTime(localCurrentTime);
      }

      // Find current scene
      let cumulativeTime = 0;
      let activeScene: Scene = activeProject.scenes[0];
      let sceneProgress = 0;
      let currentSceneIdx = 0;

      for (let i = 0; i < activeProject.scenes.length; i++) {
        const scene = activeProject.scenes[i];
        if (localCurrentTime >= cumulativeTime && localCurrentTime < cumulativeTime + scene.duration) {
          activeScene = scene;
          sceneProgress = (localCurrentTime - cumulativeTime) / scene.duration;
          currentSceneIdx = i;
          break;
        }
        cumulativeTime += scene.duration;
      }

      // Sync active scene index with timeline
      if (currentSceneIdx !== selectedSceneIndex) {
        setSelectedSceneIndex(currentSceneIdx);
      }

      // Clear Canvas
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- RENDER KEYFRAME BACKDROP ---
      ctx.save();

      // Apply camera motion transitions (Ken Burns Effect)
      const motionType = activeScene.cameraMotion.type;
      const intensity = activeScene.cameraMotion.intensity;
      let scale = 1.0;
      let transX = 0;
      let transY = 0;
      let rotation = 0;

      if (motionType === 'zoom-in') {
        scale = 1.0 + (sceneProgress * 0.15 * intensity);
      } else if (motionType === 'zoom-out') {
        scale = 1.15 - (sceneProgress * 0.15 * intensity);
      } else if (motionType === 'pan-right') {
        scale = 1.1;
        transX = -(sceneProgress * 40 * intensity);
      } else if (motionType === 'pan-left') {
        scale = 1.1;
        transX = -40 + (sceneProgress * 40 * intensity);
      } else if (motionType === 'dolly-in') {
        scale = 1.0 + (sceneProgress * 0.25 * intensity);
        transY = -(sceneProgress * 10 * intensity);
      } else if (motionType === 'orbit') {
        scale = 1.1;
        rotation = (sceneProgress * 0.04 * intensity) - (0.02 * intensity);
        transX = (sceneProgress * 15 * intensity) - 7;
      }

      // Apply 2D transforms around center
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(scale, scale);
      ctx.rotate(rotation);
      ctx.translate(transX - canvas.width / 2, transY - canvas.height / 2);

      // Render either generated AI Image or beautiful procedural layered design
      if (renderingMode === 'ai' && activeScene.imageUrl) {
        // Draw real AI image keyframe loaded from Imagen
        const img = new Image();
        img.src = activeScene.imageUrl;
        // Since we want immediate rendering, if loaded we draw it
        try {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } catch (e) {
          // If still loading or failed, draw procedural scene below as safety fallback
          drawProceduralScene(ctx, canvas, activeScene, sceneProgress);
        }
      } else {
        // Draw beautiful procedurally generated animated vector scenery (Free Draft mode)
        drawProceduralScene(ctx, canvas, activeScene, sceneProgress);
      }

      ctx.restore();

      // --- PARTICLES OVERLAY FILTER ---
      const effect = activeScene.particleEffect;
      if (effect !== 'none') {
        ctx.save();
        if (effect === 'rain') {
          ctx.strokeStyle = activeScene.proceduralStyle.secondaryColor;
          ctx.lineWidth = 1;
          particles.forEach(p => {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + (p.vx || 0) * 0.5, p.y + (p.vy || 4));
            ctx.stroke();

            // Update
            p.y += p.vy || 5;
            p.x += p.vx || 0;
            if (p.y > canvas.height) {
              p.y = -10;
              p.x = Math.random() * canvas.width;
            }
          });
        } else if (effect === 'snow') {
          ctx.fillStyle = '#ffffff';
          particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Update
            p.y += p.speed * 0.4;
            p.x += Math.sin(p.y / 30) * 0.5;
            if (p.y > canvas.height) {
              p.y = -10;
              p.x = Math.random() * canvas.width;
            }
          });
        } else if (effect === 'embers') {
          // Warm glowing ember particles drifting upwards
          ctx.shadowBlur = 10;
          ctx.shadowColor = activeScene.proceduralStyle.accentColor;
          ctx.fillStyle = activeScene.proceduralStyle.accentColor;
          particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();

            // Update (ember float up)
            p.y -= p.speed * 0.6;
            p.x += Math.sin(p.y / 20) * 0.3;
            if (p.y < -10) {
              p.y = canvas.height + 10;
              p.x = Math.random() * canvas.width;
            }
          });
        } else if (effect === 'grid') {
          // Futuristic tech grids overlay
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          const gridSize = 40;
          const offset = (localCurrentTime * 20) % gridSize;
          for (let x = offset; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = offset; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
        } else if (effect === 'dust') {
          // Desert dust swirling
          ctx.fillStyle = activeScene.proceduralStyle.secondaryColor;
          ctx.globalAlpha = 0.15;
          particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            ctx.fill();

            p.x += (p.speed * 1.2);
            p.y += Math.sin(p.x / 40) * 0.5;
            if (p.x > canvas.width) {
              p.x = -10;
              p.y = Math.random() * canvas.height;
            }
          });
        }
        ctx.restore();
      }

      // --- HUD ELEMENTS AND TEXT OVERLAY ---
      // Cinematic Vignette filter
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width / 4,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render current Text Overlay subtitling
      if (activeScene.overlayText) {
        ctx.save();
        ctx.font = activeProject.mood === 'Anime' ? '700 24px "Space Grotesk", sans-serif' : '700 24px "Times New Roman", serif';
        ctx.textAlign = 'center';
        
        // Dark text outline for readability
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        
        // Overlay box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        const textWidth = ctx.measureText(activeScene.overlayText).width;
        ctx.fillRect(canvas.width / 2 - textWidth / 2 - 16, canvas.height - 75, textWidth + 32, 34);

        // Subtitle Text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(activeScene.overlayText, canvas.width / 2, canvas.height - 50);
        ctx.restore();
      }

      // Render small live "REC" Indicator
      if (isPlaying) {
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(35, 35, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = '10px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('REC', 48, 38);
        ctx.restore();
      }

      // Trigger next anim frame
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, currentTime, activeProject, renderingMode, totalDuration]);

  // Procedural Art Generator - creates layered animated landscapes/interiors based on scene configuration
  const drawProceduralScene = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, scene: Scene, progress: number) => {
    const style = scene.proceduralStyle;
    
    // Background sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, style.backgroundColor);
    skyGrad.addColorStop(1, adjustColorBrightness(style.backgroundColor, -20));
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render distant grid stars or ambient neon lines
    if (activeProject.mood === 'Synthwave' || activeProject.mood === 'Anime') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 40; i++) {
        const sx = (Math.sin(i * 123.4) * 0.5 + 0.5) * canvas.width;
        const sy = (Math.cos(i * 432.1) * 0.5 + 0.5) * (canvas.height * 0.6);
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // Distant mountains / silhouette skyscrapers
    ctx.fillStyle = adjustColorBrightness(style.primaryColor, -40);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 50) {
      const heightNoise = Math.sin(x / 100 + progress * 0.1) * 60 + Math.cos(x / 40) * 20;
      ctx.lineTo(x, canvas.height - 180 + heightNoise);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Secondary midground structures / mountains
    ctx.fillStyle = adjustColorBrightness(style.primaryColor, -15);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 40) {
      const heightNoise = Math.sin(x / 60 - progress * 0.1) * 40 + Math.cos(x / 20) * 10;
      ctx.lineTo(x, canvas.height - 120 + heightNoise);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Foreground animated element (e.g. glowing sun, neon grid road, glowing gateway)
    if (activeProject.mood === 'Synthwave') {
      // Draw Synthwave giant setting glowing sun
      const sunY = canvas.height / 2 + 20;
      const sunRadius = 90;
      ctx.save();
      const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
      sunGrad.addColorStop(0, style.accentColor);
      sunGrad.addColorStop(1, style.secondaryColor);
      ctx.fillStyle = sunGrad;
      
      ctx.beginPath();
      ctx.arc(canvas.width / 2, sunY, sunRadius, Math.PI, 0);
      ctx.fill();
      
      // Horizontal synth lines cuts
      ctx.fillStyle = style.backgroundColor;
      for (let y = sunY - sunRadius; y < sunY; y += 12) {
        const thickness = 2 + (sunY - y) / 15;
        ctx.fillRect(canvas.width / 2 - sunRadius - 10, y, sunRadius * 2 + 20, thickness);
      }
      ctx.restore();

      // Front neon perspective roads
      ctx.strokeStyle = style.secondaryColor;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = style.secondaryColor;
      const horizonY = canvas.height - 80;
      for (let i = -6; i <= 6; i++) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 + i * 20, horizonY);
        ctx.lineTo(canvas.width / 2 + i * 160, canvas.height);
        ctx.stroke();
      }
    } else {
      // Cinematic/Noir/Anime - Beautiful minimal glowing circular core or ambient lights
      ctx.save();
      ctx.shadowBlur = 40;
      ctx.shadowColor = style.secondaryColor;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 30, 110, 0, Math.PI * 2);
      ctx.fill();

      // Glowing lens flare lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 280, canvas.height / 2 - 30);
      ctx.lineTo(canvas.width / 2 + 280, canvas.height / 2 - 30);
      ctx.stroke();
      ctx.restore();
    }

    // Base ground layer
    ctx.fillStyle = adjustColorBrightness(style.backgroundColor, -40);
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

    // Front neon glow flare
    ctx.save();
    const groundGlow = ctx.createRadialGradient(
      canvas.width / 2, canvas.height - 20, 10,
      canvas.width / 2, canvas.height - 20, 300
    );
    groundGlow.addColorStop(0, style.glowColor);
    groundGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = groundGlow;
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    ctx.restore();
  };

  // Helper to adjust color brightness programmatically
  const adjustColorBrightness = (hex: string, percent: number) => {
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = Math.min(255, Math.max(0, R + percent));
    G = Math.min(255, Math.max(0, G + percent));
    B = Math.min(255, Math.max(0, B + percent));

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };

  // Related Thumbnail style reference and quick insertion helpers
  const handleApplyStyleRef = (ref: typeof RELATED_THUMBNAILS[0]) => {
    // Apply reference style to active selected scene in the active project
    const updatedScenes = activeProject.scenes.map((scene, idx) => {
      if (idx === selectedSceneIndex) {
        return {
          ...scene,
          proceduralStyle: { ...ref.proceduralStyle },
          cameraMotion: { ...ref.cameraMotion },
          particleEffect: ref.particleEffect,
          overlayText: ref.overlayText,
          narration: ref.narration,
          title: `Style Ref: ${ref.title}`
        };
      }
      return scene;
    });

    const updatedProject = { ...activeProject, scenes: updatedScenes };
    
    // Save project updates
    setActiveProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    
    // Reset inputs
    setTempOverlayText(ref.overlayText);
    setTempNarration(ref.narration);
    setTempCameraType(ref.cameraMotion.type);
    
    // Smooth transition message
    setToast({
      id: `style-applied-${Date.now()}`,
      message: `Successfully applied style "${ref.title}" into Scene 0${selectedSceneIndex + 1} with a smooth animation!`,
      downloadUrl: '#',
      fileName: 'Applied cinematic style palette'
    });
    
    // Clean up ref picker
    setSelectedStyleRefId(null);
  };

  const handleInsertStyleRefAsScene = (ref: typeof RELATED_THUMBNAILS[0]) => {
    // Append a new scene based on reference style
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: ref.title,
      narration: ref.narration,
      visualDescription: ref.description,
      imagePrompt: `${ref.title}, high quality cinematic shot, matching the ${ref.mood} aesthetic, ${ref.description}`,
      duration: 5,
      cameraMotion: {
        type: ref.cameraMotion.type,
        speed: ref.cameraMotion.speed,
        intensity: ref.cameraMotion.intensity
      },
      overlayText: ref.overlayText,
      particleEffect: ref.particleEffect,
      proceduralStyle: { ...ref.proceduralStyle }
    };

    const updatedProject = {
      ...activeProject,
      scenes: [...activeProject.scenes, newScene]
    };

    setActiveProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    
    // Select the newly added scene
    setSelectedSceneIndex(updatedProject.scenes.length - 1);
    
    setToast({
      id: `scene-inserted-${Date.now()}`,
      message: `Quick-inserted "${ref.title}" as a new Scene 0${updatedProject.scenes.length} in your active storyboard!`,
      downloadUrl: '#',
      fileName: 'New storyboard scene added'
    });

    setSelectedStyleRefId(null);
  };

  const startAdSession = () => {
    const adTitles = [
      "Interstellar Odyssey 2 - In IMAX This Fall",
      "Neon Horizon: Cyberpunk 2088 RPG Trailer",
      "Realm AI Audio Soundscapes Engine Showcase",
      "Chronicles of the Star Forge MMO Reveal",
      "Noir Chronicles: The City Whispers"
    ];
    const randomTitle = adTitles[Math.floor(Math.random() * adTitles.length)];
    setCurrentAdTitle(randomTitle);
    setAdSecondsLeft(5);
    setAdRewardClaimed(false);
    setIsAdModalOpen(true);
  };

  // Timer useEffect for watch ads
  useEffect(() => {
    if (!isAdModalOpen || adSecondsLeft <= 0) {
      if (isAdModalOpen && adSecondsLeft === 0 && !adRewardClaimed) {
        setCredits(prev => prev + 5);
        setAdRewardClaimed(true);
        setToast({
          id: `ad-reward-${Date.now()}`,
          message: 'Sponsor Ad completed! You have successfully earned +5 credits.',
          downloadUrl: '#',
          fileName: 'Earned 5 Credits'
        });
      }
      return;
    }

    const timer = setTimeout(() => {
      setAdSecondsLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAdModalOpen, adSecondsLeft, adRewardClaimed]);

  // Submit main prompt to our custom Express /api/generate-scenes endpoint
  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;

    // Premium and credit requirements
    if (!isPremium) {
      if (credits < 10) {
        setIsUpgradeModalOpen(true);
        setToast({
          id: `no-credits-${Date.now()}`,
          message: 'Insufficient credits. You need 10 credits per generation. Upgrade to Premium or watch a short Sponsor Ad!',
          downloadUrl: '#',
          fileName: 'Credit Limit Alert'
        });
        return;
      }
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputPrompt,
          style: selectedStyle,
          duration: inputDuration,
          motionIntensity: motionIntensity
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error generating storyboard.');
      }

      const projectData: VideoProject = await response.json();
      
      // Format projectData with a unique ID
      const newProject: VideoProject = {
        ...projectData,
        id: `project-${Date.now()}`,
        prompt: inputPrompt
      };

      // Set projects
      setProjects(prev => [newProject, ...prev]);
      setActiveProject(newProject);
      setSelectedSceneIndex(0);
      setCurrentTime(0);
      setIsPlaying(true);
      setInputPrompt(''); // clear prompt

      // Deduct 10 credits if not premium
      if (!isPremium) {
        setCredits(prev => Math.max(0, prev - 10));
        setToast({
          id: `credits-deducted-${Date.now()}`,
          message: `Deducted 10 credits for screenplay generation. You have ${credits - 10} credits left.`,
          downloadUrl: '#',
          fileName: '10 Credits Spent'
        });
      }

    } catch (err: any) {
      alert(`Screenplay Generation Error: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Real Imagen AI image generation request for a specific scene card
  const handleGenerateAISceneImage = async (sceneId: string, imagePrompt: string) => {
    if (aiGeneratingScenes.includes(sceneId)) return;
    setAiGeneratingScenes(prev => [...prev, sceneId]);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio: '16:9'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Image generation failed.');
      }

      const data = await response.json();
      
      // Update the scene object in the current project
      const updatedScenes = activeProject.scenes.map(scene => {
        if (scene.id === sceneId) {
          return { ...scene, imageUrl: data.imageUrl, imagePrompt };
        }
        return scene;
      });

      const updatedProject = { ...activeProject, scenes: updatedScenes };
      setActiveProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));
      
      // Auto toggle to AI mode so they can see the generated image
      setRenderingMode('ai');

    } catch (err: any) {
      alert(`Imagen Keyframe Error:\n\nIf you are on a free workspace, please enable 'Paid Model Flow' or use our standard Procedural Draft Mode! Details: ${err.message || err}`);
    } finally {
      setAiGeneratingScenes(prev => prev.filter(id => id !== sceneId));
    }
  };

  // Generate Imagen AI frames for ALL scenes in the active project in parallel!
  const generateAllAIFrames = () => {
    activeProject.scenes.forEach(scene => {
      if (!scene.imageUrl) {
        handleGenerateAISceneImage(scene.id, scene.imagePrompt);
      }
    });
  };

  // Save modified subtitles, narration, and camera motion settings back to the project state
  const saveSceneEdits = () => {
    const updatedScenes = activeProject.scenes.map((scene, idx) => {
      if (idx === selectedSceneIndex) {
        return {
          ...scene,
          overlayText: tempOverlayText,
          narration: tempNarration,
          imagePrompt: tempImagePrompt,
          cameraMotion: {
            ...scene.cameraMotion,
            type: tempCameraType
          }
        };
      }
      return scene;
    });

    const updatedProject = { ...activeProject, scenes: updatedScenes };
    setActiveProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));
    setIsEditingOverlay(false);
  };

  // Remove a project from History list
  const deleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      alert("You need to keep at least one project in your history workspace.");
      return;
    }
    const filtered = projects.filter(p => p.id !== projectId);
    setProjects(filtered);
    if (activeProject.id === projectId) {
      setActiveProject(filtered[0]);
      setSelectedSceneIndex(0);
      setCurrentTime(0);
    }
  };

  // Real WebM/MP4 high-quality recording export of the animated Canvas + Audio Synth!
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    setExportProgress(10);

    // Initialize media recording flow
    try {
      const stream = canvas.captureStream(24); // 24 FPS
      
      // Let's create an Audio destination node if AudioContext is active
      let combinedStream = stream;
      const chunks: Blob[] = [];

      // Set simulation progress ticks
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 500);

      // We'll record using MediaRecorder
      const options = { mimeType: 'video/webm;codecs=vp9' };
      let mediaRecorder: MediaRecorder;
      
      try {
        mediaRecorder = new MediaRecorder(combinedStream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(combinedStream); // standard fallback
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const fileName = `${activeProject.title.toLowerCase().replace(/\s+/g, '-')}-4k-cinematic.webm`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setExportProgress(100);
        setTimeout(() => {
          setIsExporting(false);
          setExportProgress(0);
          
          // Trigger successful export toast notification
          setToast({
            id: `export-success-${Date.now()}`,
            message: 'Your high-quality cinematic storyboard video has been successfully compiled and saved to your device.',
            downloadUrl: url,
            fileName: fileName
          });
        }, 1000);
      };

      // Reset playhead to record from the very beginning of the timeline!
      setCurrentTime(0);
      setIsPlaying(true);
      
      // Record for the length of totalDuration
      mediaRecorder.start();
      
      setTimeout(() => {
        mediaRecorder.stop();
        setIsPlaying(false);
        clearInterval(progressInterval);
      }, totalDuration * 1000);

    } catch (err: any) {
      alert(`Export Failed: ${err.message || err}`);
      setIsExporting(false);
    }
  };

  return (
    <div id="ai-video-studio-container" className="flex h-screen w-screen bg-[#050505] text-slate-200 overflow-hidden font-sans select-none">
      
      {/* LEFT SIDEBAR: Storyboards & Generation History */}
      <aside className="w-72 border-r border-white/5 flex flex-col bg-[#080808]">
        {/* Workspace Brand Title */}
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-indigo-500/30 shadow-lg shadow-indigo-500/10 shrink-0">
              <img src={realmLogo} alt="Realm AI Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <span className="font-serif text-sm italic font-bold text-white tracking-wide block leading-tight">Realm AI</span>
              <span className="text-[8px] text-indigo-400 font-mono uppercase tracking-widest block mt-0.5">Cinematic Engine</span>
            </div>
          </div>
          <div className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-mono">
            V3.5
          </div>
        </div>
        
        {/* Saved Generation projects */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Recent Cinematic Drafts</h3>
              <span className="text-[10px] font-mono text-slate-600">{projects.length} files</span>
            </div>
            <div className="space-y-2">
              {projects.map((proj) => {
                const isActive = activeProject.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setActiveProject(proj);
                      setSelectedSceneIndex(0);
                      setCurrentTime(0);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                      isActive 
                        ? 'bg-white/5 border-white/10 shadow-lg' 
                        : 'border-transparent hover:bg-white/5'
                    }`}
                  >
                    {/* Delete button */}
                    <button 
                      onClick={(e) => deleteProject(proj.id, e)}
                      className="absolute top-2 right-2 p-1 rounded hover:bg-red-500/20 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="h-20 w-full rounded-md bg-slate-900 mb-2 overflow-hidden border border-white/5 relative">
                      {/* Thumbnail fallback procedural gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-transparent to-slate-950 opacity-80" />
                      
                      {/* Mini preview canvas draw representation */}
                      <div className="absolute inset-0 flex items-center justify-center p-2 text-center text-[9px] font-serif italic text-slate-400">
                        {proj.scenes[0]?.title || 'Cinematic concept'}
                      </div>
                    </div>
                    
                    <p className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {proj.title}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-medium">
                        {proj.mood}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono">
                        {proj.scenes.reduce((sum, s) => sum + s.duration, 0)}s
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Pro account / credits meter */}
        <div className="p-4 border-t border-white/5 bg-[#09090e] space-y-3.5">
          {/* Email Info */}
          <div className="flex items-center gap-2.5 px-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-inner ${
              isPremium 
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 ring-2 ring-yellow-400/30' 
                : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
            }`}>
              {isPremium ? <Crown className="w-3.5 h-3.5 text-amber-950 font-bold" /> : 'FT'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">hendjack45@gmail.com</p>
              <p className="text-[9px] text-slate-500 font-mono capitalize">
                {isPremium ? 'Lifetime Elite Premium' : 'Realm AI Standard Account'}
              </p>
            </div>
          </div>

          {/* Core Balance Card */}
          <div className={`p-3 rounded-xl border transition-all ${
            isPremium 
              ? 'bg-gradient-to-b from-amber-500/[0.06] to-yellow-500/[0.01] border-yellow-500/20 shadow-md shadow-amber-500/[0.02]' 
              : 'bg-white/[0.02] border-white/5'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 font-medium">Render Engine Balance</span>
              <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                isPremium 
                  ? 'text-yellow-400 bg-yellow-500/10' 
                  : credits >= 10 
                    ? 'text-emerald-400 bg-emerald-500/10' 
                    : 'text-rose-400 bg-rose-500/10'
              }`}>
                {isPremium ? 'UNLIMITED' : `${credits} Credits`}
              </span>
            </div>

            {/* Progress/Ratio Bar or Sign Up Reward status */}
            {!isPremium ? (
              <div className="space-y-1.5">
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${credits >= 10 ? 'bg-indigo-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, (credits / 20) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                  <span>Free Draft: 10c / video</span>
                  <span>{credits >= 10 ? 'Ready to Render' : 'Low Credits'}</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-yellow-500/80 leading-relaxed font-serif italic">
                Enjoy zero-wait high-speed generation with unlimited cinematic videos.
              </p>
            )}
          </div>

          {/* Action Triggers */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            {!isPremium ? (
              <>
                <button
                  onClick={startAdSession}
                  className="px-2.5 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/5 hover:border-white/15 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Tv className="w-3.5 h-3.5 text-indigo-400" />
                  +5 Credits
                </button>
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/15"
                >
                  <Crown className="w-3.5 h-3.5" />
                  Premium
                </button>
              </>
            ) : (
              <div className="col-span-2 text-center py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <span className="text-[10px] text-yellow-400 font-bold tracking-widest uppercase flex items-center justify-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" /> Elite Unlocked
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* CENTER WORKSPACE: Main Interactive Video Player & Timeline */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#080808]/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <Film className="w-4 h-4 text-indigo-400" />
            <h1 className="font-serif text-lg italic text-white font-medium">
              {activeProject.title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Rendering Engine Mode Toggle */}
            <div className="bg-white/5 p-1 rounded-full border border-white/10 flex items-center gap-1">
              <button
                onClick={() => setRenderingMode('free')}
                className={`px-3 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full transition-all ${
                  renderingMode === 'free' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Generative HTML5 Canvas layered animations"
              >
                Free Drafts
              </button>
              <button
                onClick={() => setRenderingMode('ai')}
                className={`px-3 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full transition-all flex items-center gap-1.5 ${
                  renderingMode === 'ai' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Generate high-end keyframes with Imagen 3"
              >
                <Sparkles className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                AI Keyframes
              </button>
            </div>

            {/* Community Feed Navigation */}
            <button
              onClick={() => {
                setIsCommunityOpen(true);
                fetchCommunityPosts();
              }}
              className="px-4 py-2 bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-500/20 text-indigo-300 hover:text-white text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-md shadow-indigo-950/10"
            >
              <Users className="w-3.5 h-3.5" />
              Community Feed
            </button>

            <button 
              onClick={handleShareToCommunity}
              disabled={isSharing}
              className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold rounded-full transition-all flex items-center gap-1.5 disabled:opacity-50"
              title="Publish this video project to the Shared Showcase community feed"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Share to Feed
                </>
              )}
            </button>

            <button 
              onClick={handleExportVideo}
              disabled={isExporting}
              className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow-xl disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Recording ({exportProgress}%)
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  Export WebM
                </>
              )}
            </button>
          </div>
        </header>

        {/* Sign-up Bonus Alert Notification Banner */}
        <AnimatePresence>
          {welcomeAlert && !isPremium && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-indigo-950/40 border-b border-indigo-500/20 px-8 py-2.5 flex items-center justify-between shrink-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs">🎉</span>
                <p className="text-[11px] font-mono text-indigo-300">
                  <span className="font-bold text-white">Initial Sign-Up Reward:</span> +20 Generative Credits have been automatically loaded into your account.
                </p>
              </div>
              <button 
                onClick={() => setWelcomeAlert(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
                aria-label="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COMPREHENSIVE VIDEO PLAYER AREA */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center bg-radial-gradient from-[#0c0a15] to-[#050505] overflow-y-auto">
          <div className="relative w-full max-w-3xl aspect-video rounded-2xl bg-black border border-white/10 shadow-2xl flex flex-col overflow-hidden group">
            
            {/* The actual rendering stage */}
            <canvas
              ref={canvasRef}
              width={768}
              height={432}
              className="w-full h-full object-contain cursor-pointer"
              onClick={() => setIsPlaying(!isPlaying)}
            />

            {/* Loading/buffering state or export screen */}
            {isExporting && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <h4 className="text-white font-serif italic text-lg mb-2">Rendering Masterpiece</h4>
                <p className="text-slate-400 text-xs font-mono max-w-sm text-center mb-6">
                  Compiling canvas animation layers, procedural vector lighting, overlay captions, and sound synth into a high-quality video stream...
                </p>
                <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${exportProgress}%` }} />
                </div>
              </div>
            )}

            {/* HUD / overlay indicators */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <div className="text-[10px] font-mono text-white bg-black/60 border border-white/10 px-2.5 py-1 rounded-md backdrop-blur">
                {activeProject.mood} MODE
              </div>
              <div className="text-[10px] font-mono text-indigo-400 bg-black/60 border border-white/10 px-2.5 py-1 rounded-md backdrop-blur">
                AUDIO SYNCED
              </div>
            </div>

            <div className="absolute bottom-4 left-4 z-20 flex gap-2 pointer-events-none">
              <div className="text-[10px] font-mono text-white bg-black/60 px-2 py-1 rounded backdrop-blur">
                {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
                {Math.floor(currentTime % 60).toString().padStart(2, '0')}.
                {Math.floor((currentTime % 1) * 100).toString().padStart(2, '0')}
              </div>
              <div className="text-[10px] font-mono text-indigo-400 bg-black/60 px-2 py-1 rounded backdrop-blur">
                24 FPS
              </div>
            </div>

            {/* Standard Playback controller bar */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 bg-black/65 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className="text-white hover:text-indigo-400 transition-colors p-1"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              </button>
              
              <button 
                onClick={() => setCurrentTime(0)} 
                className="text-slate-400 hover:text-white transition-colors p-1"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-white/10" />

              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="text-slate-400 hover:text-white transition-colors p-1"
                title={isMuted ? 'Unmute Synth' : 'Mute Synth'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 accent-indigo-500 h-1 rounded-full cursor-pointer"
                title="Synth Volume"
              />
            </div>
          </div>

          {/* Player scrubbing bar timeline */}
          <div className="w-full max-w-3xl mt-4 flex items-center gap-3 px-1">
            <span className="text-[10px] font-mono text-slate-500">00:00</span>
            <div className="flex-1 h-2 bg-white/5 rounded-full relative cursor-pointer group" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              setCurrentTime(percent * totalDuration);
            }}>
              <div 
                className="h-full bg-indigo-500 rounded-full relative group-hover:bg-indigo-400"
                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-indigo-600 scale-0 group-hover:scale-100 transition-transform" />
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {Math.floor(totalDuration / 60).toString().padStart(2, '0')}:{Math.floor(totalDuration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* INTERACTIVE STORYBOARD TIMELINE CARDS */}
        <div className="p-8 border-t border-white/5 bg-[#080808]/70 relative">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Film className="w-3.5 h-3.5 text-indigo-400" />
                <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold">Interactive Storyboard Timeline</h4>
              </div>
              
              <button 
                onClick={generateAllAIFrames}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 bg-indigo-500/15 border border-indigo-500/20 px-3 py-1 rounded-full hover:bg-indigo-500/20 transition-all"
              >
                <Sparkles className="w-3 h-3 text-yellow-400" />
                Render All Empty AI Keyframes
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/5">
              {activeProject.scenes.map((scene, idx) => {
                const isSelected = selectedSceneIndex === idx;
                const isSceneAiGenerating = aiGeneratingScenes.includes(scene.id);
                
                return (
                  <div
                    key={scene.id}
                    onClick={() => handleSceneClick(idx)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-[#121021] border-indigo-500/50 shadow-lg shadow-indigo-500/5 scale-[1.02]' 
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div>
                      {/* Scene Title header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-mono text-indigo-400 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded">
                          SCENE 0{idx + 1}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          {scene.duration}s
                        </span>
                      </div>

                      {/* Scene keyframe display box */}
                      <div className="h-24 w-full rounded-lg bg-slate-950 mb-2.5 overflow-hidden border border-white/5 relative group/card">
                        
                        {renderingMode === 'ai' && scene.imageUrl ? (
                          <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-cover" />
                        ) : (
                          // Fallback procedural visual preview gradient representation
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center" style={{ backgroundColor: scene.proceduralStyle.backgroundColor }}>
                            <div className="w-6 h-6 rounded-full opacity-65 mb-1 animate-pulse" style={{ backgroundColor: scene.proceduralStyle.secondaryColor }} />
                            <span className="text-[8px] font-mono tracking-wide" style={{ color: scene.proceduralStyle.accentColor }}>
                              {scene.cameraMotion.type.toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Interactive overlay icon triggers */}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          {scene.imageUrl ? (
                            <span className="text-[9px] text-white bg-green-500/95 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> AI Loaded
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateAISceneImage(scene.id, scene.imagePrompt);
                              }}
                              disabled={isSceneAiGenerating}
                              className="text-[9px] text-white bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {isSceneAiGenerating ? (
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                              )}
                              Gen AI Image
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-white font-medium truncate mb-1">{scene.title}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed h-7 mb-1">
                        {scene.narration}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-2 mt-2 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                      <span>Camera: {scene.cameraMotion.type}</span>
                      <span className="capitalize text-slate-400">FX: {scene.particleEffect}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RELATED STYLE REFERENCE LIBRARY / THUMBNAILS */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold">Style Reference Library</h4>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">Click a thumbnail reference to instantly inject its styling palette or quick-insert it as a new scene</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {RELATED_THUMBNAILS.map((ref) => {
                  const isRefActive = selectedStyleRefId === ref.id;
                  return (
                    <div key={ref.id} className="relative group/ref" id={`style-ref-${ref.id}`}>
                      <div
                        onClick={() => setSelectedStyleRefId(isRefActive ? null : ref.id)}
                        className={`p-2 rounded-xl bg-white/[0.02] border transition-all duration-300 cursor-pointer overflow-hidden relative ${
                          isRefActive 
                            ? 'ring-2 ring-indigo-500/50 border-indigo-500/50 scale-[1.03] bg-indigo-950/20 shadow-lg shadow-indigo-500/10' 
                            : 'border-white/5 hover:border-white/10 hover:scale-[1.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        {/* Reference Image Thumbnail */}
                        <div className="h-16 w-full rounded-lg bg-slate-900 overflow-hidden relative mb-2 border border-white/5">
                          <img 
                            src={ref.imageUrl} 
                            alt={ref.title} 
                            className="w-full h-full object-cover grayscale group-hover/ref:grayscale-0 transition-all duration-500" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <span className="absolute bottom-1 right-1 text-[8px] font-bold font-mono px-1 py-0.5 rounded bg-black/60 text-slate-300 uppercase">
                            {ref.mood}
                          </span>
                        </div>

                        {/* Title and prompt summary */}
                        <h5 className="text-[10px] font-bold text-slate-200 truncate">{ref.title}</h5>
                        <p className="text-[8px] text-slate-500 leading-tight line-clamp-2 mt-0.5 font-mono h-5">
                          {ref.description}
                        </p>
                      </div>

                      {/* Dropdown Options overlay for style reference injection */}
                      <AnimatePresence>
                        {isRefActive && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-0 right-0 mb-3 z-20 bg-[#0d0d12] border border-indigo-500/30 rounded-xl p-2.5 shadow-2xl shadow-black"
                          >
                            <p className="text-[9px] font-bold text-white mb-2 leading-tight">
                              Apply style to current Scene 0{selectedSceneIndex + 1}?
                            </p>
                            <div className="space-y-1">
                              <button
                                onClick={() => handleApplyStyleRef(ref)}
                                className="w-full text-left py-1 px-2 bg-indigo-600 hover:bg-indigo-500 text-[9px] font-bold text-white rounded transition-colors flex items-center justify-between"
                              >
                                <span>Inject Style Palette</span>
                                <Check className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => handleInsertStyleRefAsScene(ref)}
                                className="w-full text-left py-1 px-2 bg-white/5 hover:bg-white/10 text-[9px] font-semibold text-slate-300 rounded transition-colors flex items-center justify-between"
                              >
                                <span>Quick-Insert Scene</span>
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => setSelectedStyleRefId(null)}
                                className="w-full text-center py-0.5 text-[8px] text-slate-500 hover:text-slate-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* RIGHT SIDEBAR: Video Customization Panel & Prompt Input */}
      <aside className="w-80 border-l border-white/5 bg-[#080808] p-6 flex flex-col gap-6 overflow-y-auto">
        
        {/* SECTION 1: PROMPT TERMINAL GENERATOR */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-inner">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <label className="text-[10px] uppercase tracking-widest text-slate-300 font-bold block">
              Generate AI Screenplay
            </label>
          </div>
          <form onSubmit={handleGenerateVideo} className="space-y-4">
            <div className="relative">
              <textarea 
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                rows={3}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none transition-all font-mono leading-relaxed"
                placeholder="Describe a story, scene, or artistic direction to outline a detailed storyboard..."
              />
            </div>

            {/* Visual presets selector */}
            <div>
              <span className="text-[10px] text-slate-500 font-semibold mb-1.5 block">Visual Art Style</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Cinematic', 'Noir', 'Synthwave', 'Anime'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSelectedStyle(style)}
                    className={`py-1.5 px-2.5 rounded-lg text-[10px] font-semibold border transition-all ${
                      selectedStyle === style
                        ? 'bg-indigo-600 text-white border-indigo-500/50'
                        : 'bg-transparent text-slate-400 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity & Duration sliders */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-500 font-semibold">Motion Intensity</span>
                  <span className="text-indigo-400 uppercase font-mono">{motionIntensity}</span>
                </div>
                <div className="flex gap-1.5">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setMotionIntensity(level)}
                      className={`flex-1 py-1 text-[9px] font-mono rounded capitalize transition-all ${
                        motionIntensity === level
                          ? 'bg-indigo-500/25 text-indigo-400 border border-indigo-500/40'
                          : 'bg-black/40 text-slate-500 border border-transparent hover:text-slate-400'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-500 font-semibold">Storyboard Duration</span>
                  <span className="text-indigo-400 font-mono">{inputDuration}s</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="30"
                  step="5"
                  value={inputDuration}
                  onChange={(e) => setInputDuration(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-white/5 rounded-full"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !inputPrompt.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Stitching Storyboard...
                </>
              ) : (
                <>
                  <Film className="w-3.5 h-3.5" />
                  Generate Video Board
                </>
              )}
            </button>
          </form>
        </section>

        {/* SECTION 2: EDIT ACTIVE KEYFRAME TEXTS & MOTIONS */}
        <section className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Active Keyframe Director
              </label>
              <span className="text-[10px] font-mono text-indigo-400">
                SCENE 0{selectedSceneIndex + 1}
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Overlay Subtitles Text */}
              <div>
                <label className="text-[10px] text-slate-500 font-semibold mb-1 block">Overlay Caption Text</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempOverlayText}
                    onChange={(e) => setTempOverlayText(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  />
                  <button 
                    onClick={saveSceneEdits}
                    className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors"
                    title="Apply Edits"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Narration Script */}
              <div>
                <label className="text-[10px] text-slate-500 font-semibold mb-1 block">Voiceover Screenplay Script</label>
                <textarea
                  value={tempNarration}
                  onChange={(e) => setTempNarration(e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 resize-none"
                />
              </div>

              {/* Camera Motion Selection */}
              <div>
                <label className="text-[10px] text-slate-500 font-semibold mb-1 block">Camera Transition</label>
                <select
                  value={tempCameraType}
                  onChange={(e) => {
                    setTempCameraType(e.target.value);
                    // Live save
                    const updatedScenes = activeProject.scenes.map((scene, idx) => {
                      if (idx === selectedSceneIndex) {
                        return {
                          ...scene,
                          cameraMotion: { ...scene.cameraMotion, type: e.target.value }
                        };
                      }
                      return scene;
                    });
                    const updatedProject = { ...activeProject, scenes: updatedScenes };
                    setActiveProject(updatedProject);
                    setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="zoom-in">Zoom In (Ken Burns)</option>
                  <option value="zoom-out">Zoom Out</option>
                  <option value="pan-left">Pan Left</option>
                  <option value="pan-right">Pan Right</option>
                  <option value="dolly-in">Dolly In</option>
                  <option value="orbit">Orbit (3D Rotation)</option>
                </select>
              </div>

              {/* AI Keyframe Image Prompt & Generator */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-500 font-semibold block">AI Keyframe Image Prompt</label>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                    activeProject.scenes[selectedSceneIndex]?.imageUrl 
                      ? 'text-emerald-400 bg-emerald-500/10' 
                      : 'text-amber-400 bg-amber-500/10'
                  }`}>
                    {activeProject.scenes[selectedSceneIndex]?.imageUrl ? 'AI IMAGE LOADED' : 'PROCEDURAL FALLBACK'}
                  </span>
                </div>
                
                <textarea
                  value={tempImagePrompt}
                  onChange={(e) => setTempImagePrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
                  placeholder="Describe the cinematic image keyframe to generate..."
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={saveSceneEdits}
                    className="py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-white text-xs font-semibold transition-all"
                  >
                    Save Prompt
                  </button>
                  <button
                    onClick={() => handleGenerateAISceneImage(activeProject.scenes[selectedSceneIndex].id, tempImagePrompt)}
                    disabled={aiGeneratingScenes.includes(activeProject.scenes[selectedSceneIndex]?.id)}
                    className="py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/15"
                  >
                    {aiGeneratingScenes.includes(activeProject.scenes[selectedSceneIndex]?.id) ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Picture
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Soundtrack selector & Tip Box */}
          <div className="space-y-4 mt-6">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold mb-1 block">Ambient Soundtrack</label>
              <select
                value={activeProject.soundtrackPreset}
                onChange={(e) => {
                  const val = e.target.value as any;
                  const updatedProject = { ...activeProject, soundtrackPreset: val };
                  setActiveProject(updatedProject);
                  setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));
                }}
                className="w-full bg-indigo-950/20 border border-indigo-500/20 rounded-lg p-2 text-xs text-indigo-400 focus:outline-none cursor-pointer"
              >
                <option value="retro_synthwave">🌆 Retro Synthwave Beats</option>
                <option value="ambient_dark">🌌 Cosmic Deep Ambient</option>
                <option value="fantasy_orchestra">🎻 Strings Fantasy Orchestra</option>
                <option value="lofi_chill">☕ Smooth Vinyl Lofi Chill</option>
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/20 to-transparent border border-indigo-500/10">
              <p className="text-[10px] text-indigo-300 font-semibold mb-1">Interactive Video Director Pro-Tip</p>
              <p className="text-[9px] text-slate-500 leading-relaxed font-mono">
                Click any keyframe card below to seek the active player to that moment. You can edit captions, narration and transitions in real-time.
              </p>
            </div>
          </div>
        </section>

      </aside>

      {/* Toast Notification for Export Success, Ad Player & Premium Purchase Modals */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            downloadUrl={toast.downloadUrl}
            fileName={toast.fileName}
            onClose={() => setToast(null)}
          />
        )}

        {/* SPONSOR CINEMATIC AD MODAL */}
        {isAdModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0b0b0f] border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl shadow-black relative"
              id="sponsor-ad-player"
            >
              {/* Retro cinema background grids */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] pointer-events-none" />

              {/* Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5" /> Sponsor Cinematic Trailer
                </span>
                <span className="text-[10px] font-mono text-slate-500">Realm AI Ad Network v1.2</span>
              </div>

              {/* Theater Screen Visualizer */}
              <div className="p-6">
                <div className="aspect-video w-full rounded-2xl bg-black border border-indigo-500/20 overflow-hidden relative flex flex-col items-center justify-center text-center p-4">
                  {/* Decorative Scan Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none" />
                  
                  {adSecondsLeft > 0 ? (
                    <>
                      {/* Active countdown circle */}
                      <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 flex items-center justify-center mb-4 relative animate-pulse">
                        <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin" />
                        <span className="text-xl font-bold font-mono text-white">{adSecondsLeft}s</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-100 px-4 line-clamp-1">{currentAdTitle}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-1.5 uppercase tracking-wider">
                        Transmission streaming • Earns +5 Credits
                      </p>
                    </>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.8 }} 
                      animate={{ scale: 1 }} 
                      className="flex flex-col items-center justify-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/15">
                        <Check className="w-8 h-8 font-bold" />
                      </div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Ad Screening Complete!</h4>
                      <p className="text-xs text-emerald-400 mt-1 font-semibold">Your +5 credits reward is now ready</p>
                    </motion.div>
                  )}
                </div>

                {/* Simulated horizontal loading bar */}
                <div className="mt-5 space-y-2">
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: adSecondsLeft > 0 ? `${((5 - adSecondsLeft) / 5) * 100}%` : '100%' }}
                      transition={{ ease: 'linear' }}
                      className="h-full bg-indigo-500"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>{adSecondsLeft > 0 ? 'Sponsor ad playing' : 'Verified'}</span>
                    <span>{adSecondsLeft > 0 ? 'Watching...' : 'Completed'}</span>
                  </div>
                </div>
              </div>

              {/* Footers / Claim Button */}
              <div className="px-6 py-4 border-t border-white/5 bg-black/40 flex items-center justify-end">
                {adSecondsLeft > 0 ? (
                  <button 
                    disabled 
                    className="px-5 py-2 bg-white/5 border border-white/5 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed"
                  >
                    Wait {adSecondsLeft}s to claim
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsAdModalOpen(false);
                      setAdRewardClaimed(true);
                    }}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Claim +5 Credits
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* UPGRADE PREMIUM MODAL */}
        {isUpgradeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0b0b0f] border border-yellow-500/20 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl shadow-yellow-500/[0.02] relative p-6 text-center"
              id="premium-upgrade-card"
            >
              {/* Premium Glow Aura */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl -z-10" />

              {/* Crown Emblem */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 text-amber-950 flex items-center justify-center mx-auto mb-4 ring-4 ring-yellow-400/20 shadow-xl shadow-yellow-500/10">
                <Crown className="w-7 h-7 font-bold" />
              </div>

              <h3 className="font-serif text-xl italic text-white font-medium">Realm AI Premium</h3>
              <p className="text-[11px] text-yellow-500/80 font-semibold uppercase tracking-widest mt-1">Unlock Unlimited Cinematic Power</p>

              {/* Package Details */}
              <div className="my-6 space-y-3.5 text-left bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs shrink-0 mt-0.5">✓</div>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-200">Unlimited Screenplay Generations</h5>
                    <p className="text-[9px] text-slate-500 font-mono">Bypass all 10 credits limit checks entirely</p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs shrink-0 mt-0.5">✓</div>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-200">High-Fidelity AI Keyframe Rendering</h5>
                    <p className="text-[9px] text-slate-500 font-mono">Unlimited direct access calls to Imagen 3</p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs shrink-0 mt-0.5">✓</div>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-200">Extended Aspect Ratio Outputs</h5>
                    <p className="text-[9px] text-slate-500 font-mono">Cinematic 16:9 ultra-clean recording renders</p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs shrink-0 mt-0.5">✓</div>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-200">Realm AI Procedural Synth Engine</h5>
                    <p className="text-[9px] text-slate-500 font-mono">Hi-Fi stereo procedural atmospheric audio nodes</p>
                  </div>
                </div>
              </div>

              {/* Checkout / Lock trigger */}
              <button
                onClick={() => {
                  setIsPremium(true);
                  setIsUpgradeModalOpen(false);
                  setToast({
                    id: `premium-unlocked-${Date.now()}`,
                    message: 'Elite Premium successfully unlocked! Enjoy infinite rendering with zero boundaries.',
                    downloadUrl: '#',
                    fileName: 'Elite Lifetime Pass Active'
                  });
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 text-xs font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all font-mono tracking-wider uppercase shadow-lg shadow-yellow-500/15"
              >
                Go Premium — $19 Lifetime Access
              </button>

              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-full mt-2.5 py-2.5 bg-transparent hover:bg-white/5 text-slate-500 hover:text-white text-[10px] font-bold rounded-xl transition-all font-mono"
              >
                Keep Using Free Drafts
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* COMMUNITY SHOWCASE FEED MODAL */}
        {isCommunityOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-[#08080c] border border-white/10 rounded-3xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-indigo-500/[0.02]"
              id="community-feed-panel"
            >
              {/* Modal Header */}
              <div className="px-8 py-5 border-b border-white/5 bg-[#0b0b10] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg italic text-white font-medium flex items-center gap-2">
                      Realm AI Showcase Feed
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">Explore, load, and interact with community-shared cinematic sequences</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Filter Pills */}
                  <div className="hidden md:flex items-center gap-1.5 bg-white/[0.02] border border-white/5 p-1 rounded-full text-[10px] font-mono">
                    {['All', 'Cinematic', 'Noir', 'Synthwave', 'Anime'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setCommunityFilter(f)}
                        className={`px-2.5 py-1 rounded-full transition-all ${
                          communityFilter === f 
                            ? 'bg-indigo-600 text-white font-semibold' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsCommunityOpen(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-slate-400 hover:text-white rounded-full transition-all"
                    aria-label="Close Showcase"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body / Posts Grid */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#060609]">
                {communityLoading && communityPosts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-20">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-xs text-slate-500 font-mono">Tuning frequency channels to the Realm AI Feed...</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center border border-white/5 text-slate-500">
                      <Film className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">No Shared Creations Found</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Be the first to publish your video project to the showcase feed!</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsCommunityOpen(false);
                        handleShareToCommunity();
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share Active Project
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPosts.map((post) => {
                      const isLiked = post.likedBy?.includes('hendjack45@gmail.com');
                      const firstScene = post.projectData?.scenes?.[0];
                      const sceneCount = post.projectData?.scenes?.length || 0;
                      
                      return (
                        <div 
                          key={post.id} 
                          className="bg-[#0b0b11] border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:border-white/10 transition-all flex flex-col"
                          id={`post-card-${post.id}`}
                        >
                          {/* Post Card Visual Header/Banner preview */}
                          <div className="h-44 w-full bg-slate-950 overflow-hidden relative border-b border-white/5 shrink-0 group/card">
                            {firstScene?.imageUrl ? (
                              <img 
                                src={firstScene.imageUrl} 
                                alt={post.title} 
                                className="w-full h-full object-cover group-hover/card:scale-[1.03] transition-transform duration-700"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-950 to-indigo-950/20">
                                <Film className="w-8 h-8 text-indigo-500/30 animate-pulse" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                            
                            {/* Project details overlay */}
                            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                              <span className="text-[8.5px] font-bold font-mono px-2 py-0.5 rounded-full bg-black/60 text-indigo-400 uppercase tracking-widest border border-indigo-500/20">
                                {post.mood}
                              </span>
                              <span className="text-[8.5px] font-bold font-mono px-2 py-0.5 rounded-full bg-black/60 text-slate-300">
                                {sceneCount} Scenes
                              </span>
                            </div>

                            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                              <div className="min-w-0 pr-2">
                                <h4 className="text-xs font-bold text-white truncate font-serif italic">{post.title}</h4>
                                <p className="text-[9px] text-slate-400 font-mono truncate">By {post.authorEmail}</p>
                              </div>

                              <button
                                onClick={() => handleLoadCommunityProject(post)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold rounded-md transition-colors flex items-center gap-1 whitespace-nowrap shadow-md shadow-indigo-600/20"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" /> Play & Edit
                              </button>
                            </div>
                          </div>

                          {/* Post Card Description / Storyboard summary preview */}
                          <div className="p-4 flex-1 flex flex-col justify-between bg-black/20">
                            <p className="text-[10.5px] text-slate-400 leading-relaxed font-serif italic line-clamp-2">
                              "{firstScene?.narration || 'A breathtaking atmospheric sequence...'}"
                            </p>

                            {/* Interactions area (likes count, comments expand toggle) */}
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => handleLikePost(post.id)}
                                  className={`flex items-center gap-1.5 transition-colors ${
                                    isLiked ? 'text-rose-500 font-bold' : 'hover:text-slate-300'
                                  }`}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
                                  <span>{post.likes}</span>
                                </button>

                                <button
                                  onClick={() => setExpandedCommentsId(expandedCommentsId === post.id ? null : post.id)}
                                  className={`flex items-center gap-1.5 hover:text-slate-300 transition-colors ${
                                    expandedCommentsId === post.id ? 'text-indigo-400 font-bold' : ''
                                  }`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>{post.comments?.length || 0} Comments</span>
                                </button>
                              </div>

                              <span className="text-[8px] text-slate-600">{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>

                            {/* Expanded Comments Panel */}
                            {expandedCommentsId === post.id && (
                              <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-fadeIn">
                                {/* Comments List */}
                                <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                                  {post.comments && post.comments.length > 0 ? (
                                    post.comments.map((comment: any) => (
                                      <div key={comment.id} className="text-[10px] space-y-0.5 bg-white/[0.02] p-2 rounded-lg border border-white/5">
                                        <div className="flex justify-between text-[8px] font-mono">
                                          <span className="text-indigo-300 font-semibold">{comment.authorEmail}</span>
                                          <span className="text-slate-500">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-slate-300 leading-relaxed font-sans">{comment.text}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-[9px] text-slate-600 font-mono text-center py-2">No comments yet. Start the conversation!</p>
                                  )}
                                </div>

                                {/* Write Comment Input Box */}
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={commentInputs[post.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleAddComment(post.id);
                                      }
                                    }}
                                    placeholder="Add a comment..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none focus:border-indigo-500/50"
                                  />
                                  <button
                                    onClick={() => handleAddComment(post.id)}
                                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                                  >
                                    <Send className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
