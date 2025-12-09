'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Save, Play, Download, ArrowLeft, Plus, 
  Volume2, Settings, Type, Image, Move,
  Upload, Mic, Smile, Zap, Eye, EyeOff,
  Trash2, Copy, RotateCcw, Sparkles,
  Wand2, Bot, Clock, Layers, Film,
  ChevronDown, ChevronUp, Music, MessageSquare,
  X, Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import { parseStoryText, ParsedStory } from '@/lib/storyParser';
import type { Character, Scene, Project, StoryOptions, ExportProgress } from '@/lib/type';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [loading, setLoading] = useState(true);
  const [storyPrompt, setStoryPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showCharacterPanel, setShowCharacterPanel] = useState(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [sceneDescription, setSceneDescription] = useState('');
  const [parsedStory, setParsedStory] = useState<ParsedStory | null>(null);
  const [showStoryOptions, setShowStoryOptions] = useState(false);
  const [storyOptions, setStoryOptions] = useState<StoryOptions>({
    genre: 'fantasy',
    ageGroup: 'children',
    length: 'medium'
  });

  // AI Generation Status
  const [aiStatus, setAiStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedScenes, setGeneratedScenes] = useState(0);

  // Audio Generation State
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [audioText, setAudioText] = useState('');
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [audioVoice, setAudioVoice] = useState('Fritz-PlayAI');

  // Character Generation State
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');
  const [generatingCharacter, setGeneratingCharacter] = useState(false);

  // Export State - FIXED: Correct type definition
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    status: 'idle',
    progress: 0
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'video' | 'gif'>('video');
  const [exportResolution, setExportResolution] = useState('720p');

  // Real-time character positions
  const [characterPositions, setCharacterPositions] = useState<Record<string, { x: number, y: number }>>({});
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const genres = [
    'fantasy', 'adventure', 'sci-fi', 'mystery', 'comedy', 
    'fairy tale', 'animal', 'educational', 'superhero', 'historical'
  ];

  const ageGroups = [
    { value: 'children', label: 'Children (5-10)' },
    { value: 'teens', label: 'Teens (11-17)' },
    { value: 'all-ages', label: 'All Ages' }
  ];

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  useEffect(() => {
    if (activeScene) {
      setSceneDescription(activeScene.description || '');
      // Initialize character positions from active scene
      const positions: Record<string, { x: number, y: number }> = {};
      activeScene.scene_characters?.forEach(sceneChar => {
        positions[sceneChar.character_id] = {
          x: sceneChar.position_x,
          y: sceneChar.position_y
        };
      });
      setCharacterPositions(positions);
    }
  }, [activeScene]);

  const fetchProjectData = async () => {
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);
      setStoryPrompt(projectData.story_text || '');

      // Parse the story if it exists
      if (projectData.story_text) {
        try {
          const parsed = parseStoryText(projectData.story_text);
          setParsedStory(parsed);
        } catch (parseError) {
          console.log('Could not parse story:', parseError);
        }
      }

      // Fetch scenes with characters
      const { data: scenesData, error: scenesError } = await supabase
        .from('scenes')
        .select(`
          *,
          scene_characters (
            *,
            characters (*)
          )
        `)
        .eq('project_id', projectId)
        .order('scene_number');

      if (scenesError) throw scenesError;
      setScenes(scenesData || []);
      if (scenesData && scenesData.length > 0) {
        setActiveScene(scenesData[0]);
      }

      // Fetch characters
      await fetchCharacters();
    } catch (error: any) {
      console.error('Failed to load project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacters = async () => {
    try {
      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (charactersError) throw charactersError;
      setCharacters(charactersData || []);
    } catch (error: any) {
      console.error('Error fetching characters:', error);
      toast.error('Failed to load characters');
    }
  };

  const saveProject = async () => {
    try {
      const { error: projectError } = await supabase
        .from('projects')
        .update({ 
          updated_at: new Date().toISOString(),
          story_text: storyPrompt 
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      if (activeScene) {
        const { error: sceneError } = await supabase
          .from('scenes')
          .update({ 
            description: sceneDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeScene.id);

        if (sceneError) throw sceneError;
      }

      toast.success('Project saved successfully!');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Failed to save project');
    }
  };

  const removeCharacterFromScene = async (sceneCharacterId: string) => {
    if (!activeScene) return;

    try {
      const { error } = await supabase
        .from('scene_characters')
        .delete()
        .eq('id', sceneCharacterId);

      if (error) throw error;

      // Update local state immediately
      const updatedScene = {
        ...activeScene,
        scene_characters: activeScene.scene_characters?.filter(sc => sc.id !== sceneCharacterId) || []
      };
      setActiveScene(updatedScene);
      
      // Update scenes list
      setScenes(scenes.map(scene => 
        scene.id === activeScene.id ? updatedScene : scene
      ));

      toast.success('Character removed from scene');
    } catch (error: any) {
      console.error('Error removing character from scene:', error);
      toast.error('Failed to remove character from scene');
    }
  };

  const updateCharacterPosition = async (sceneCharacterId: string, characterId: string, x: number, y: number) => {
    if (!activeScene) return;

    // Update local state immediately for real-time movement
    const updatedScene = {
      ...activeScene,
      scene_characters: activeScene.scene_characters?.map(sc => 
        sc.id === sceneCharacterId 
          ? { ...sc, position_x: x, position_y: y }
          : sc
      ) || []
    };
    setActiveScene(updatedScene);
    setCharacterPositions(prev => ({
      ...prev,
      [characterId]: { x, y }
    }));

    // Update database in background
    try {
      const { error: updateError } = await supabase
        .from('scene_characters')
        .update({ 
          position_x: Math.round(x), 
          position_y: Math.round(y) 
        })
        .eq('id', sceneCharacterId);

      if (updateError) {
        console.error('Failed to save position:', updateError);
      }
    } catch (error) {
      console.error('Failed to update character position:', error);
    }
  };

  const handleCharacterDragStart = (characterId: string) => {
    setIsDragging(characterId);
  };

  const handleCharacterDragEnd = (e: React.DragEvent, sceneChar: any) => {
    setIsDragging(null);
    
    const canvas = document.querySelector('.animation-canvas') as HTMLElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((rect.bottom - e.clientY) / rect.height) * 100;
    
    // Clamp values between 0-100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    updateCharacterPosition(sceneChar.id, sceneChar.character_id, clampedX, clampedY);
  };

  const exportVideo = async () => {
    if (!projectId || scenes.length === 0) {
      toast.error('No scenes to export');
      return;
    }

    setExportProgress({ status: 'exporting', progress: 0 });
    setShowExportModal(true);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 500);

      // Call export API
      const response = await fetch(`/api/export/video?projectId=${projectId}&format=${exportFormat}&resolution=${exportResolution}`, {
        method: 'GET'
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const data = await response.json();
      
      setExportProgress({
        status: 'completed',
        progress: 100,
        downloadUrl: data.downloadUrl
      });

      // If we have a download URL, show success and create download link
      if (data.downloadUrl) {
        toast.success('Video exported successfully! Starting download...');
        
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = `${project?.title || 'cartoon'}-export.${exportFormat === 'video' ? 'mp4' : 'gif'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, 1000);
      } else {
        toast.success('Video export started! Check your dashboard for the download link.');
      }

    } catch (error: any) {
      console.error('Export error:', error);
      setExportProgress({
        status: 'failed',
        progress: 0,
        error: error.message
      });
      toast.error(`Export failed: ${error.message}`);
    }
  };

  const generateStory = async () => {
    if (!storyPrompt.trim()) {
      toast.error('Please enter a story prompt');
      return;
    }

    setGenerating(true);
    setAiStatus('generating');
    setGenerationProgress(10);

    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + 2, 90));
    }, 500);

    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: storyPrompt.trim(),
          ...storyOptions 
        }),
      });

      clearInterval(progressInterval);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error(
            'API endpoint not found (404). Make sure the file exists at: app/api/story/route.ts'
          );
        }
        
        throw new Error(`Invalid response format: ${contentType}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Story generation failed');
      }

      setGenerationProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update project with generated story
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          story_text: data.story,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      setStoryPrompt(data.story);
      
      let parsed: ParsedStory;
      try {
        parsed = parseStoryText(data.story);
        if (!parsed.scenes || parsed.scenes.length === 0) {
          console.warn('No scenes found in parsed story, using fallback parser');
          const { parseSimpleStory } = await import('@/lib/storyParser');
          parsed = parseSimpleStory(data.story);
        }
      } catch (parseError) {
        console.error('Story parsing error, using fallback:', parseError);
        const { parseSimpleStory } = await import('@/lib/storyParser');
        parsed = parseSimpleStory(data.story);
      }
      
      setParsedStory(parsed);
      
      await autoCreateScenesFromParsedStory(parsed);
      
      setAiStatus('success');
      toast.success(`Story generated successfully! Auto-created ${parsed.scenes?.length || 0} scenes.`);
      
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Story generation error:', error);
      
      let errorMessage = error.message || 'Failed to generate story';
      
      if (errorMessage.includes('API endpoint not found')) {
        errorMessage = 'API route not found. Please create the file at: app/api/story/route.ts';
      } else if (errorMessage.includes('GROQ_API_KEY') || errorMessage.includes('API key')) {
        errorMessage = 'API key not configured. Get a free key from console.groq.com';
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a minute.';
      }
      
      setAiStatus('error');
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
      setTimeout(() => setAiStatus('idle'), 3000);
    }
  };

  const autoCreateScenesFromParsedStory = async (parsed: ParsedStory) => {
    if (!parsed?.scenes || parsed.scenes.length === 0) {
      toast.error('No scenes to create');
      return;
    }

    const toastId = toast.loading(`Creating ${parsed.scenes.length} scenes...`);
    
    try {
      // Clear existing scenes
      const { error: deleteError } = await supabase
        .from('scenes')
        .delete()
        .eq('project_id', projectId);
      
      if (deleteError) throw deleteError;

      // Create scenes
      for (let i = 0; i < parsed.scenes.length; i++) {
        const scene = parsed.scenes[i];
        setGeneratedScenes(i + 1);
        
        const backgroundUrl = await generateSceneBackground(scene, parsed);
        
        const sceneDescription = `
Title: ${scene.title}
Location: ${scene.location}
Characters: ${scene.characters.join(', ')}
Action: ${scene.action}
Dialogue: ${scene.dialogue || 'No dialogue'}
        `.trim();

        const { data: newScene, error: sceneError } = await supabase
          .from('scenes')
          .insert([{
            project_id: projectId,
            scene_number: i + 1,
            description: sceneDescription.substring(0, 200),
            background_image_url: backgroundUrl,
            duration: 5,
            animations: [{ type: 'fadeIn', duration: 1 }],
          }])
          .select()
          .single();
        
        if (sceneError) throw sceneError;

        await createCharactersForScene(parsed.title || 'Story', scene.characters, newScene.id);
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      await fetchProjectData();
      
      toast.dismiss(toastId);
      
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error('Error creating scenes:', error);
      toast.error('Failed to create all scenes');
    }
  };

  const generateSceneBackground = async (scene: any, storyContext?: ParsedStory): Promise<string> => {
    try {
      const response = await fetch('/api/ai/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneNumber: scene.sceneNumber || scene.scene_number || 1,
          sceneTitle: scene.title,
          sceneLocation: scene.location,
          sceneAction: scene.action,
          sceneCharacters: Array.isArray(scene.characters) ? scene.characters : [],
          storyTitle: storyContext?.title,
          storyGenre: storyContext?.genre,
          allCharacters: storyContext?.characters 
            ? storyContext.characters.map((c: any) => typeof c === 'string' ? c : c.name)
            : (characters.length > 0 ? characters.map(c => c.name) : []),
          storyContext: storyContext?.summary
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.backgroundUrl || `https://picsum.photos/seed/${Date.now()}/800/600`;
      }
    } catch (error) {
      console.error('Error generating scene background:', error);
    }

    const sceneKeywords = `${scene.title} ${scene.location} cartoon background`.toLowerCase();
    
    if (sceneKeywords.includes('forest') || sceneKeywords.includes('jungle') || sceneKeywords.includes('woods')) {
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
    } else if (sceneKeywords.includes('castle') || sceneKeywords.includes('palace') || sceneKeywords.includes('kingdom')) {
      return 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&h=600&fit=crop';
    } else if (sceneKeywords.includes('space') || sceneKeywords.includes('planet')) {
      return 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=600&fit=crop';
    } else if (sceneKeywords.includes('beach') || sceneKeywords.includes('ocean') || sceneKeywords.includes('sea')) {
      return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop';
    } else if (sceneKeywords.includes('city') || sceneKeywords.includes('urban') || sceneKeywords.includes('town') || sceneKeywords.includes('village')) {
      return 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop';
    } else if (sceneKeywords.includes('mountain') || sceneKeywords.includes('hill')) {
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
    } else if (sceneKeywords.includes('garden') || sceneKeywords.includes('flower')) {
      return 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop';
    } else {
      const seedString = `${scene.sceneNumber || 1}-${scene.location || scene.title}`;
      const seed = seedString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return `https://picsum.photos/seed/${seed}/800/600`;
    }
  };

  const createCharactersForScene = async (storyTitle: string, characterNames: string[], sceneId: string) => {
    for (const charName of characterNames.slice(0, 5)) {
      const existingChar = characters.find(c => 
        c.name.toLowerCase() === charName.toLowerCase()
      );
      
      if (!existingChar) {
        try {
          const { data: newChar, error: charError } = await supabase
            .from('characters')
            .insert([{
              project_id: projectId,
              name: charName,
              description: `Character from "${storyTitle}"`,
              character_type: 'cartoon',
              image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${charName}&backgroundColor=4f46e5&radius=50`,
              is_ai_generated: true,
            }])
            .select()
            .single();
          
          if (newChar && !charError) {
            await supabase
              .from('scene_characters')
              .insert([{
                scene_id: sceneId,
                character_id: newChar.id,
                position_x: 20 + (Math.random() * 60),
                position_y: 30 + (Math.random() * 40),
                scale: 0.8 + (Math.random() * 0.4),
                expression: 'happy',
              }]);
          }
        } catch (error) {
          console.error('Error creating character:', error);
        }
      }
    }
  };

  const generateCharactersFromStory = async () => {
    if (!parsedStory?.characters || parsedStory.characters.length === 0) {
      toast.error('No characters found in the story. Generate a story first.');
      return;
    }

    const toastId = toast.loading(`Creating ${parsedStory.characters.length} characters...`);

    try {
      const createdChars: Character[] = [];

      for (const storyChar of parsedStory.characters) {
        const existingChar = characters.find(c => 
          c.name.toLowerCase() === storyChar.name.toLowerCase()
        );

        if (!existingChar) {
          const charSeed = storyChar.name + storyChar.description;
          const imageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(charSeed)}&backgroundColor=4f46e5&radius=50`;

          const { data: newChar, error: charError } = await supabase
            .from('characters')
            .insert([{
              project_id: projectId,
              name: storyChar.name,
              description: storyChar.description,
              character_type: 'cartoon',
              image_url: imageUrl,
              is_ai_generated: true,
            }])
            .select()
            .single();

          if (newChar && !charError) {
            createdChars.push(newChar);
          }
        } else {
          createdChars.push(existingChar);
        }
      }

      await fetchCharacters();

      toast.dismiss(toastId);
      toast.success(`Created ${createdChars.length} characters from story!`);
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error('Error generating characters:', error);
      toast.error('Failed to generate characters');
    }
  };

  const duplicateCharacter = async (character: Character) => {
    try {
      const { data: newCharacter, error } = await supabase
        .from('characters')
        .insert([{
          project_id: projectId,
          name: `${character.name} (Copy)`,
          description: character.description,
          character_type: character.character_type,
          image_url: character.image_url,
          is_ai_generated: character.is_ai_generated || false
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchCharacters();
      toast.success('Character duplicated successfully!');
    } catch (error: any) {
      console.error('Error duplicating character:', error);
      toast.error('Failed to duplicate character');
    }
  };

  const deleteCharacter = async (characterId: string) => {
    if (!confirm('Are you sure you want to delete this character? This will remove it from all scenes.')) {
      return;
    }

    try {
      const { error: sceneCharError } = await supabase
        .from('scene_characters')
        .delete()
        .eq('character_id', characterId);

      if (sceneCharError) throw sceneCharError;

      const { error: charError } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId);

      if (charError) throw charError;

      setCharacters(characters.filter(c => c.id !== characterId));
      
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacter(null);
      }

      toast.success('Character deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting character:', error);
      toast.error('Failed to delete character. Make sure character is not in any scenes.');
    }
  };

  const addCharacterToScene = async (character: Character, sceneId?: string) => {
    const targetSceneId = sceneId || activeScene?.id;
    
    if (!targetSceneId) {
      toast.error('Please select a scene first');
      return;
    }

    const targetScene = scenes.find(s => s.id === targetSceneId);
    if (!targetScene) {
      toast.error('Scene not found');
      return;
    }

    const isAlreadyInScene = targetScene.scene_characters?.some(
      sc => sc.character_id === character.id
    );

    if (isAlreadyInScene) {
      toast.error('Character is already in this scene');
      return;
    }

    try {
      const position_x = Math.round(20 + Math.random() * 60);
      const position_y = Math.round(20 + Math.random() * 60);
      const scale = parseFloat((0.8 + Math.random() * 0.4).toFixed(2));

      const { error } = await supabase
        .from('scene_characters')
        .insert([{
          scene_id: targetSceneId,
          character_id: character.id,
          position_x: position_x,
          position_y: position_y,
          scale: scale,
          expression: 'happy',
        }]);

      if (error) throw error;

      await fetchProjectData();
      toast.success(`${character.name} added to scene!`);
    } catch (error: any) {
      console.error('Error adding character to scene:', error);
      toast.error('Failed to add character to scene');
    }
  };

  const generateScene = async () => {
    try {
      const sceneNumber = scenes.length + 1;
      const loadingToast = toast.loading('Generating scene...');
      
      const sceneData: any = {
        sceneNumber: sceneNumber,
        prompt: sceneDescription || storyPrompt || 'cartoon scene'
      };

      if (parsedStory) {
        sceneData.storyTitle = parsedStory.title;
        sceneData.storyGenre = parsedStory.genre;
        sceneData.storyContext = parsedStory.summary;
        sceneData.allCharacters = parsedStory.characters?.map((c: any) => c.name) || [];
        
        const matchingStoryScene = parsedStory.scenes?.find(s => s.sceneNumber === sceneNumber);
        if (matchingStoryScene) {
          sceneData.sceneTitle = matchingStoryScene.title;
          sceneData.sceneLocation = matchingStoryScene.location;
          sceneData.sceneAction = matchingStoryScene.action;
          sceneData.sceneCharacters = matchingStoryScene.characters;
        }
      } else if (characters.length > 0) {
        sceneData.allCharacters = characters.map(c => c.name);
      }
      
      const response = await fetch('/api/ai/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sceneData),
      });

      let generatedSceneData;
      if (response.ok) {
        generatedSceneData = await response.json();
      } else {
        const fallbackBackground = await generateSceneBackground(
          { sceneNumber, location: sceneDescription, title: sceneDescription }, 
          parsedStory || undefined
        );
        generatedSceneData = {
          description: `Scene ${sceneNumber}: ${sceneDescription || storyPrompt || 'A new scene'}`,
          backgroundUrl: fallbackBackground,
          suggestedCharacters: characters.length > 0 ? characters.slice(0, 3).map(c => c.name) : ['Hero', 'Friend', 'Villain']
        };
      }

      const { data: newScene, error: sceneError } = await supabase
        .from('scenes')
        .insert([{
          project_id: projectId,
          scene_number: sceneNumber,
          description: generatedSceneData.description.substring(0, 200),
          background_image_url: generatedSceneData.backgroundUrl,
          duration: 5,
          animations: [{ type: 'fadeIn', duration: 1 }],
        }])
        .select()
        .single();

      if (sceneError) throw sceneError;

      toast.dismiss(loadingToast);
      
      await fetchProjectData();
      
      if (generatedSceneData.suggestedCharacters) {
        const { data: newSceneData } = await supabase
          .from('scenes')
          .select('*')
          .eq('project_id', projectId)
          .eq('scene_number', sceneNumber)
          .single();
        
        if (newSceneData) {
          const { data: latestCharacters } = await supabase
            .from('characters')
            .select('*')
            .eq('project_id', projectId);
          
          if (latestCharacters && latestCharacters.length > 0) {
            for (const charName of generatedSceneData.suggestedCharacters.slice(0, 3)) {
              const char = latestCharacters.find(c => c.name === charName);
              if (char) {
                try {
                  const { data: existing } = await supabase
                    .from('scene_characters')
                    .select('*')
                    .eq('scene_id', newSceneData.id)
                    .eq('character_id', char.id)
                    .single();
                  
                  if (!existing) {
                    await addCharacterToScene(char, newSceneData.id);
                  }
                } catch (err) {
                  console.log('Character already in scene or error:', err);
                }
              }
            }
          }
          
          await fetchProjectData();
        }
      }
      
      toast.success('Scene generated with story context!');
    } catch (error: any) {
      toast.dismiss();
      console.error('Scene generation error:', error);
      toast.error(error.message || 'Failed to generate scene');
    }
  };

  const generateCharacter = async () => {
    setShowCharacterModal(true);
    setCharacterName('');
    setCharacterDescription('');
  };

  const createCharacterWithAI = async () => {
    const name = characterName.trim();
    const desc = characterDescription.trim();

    if (!name) {
      toast.error('Please enter a character name');
      return;
    }

    if (!desc) {
      toast.error('Please enter a character description');
      return;
    }

    setGeneratingCharacter(true);

    try {
      const response = await fetch('/api/ai/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          characterName: name,
          description: desc,
          genre: storyOptions.genre
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate character: ${response.status}`);
      }

      const characterData = await response.json();

      const { data: newCharacter, error: characterError } = await supabase
        .from('characters')
        .insert([{
          project_id: projectId,
          name: characterData.name || name,
          description: characterData.description || desc,
          character_type: 'cartoon',
          image_url: characterData.imageUrl,
          is_ai_generated: true
        }])
        .select()
        .single();

      if (characterError) throw characterError;

      await fetchCharacters();
      
      setShowCharacterModal(false);
      setCharacterName('');
      setCharacterDescription('');
      
      toast.success(`${characterData.name} created successfully!`);
      
      if (activeScene && newCharacter) {
        setTimeout(() => {
          addCharacterToScene(newCharacter, activeScene.id);
        }, 500);
      }
    } catch (error: any) {
      console.error('Character generation error:', error);
      
      try {
        const fallbackImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=4f46e5&radius=50`;
        
        const { data: newCharacter, error: characterError } = await supabase
          .from('characters')
          .insert([{
            project_id: projectId,
            name: name,
            description: desc,
            character_type: 'cartoon',
            image_url: fallbackImage,
            is_ai_generated: false
          }])
          .select()
          .single();

        if (characterError) throw characterError;

        await fetchCharacters();
        setShowCharacterModal(false);
        setCharacterName('');
        setCharacterDescription('');
        toast.success(`${name} created!`);
        
        if (activeScene && newCharacter) {
          setTimeout(() => {
            addCharacterToScene(newCharacter, activeScene.id);
          }, 500);
        }
      } catch (fallbackError: any) {
        console.error('Fallback creation error:', fallbackError);
        toast.error('Failed to create character. Please try again.');
      }
    } finally {
      setGeneratingCharacter(false);
    }
  };

  const exportAnimation = () => {
    setShowExportModal(true);
  };

  const deleteScene = async (sceneId: string) => {
    if (!confirm('Delete this scene?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('scenes')
        .delete()
        .eq('id', sceneId);

      if (deleteError) throw deleteError;

      const newScenes = scenes.filter(s => s.id !== sceneId);
      setScenes(newScenes);
      if (activeScene?.id === sceneId && newScenes.length > 0) {
        setActiveScene(newScenes[0]);
      }
      toast.success('Scene deleted');
    } catch (error: any) {
      console.error('Delete scene error:', error);
      toast.error('Failed to delete scene');
    }
  };

  const duplicateScene = async (scene: Scene) => {
    try {
      const { data: newScene, error: duplicateError } = await supabase
        .from('scenes')
        .insert([{
          project_id: projectId,
          scene_number: scenes.length + 1,
          description: `${scene.description} (Copy)`,
          background_image_url: scene.background_image_url,
          duration: scene.duration,
        }])
        .select()
        .single();

      if (duplicateError) throw duplicateError;

      setScenes([...scenes, newScene]);
      toast.success('Scene duplicated!');
    } catch (error: any) {
      console.error('Duplicate scene error:', error);
      toast.error('Failed to duplicate scene');
    }
  };

  const generateVoiceover = () => {
    setShowAudioModal(true);
    
    if (parsedStory?.scenes && parsedStory.scenes.length > 0) {
      const firstScene = parsedStory.scenes[0];
      if (firstScene.dialogue) {
        const dialogue = firstScene.dialogue.replace(/^["']|["']$/g, '').trim();
        setAudioText(dialogue || '');
      }
    }
  };

  const generateAudio = async () => {
    if (!audioText.trim()) {
      toast.error('Please enter text to generate audio');
      return;
    }

    if (audioText.length > 5000) {
      toast.error('Text is too long. Maximum 5000 characters.');
      return;
    }

    setGeneratingAudio(true);
    setGeneratedAudioUrl(null);

    try {
      const response = await fetch('/api/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: audioText.trim(),
          voice: audioVoice,
          response_format: 'wav',
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response. Check API endpoint.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to generate audio`);
      }

      if (!data.success || !data.audio) {
        throw new Error('Invalid response from audio API');
      }

      // Handle both base64 and URL responses
      let audioUrl: string;
      if (data.audio.startsWith('http')) {
        audioUrl = data.audio;
      } else {
        // Assume it's base64
        const audioBlob = new Blob([
          Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))
        ], { type: 'audio/wav' });
        audioUrl = URL.createObjectURL(audioBlob);
      }
      
      setGeneratedAudioUrl(audioUrl);
      
      toast.success('Audio generated successfully!');
    } catch (error: any) {
      console.error('Audio generation error:', error);
      toast.error(error.message || 'Failed to generate audio. Check API configuration.');
    } finally {
      setGeneratingAudio(false);
    }
  };

  const selectDialogueFromScene = (sceneIndex: number) => {
    if (parsedStory?.scenes?.[sceneIndex]) {
      const parsedScene = parsedStory.scenes[sceneIndex];
      if (parsedScene.dialogue) {
        const dialogue = parsedScene.dialogue.replace(/^["']|["']$/g, '').trim();
        setAudioText(dialogue || '');
        toast.success(`Loaded dialogue from Scene ${sceneIndex + 1}`);
        return;
      }
    }
    
    const dbScene = scenes.find(s => s.scene_number === sceneIndex + 1);
    if (dbScene && dbScene.description) {
      const dialogueMatch = dbScene.description.match(/Dialogue:\s*(.+)/i);
      if (dialogueMatch && dialogueMatch[1]) {
        const dialogue = dialogueMatch[1].replace(/^["']|["']$/g, '').trim();
        setAudioText(dialogue);
        toast.success(`Loaded dialogue from Scene ${sceneIndex + 1}`);
        return;
      }
    }
    
    toast.error('This scene has no dialogue');
  };

  const insertAudioIntoScene = async (sceneId: string) => {
  if (!generatedAudioUrl) {
    toast.error('No audio generated yet');
    return;
  }

  try {
    // If the generatedAudioUrl is a data URL (base64), we need to extract the base64 part
    let audioData = generatedAudioUrl;
    
    // If it's a blob URL, fetch it and convert to base64
    if (generatedAudioUrl.startsWith('blob:')) {
      try {
        const response = await fetch(generatedAudioUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch audio blob');
        }
        const blob = await response.blob();
        audioData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (fetchError) {
        console.error('Error fetching blob URL:', fetchError);
        toast.error('Failed to process audio file');
        return;
      }
    }
    
    // If it's already a data URL, store it directly
    const { error } = await supabase
      .from('scenes')
      .update({ 
        audio_url: audioData,
        updated_at: new Date().toISOString()
      })
      .eq('id', sceneId);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    toast.success('Audio inserted into scene!');
    
    // Refresh the scene data
    if (activeScene?.id === sceneId) {
      const { data: updatedScene } = await supabase
        .from('scenes')
        .select('*')
        .eq('id', sceneId)
        .single();
      
      if (updatedScene) {
        setActiveScene(updatedScene);
        setScenes(scenes.map(scene => 
          scene.id === sceneId ? updatedScene : scene
        ));
      }
    }
  } catch (error: any) {
    console.error('Error inserting audio:', error);
    toast.error('Failed to insert audio into scene. Please try again.');
  }
};

  // Render AI Status Indicator
  const renderAIStatus = () => {
    if (aiStatus === 'idle') return null;

    return (
      <div className="fixed top-4 right-4 z-50">
        <div className={`p-4 rounded-lg shadow-lg border ${
          aiStatus === 'generating' ? 'bg-blue-900/90 border-blue-700' :
          aiStatus === 'success' ? 'bg-green-900/90 border-green-700' :
          'bg-red-900/90 border-red-700'
        }`}>
          <div className="flex items-center space-x-3">
            {aiStatus === 'generating' && (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <div>
                  <div className="font-medium">Generating Story...</div>
                  <div className="text-sm opacity-80">
                    {generatedScenes > 0 
                      ? `Creating scene ${generatedScenes}...` 
                      : 'Starting generation...'
                    }
                  </div>
                  <div className="w-48 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              </>
            )}
            {aiStatus === 'success' && (
              <>
                <Sparkles className="h-5 w-5 text-green-400" />
                <div>
                  <div className="font-medium">Story Generated!</div>
                  <div className="text-sm opacity-80">
                    Created {parsedStory?.scenes?.length || 0} scenes
                  </div>
                </div>
              </>
            )}
            {aiStatus === 'error' && (
              <>
                <Bot className="h-5 w-5 text-red-400" />
                <div>
                  <div className="font-medium">Generation Failed</div>
                  <div className="text-sm opacity-80">
                    Check your API key
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Export Status - FIXED: Proper type checking
  const renderExportStatus = () => {
    if (exportProgress.status === 'idle') return null;

    return (
      <div className="fixed top-4 right-4 z-50">
        <div className={`p-4 rounded-lg shadow-lg border ${
          exportProgress.status === 'exporting' ? 'bg-blue-900/90 border-blue-700' :
          exportProgress.status === 'completed' ? 'bg-green-900/90 border-green-700' :
          'bg-red-900/90 border-red-700'
        }`}>
          <div className="flex items-center space-x-3">
            {exportProgress.status === 'exporting' && (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <div>
                  <div className="font-medium">Exporting Video...</div>
                  <div className="text-sm opacity-80">
                    This may take a minute
                  </div>
                  <div className="w-48 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${exportProgress.progress}%` }}
                    />
                  </div>
                </div>
              </>
            )}
            {exportProgress.status === 'completed' && (
              <>
                <Video className="h-5 w-5 text-green-400" />
                <div>
                  <div className="font-medium">Export Complete!</div>
                  <div className="text-sm opacity-80">
                    Video download started
                  </div>
                </div>
              </>
            )}
            {exportProgress.status === 'failed' && (
              <>
                <Video className="h-5 w-5 text-red-400" />
                <div>
                  <div className="font-medium">Export Failed</div>
                  <div className="text-sm opacity-80">
                    {exportProgress.error || 'Unknown error'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render story summary
  const renderStorySummary = () => {
    if (!parsedStory || !parsedStory.title) return null;

    return (
      <div className="bg-gradient-to-r from-purple-800/40 to-pink-800/40 rounded-xl p-4 mb-4 border border-purple-700/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600/50 rounded-lg">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{parsedStory.title}</h3>
              <p className="text-sm text-gray-300">{parsedStory.summary}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-purple-600/50 rounded-full text-sm">
              {parsedStory.scenes?.length || 0} Scenes
            </span>
            <button
              onClick={() => setParsedStory(null)}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* AI Status Overlay */}
      {renderAIStatus()}
      {renderExportStatus()}

      {/* Top Bar */}
      <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition hover:bg-gray-700 p-2 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-700" />
              <h1 className="text-xl font-bold truncate max-w-md">{project?.title}</h1>
              {parsedStory && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm">
                  <Sparkles className="h-3 w-3" />
                  <span>AI Story</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={saveProject}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => router.push(`/play/${projectId}`)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
              >
                <Play className="h-4 w-4" />
                <span>Preview</span>
              </button>
              <button
                onClick={exportAnimation}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Story Summary */}
        {renderStorySummary()}
        
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Story & Scenes */}
          <div className="col-span-3 space-y-6">
            {/* AI Story Generator Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Wand2 className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold">AI Story Generator</h3>
                </div>
                <button
                  onClick={() => setShowStoryOptions(!showStoryOptions)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  {showStoryOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {/* Story Options */}
              {showStoryOptions && (
                <div className="mb-4 space-y-3 bg-gray-900/50 p-3 rounded-lg">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Genre</label>
                    <select
                      value={storyOptions.genre}
                      onChange={(e) => setStoryOptions({...storyOptions, genre: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm"
                    >
                      {genres.map(genre => (
                        <option key={genre} value={genre}>
                          {genre.charAt(0).toUpperCase() + genre.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Age Group</label>
                    <select
                      value={storyOptions.ageGroup}
                      onChange={(e) => setStoryOptions({...storyOptions, ageGroup: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm"
                    >
                      {ageGroups.map(group => (
                        <option key={group.value} value={group.value}>
                          {group.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Length</label>
                    <div className="flex space-x-2">
                      {(['short', 'medium', 'long'] as const).map(length => (
                        <button
                          key={length}
                          onClick={() => setStoryOptions({...storyOptions, length})}
                          className={`flex-1 py-2 rounded-lg text-sm transition ${
                            storyOptions.length === length
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                              : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          {length.charAt(0).toUpperCase() + length.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <textarea
                value={storyPrompt}
                onChange={(e) => setStoryPrompt(e.target.value)}
                placeholder="Describe your cartoon story idea... (e.g., A brave rabbit who discovers magic in the forest)"
                className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              
              <button
                onClick={generateStory}
                disabled={generating}
                className="w-full mt-3 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center font-medium"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Complete Story
                  </>
                )}
              </button>

              {/* Quick Tips */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  💡 Tip: Be specific! Add characters, locations, and conflicts for better stories.
                </p>
              </div>
            </div>

            {/* Scenes List */}
            <div className="bg-gray-800/90 rounded-xl p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold">Scenes ({scenes.length})</h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={generateScene}
                    className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:opacity-90 transition"
                    title="Generate Scene"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowCharacterPanel(!showCharacterPanel)}
                    className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                    title="Toggle Panel"
                  >
                    {showCharacterPanel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={`group relative p-3 rounded-lg transition-all ${
                      activeScene?.id === scene.id
                        ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30'
                        : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent hover:border-gray-600'
                    }`}
                  >
                    <button
                      onClick={() => setActiveScene(scene)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center">
                          <div className="w-6 h-6 flex items-center justify-center bg-black/30 rounded mr-2">
                            {scene.scene_number}
                          </div>
                          Scene {scene.scene_number}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center">
                          {scene.duration}s
                          {scene.audio_url && (
                            <Music className="h-3 w-3 ml-2 text-blue-400" />
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-300 truncate mt-1 pl-8">
                        {scene.description || 'No description'}
                      </div>
                      <div className="text-xs text-gray-500 mt-2 flex items-center space-x-2">
                        <span>{scene.scene_characters?.length || 0} characters</span>
                      </div>
                    </button>
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition flex space-x-1">
                      <button
                        onClick={() => duplicateScene(scene)}
                        className="p-1 bg-gray-600 rounded hover:bg-gray-500"
                        title="Duplicate"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteScene(scene.id)}
                        className="p-1 bg-red-600/50 rounded hover:bg-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {scenes.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No scenes yet</p>
                  <button
                    onClick={generateScene}
                    className="mt-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition"
                  >
                    Generate First Scene
                  </button>
                </div>
              )}
            </div>

            {/* Character Generator */}
            <div className="bg-gray-800/90 rounded-xl p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Smile className="h-5 w-5 text-yellow-400" />
                  <h3 className="font-bold">Characters ({characters.length})</h3>
                </div>
                <button
                  onClick={generateCharacter}
                  className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:opacity-90 transition text-sm"
                >
                  <Plus className="h-3 w-3" />
                  <span>AI Generate</span>
                </button>
              </div>
              
              {/* Character List with Duplicate/Delete Options */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {characters.map((character) => (
                  <div
                    key={character.id}
                    className="group flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="h-10 w-10 rounded-full bg-cover bg-center border-2 border-purple-500 shadow-lg flex-shrink-0"
                        style={{ 
                          backgroundImage: `url(${character.image_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=4f46e5'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <div>
                        <div className="font-medium">{character.name}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[120px]">
                          {character.description || 'Cartoon Character'}
                          {character.is_ai_generated && (
                            <span className="ml-1 text-purple-400">✨</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Add to Scene Dropdown */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addCharacterToScene(character, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition text-xs"
                        defaultValue=""
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">Add to...</option>
                        {scenes.map((scene) => (
                          <option key={scene.id} value={scene.id}>
                            Scene {scene.scene_number}
                          </option>
                        ))}
                        {activeScene && (
                          <option value={activeScene.id}>
                            Current Scene ({activeScene.scene_number})
                          </option>
                        )}
                      </select>
                      
                      {/* Duplicate Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateCharacter(character);
                        }}
                        className="p-1.5 bg-gray-600 rounded hover:bg-gray-500 transition"
                        title="Duplicate Character"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCharacter(character.id);
                        }}
                        className="p-1.5 bg-red-600/50 rounded hover:bg-red-500 transition"
                        title="Delete Character"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {characters.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No characters yet</p>
                  {parsedStory && parsedStory.characters && parsedStory.characters.length > 0 ? (
                    <button
                      onClick={generateCharactersFromStory}
                      className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition text-sm font-medium"
                    >
                      Generate Characters from Story
                    </button>
                  ) : (
                    <p className="text-xs mt-1">Generate a story to create characters</p>
                  )}
                </div>
              )}

              {/* Generate Characters from Story Button */}
              {parsedStory && parsedStory.characters && parsedStory.characters.length > 0 && characters.length === 0 && (
                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">
                    Found {parsedStory.characters.length} characters in your story
                  </p>
                  <button
                    onClick={generateCharactersFromStory}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition text-sm font-medium"
                  >
                    Generate All Story Characters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Center Panel - Canvas */}
          <div className="col-span-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 h-full border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="font-bold">
                    {activeScene ? `Scene ${activeScene.scene_number} Editor` : 'No Scene Selected'}
                  </h3>
                  {activeScene && (
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                      {activeScene.scene_characters?.length || 0} characters
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={generateVoiceover}
                    className="p-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition border border-blue-700/30"
                    title="Generate Voiceover"
                  >
                    <Music className="h-5 w-5" />
                  </button>
                  <button 
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                    title="Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Animation Canvas */}
              <div className="relative bg-gray-900 border-2 border-gray-700 rounded-lg h-96 mb-4 overflow-hidden shadow-2xl animation-canvas">
                {activeScene ? (
                  <div className="h-full">
                    {/* Background */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                      style={{
                        backgroundImage: activeScene.background_image_url 
                          ? `url(${activeScene.background_image_url})`
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    >
                      <div className="absolute inset-0 bg-black/10" />
                    </div>

                    {/* Scene Number Overlay */}
                    <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-sm">
                      Scene {activeScene.scene_number}
                    </div>

                    {/* Draggable Characters */}
                    {activeScene.scene_characters?.map((sceneChar) => {
                      // Use local state position if available, otherwise use database position
                      const position = characterPositions[sceneChar.character_id] || {
                        x: sceneChar.position_x,
                        y: sceneChar.position_y
                      };

                      return (
                        <div
                          key={sceneChar.id}
                          className="absolute cursor-move transition-all duration-200 hover:scale-105 hover:z-10"
                          style={{
                            left: `${position.x}%`,
                            bottom: `${position.y}%`,
                            transform: `translate(-50%, 50%) scale(${sceneChar.scale})`,
                            opacity: isDragging === sceneChar.id ? 0.8 : 1
                          }}
                          draggable
                          onDragStart={() => handleCharacterDragStart(sceneChar.id)}
                          onDragEnd={(e) => handleCharacterDragEnd(e, sceneChar)}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <div className="relative group">
                            <div 
                              className="h-32 w-24 rounded-xl shadow-2xl border-2 border-white/20 group-hover:border-yellow-400 transition-all duration-200"
                              style={{
                                backgroundImage: sceneChar.characters.image_url 
                                  ? `url(${sceneChar.characters.image_url})`
                                  : 'linear-gradient(to bottom right, #f59e0b, #d97706)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            />
                            {/* Delete Button */}
                            <button
                              onClick={() => removeCharacterFromScene(sceneChar.id)}
                              className="absolute -top-2 -left-2 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-20"
                              title="Remove from scene"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 px-3 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                              {sceneChar.characters.name}
                            </div>
                            <div className="absolute -top-2 -right-2 bg-purple-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Move className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Character Button */}
                    <button
                      onClick={() => {
                        if (characters.length > 0) {
                          addCharacterToScene(characters[0]);
                        } else {
                          toast('Generate characters first');
                        }
                      }}
                      className="absolute bottom-6 right-6 p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:opacity-90 transition shadow-xl hover:scale-110 z-10"
                      title="Add Character"
                    >
                      <Plus className="h-6 w-6" />
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
                    <Film className="h-20 w-20 mb-4 opacity-30" />
                    <p className="text-lg mb-2">No scene selected</p>
                    <p className="text-sm text-center mb-6">Select or create a scene to start editing</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={generateScene}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition font-medium"
                      >
                        Generate Scene
                      </button>
                      {parsedStory && (
                        <button
                          onClick={() => autoCreateScenesFromParsedStory(parsedStory)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:opacity-90 transition font-medium"
                        >
                          Recreate All Scenes
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Scene Controls */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <label className="block text-sm text-gray-400 mb-2">Scene Description</label>
                  <textarea
                    value={sceneDescription}
                    onChange={(e) => setSceneDescription(e.target.value)}
                    onBlur={saveProject}
                    className="w-full h-24 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Describe what happens in this scene..."
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    {sceneDescription.length}/200 characters
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <label className="block text-sm text-gray-400 mb-2 flex items-center justify-between">
                    <span>Duration</span>
                    <Clock className="h-4 w-4" />
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={activeScene?.duration || 5}
                    onChange={(e) => {
                      if (activeScene) {
                        supabase
                          .from('scenes')
                          .update({ duration: parseInt(e.target.value) })
                          .eq('id', activeScene.id)
                          .then(({ error }) => {
                            if (error) console.error('Update duration error:', error);
                          });
                      }
                    }}
                    className="w-full"
                  />
                  <div className="text-center mt-3">
                    <span className="text-2xl font-bold">{activeScene?.duration || 5}</span>
                    <span className="text-gray-400 ml-1">seconds</span>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <label className="block text-sm text-gray-400 mb-2">Animation Effects</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="py-2 bg-gray-900 rounded-lg hover:bg-gray-800 transition flex items-center justify-center space-x-2"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Fade In</span>
                    </button>
                    <button 
                      className="py-2 bg-gray-900 rounded-lg hover:bg-gray-800 transition flex items-center justify-center space-x-2"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Zoom</span>
                    </button>
                    <button 
                      className="py-2 bg-gray-900 rounded-lg hover:bg-gray-800 transition flex items-center justify-center space-x-2"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Pan</span>
                    </button>
                    <button 
                      className="py-2 bg-gray-900 rounded-lg hover:bg-gray-800 transition flex items-center justify-center space-x-2"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Bounce</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Properties & Tools */}
          <div className="col-span-3 space-y-6">
            {/* AI Tools Panel */}
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-4 border border-purple-700/30">
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold">AI Tools</h3>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={generateStory}
                  disabled={generating}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Story</span>
                </button>
                
                <button 
                  onClick={generateScene}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:opacity-90 transition flex items-center justify-center space-x-2"
                >
                  <Image className="h-4 w-4" />
                  <span>Generate Scene</span>
                </button>
                
                <button 
                  onClick={generateCharacter}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:opacity-90 transition flex items-center justify-center space-x-2"
                >
                  <Smile className="h-4 w-4" />
                  <span>Generate Character</span>
                </button>
                
                <button 
                  onClick={generateVoiceover}
                  className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg hover:opacity-90 transition flex items-center justify-center space-x-2"
                >
                  <Volume2 className="h-4 w-4" />
                  <span>Generate Voiceover</span>
                </button>
              </div>
            </div>

            {/* Scene Properties */}
            <div className="bg-gray-800/90 rounded-xl p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Scene Properties</h3>
                <button
                  onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
                  className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                >
                  {showPropertiesPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
              
              {showPropertiesPanel && activeScene && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Background Image</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={activeScene.background_image_url || ''}
                        onChange={(e) => {
                          const url = e.target.value;
                          supabase
                            .from('scenes')
                            .update({ background_image_url: url })
                            .eq('id', activeScene.id)
                            .then(({ error }) => {
                              if (error) {
                                console.error('Update background error:', error);
                              } else {
                                fetchProjectData();
                              }
                            });
                        }}
                        placeholder="Enter image URL..."
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm"
                      />
                      <button 
                        className="px-3 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                        title="Upload"
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Characters in Scene</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {activeScene.scene_characters?.map((sceneChar) => {
                        const position = characterPositions[sceneChar.character_id] || {
                          x: sceneChar.position_x,
                          y: sceneChar.position_y
                        };
                        
                        return (
                          <div key={sceneChar.id} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="h-8 w-8 rounded-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${sceneChar.characters.image_url})` }}
                              />
                              <div>
                                <div className="font-medium text-sm">{sceneChar.characters.name}</div>
                                <div className="text-xs text-gray-400">
                                  X: {Math.round(position.x)}% Y: {Math.round(position.y)}%
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <button 
                                className="p-1 bg-gray-600 rounded hover:bg-gray-500"
                                title="Change Expression"
                              >
                                <Smile className="h-3 w-3" />
                              </button>
                              <button 
                                className="p-1 bg-red-600/50 rounded hover:bg-red-500"
                                onClick={() => removeCharacterFromScene(sceneChar.id)}
                                title="Remove from Scene"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition"
                    onClick={() => toast.success('AI enhancement coming soon!')}
                  >
                    Enhance with AI
                  </button>
                </div>
              )}
            </div>

            {/* Quick Tools */}
            <div className="bg-gray-800/90 rounded-xl p-4 border border-gray-700">
              <h3 className="font-bold mb-4">Quick Tools</h3>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition flex flex-col items-center"
                  title="Move Tool"
                >
                  <Move className="h-5 w-5 mb-1" />
                  <span className="text-xs">Move</span>
                </button>
                <button 
                  className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition flex flex-col items-center"
                  title="Text Tool"
                >
                  <Type className="h-5 w-5 mb-1" />
                  <span className="text-xs">Text</span>
                </button>
                <button 
                  onClick={generateVoiceover}
                  className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition flex flex-col items-center"
                  title="Audio Tool"
                >
                  <Volume2 className="h-5 w-5 mb-1" />
                  <span className="text-xs">Audio</span>
                </button>
                <button 
                  className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition flex flex-col items-center"
                  title="Effects"
                >
                  <Zap className="h-5 w-5 mb-1" />
                  <span className="text-xs">Effects</span>
                </button>
                <button 
                  className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition flex flex-col items-center"
                  onClick={saveProject}
                  title="Save"
                >
                  <Save className="h-5 w-5 mb-1" />
                  <span className="text-xs">Save</span>
                </button>
                <button 
                  className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition flex flex-col items-center"
                  onClick={exportAnimation}
                  title="Export"
                >
                  <Download className="h-5 w-5 mb-1" />
                  <span className="text-xs">Export</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800/90 rounded-xl p-4 border border-gray-700">
              <h3 className="font-bold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => router.push(`/play/${projectId}`)}
                  className="w-full py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition flex items-center justify-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Preview Animation</span>
                </button>
                <button 
                  onClick={() => {
                    if (parsedStory && confirm('This will replace all existing scenes. Continue?')) {
                      autoCreateScenesFromParsedStory(parsedStory);
                    }
                  }}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:opacity-90 transition flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Rebuild Scenes</span>
                </button>
                <button 
                  onClick={exportAnimation}
                  className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:opacity-90 transition flex items-center justify-center space-x-2"
                >
                  <Video className="h-4 w-4" />
                  <span>Export as Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal - FIXED: Proper type checking */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Video className="h-6 w-6" />
                  <span>Export Animation</span>
                </h2>
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setExportProgress({ status: 'idle', progress: 0 });
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {exportProgress.status === 'exporting' ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium mb-2">Exporting your animation...</h3>
                  <p className="text-gray-400 mb-4">This may take a minute depending on the length</p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{exportProgress.progress}% complete</p>
                </div>
              ) : exportProgress.status === 'completed' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Export Complete!</h3>
                  <p className="text-gray-400 mb-6">Your video is ready to download</p>
                  {exportProgress.downloadUrl && (
                    <a
                      href={exportProgress.downloadUrl}
                      download
                      className="block w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:opacity-90 transition font-medium"
                    >
                      Download Video
                    </a>
                  )}
                </div>
              ) : (
                <>
                  {/* Format Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Export Format</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setExportFormat('video')}
                        className={`py-3 rounded-lg transition flex flex-col items-center justify-center ${
                          exportFormat === 'video'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <Video className="h-6 w-6 mb-1" />
                        <span className="text-sm">Video (MP4)</span>
                      </button>
                      <button
                        onClick={() => setExportFormat('gif')}
                        className={`py-3 rounded-lg transition flex flex-col items-center justify-center ${
                          exportFormat === 'gif'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <Image className="h-6 w-6 mb-1" />
                        <span className="text-sm">Animated GIF</span>
                      </button>
                    </div>
                  </div>

                  {/* Resolution Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Resolution</label>
                    <select
                      value={exportResolution}
                      onChange={(e) => setExportResolution(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="480p">480p (SD)</option>
                      <option value="720p">720p (HD)</option>
                      <option value="1080p">1080p (Full HD)</option>
                    </select>
                  </div>

                  {/* Export Summary */}
                  <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <h3 className="font-medium mb-2">Export Summary</h3>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Project:</span>
                        <span>{project?.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Scenes:</span>
                        <span>{scenes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Duration:</span>
                        <span>{scenes.reduce((acc, scene) => acc + scene.duration, 0)} seconds</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Format:</span>
                        <span>{exportFormat === 'video' ? 'MP4 Video' : 'Animated GIF'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolution:</span>
                        <span>{exportResolution}</span>
                      </div>
                    </div>
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={exportVideo}
                    disabled={scenes.length === 0 || exportProgress.status === 'exporting'}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center font-medium"
                  >
                    <Video className="h-5 w-5 mr-2" />
                    Start Export
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audio Generation Modal */}
      {showAudioModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Volume2 className="h-6 w-6" />
                  <span>Generate Audio</span>
                </h2>
                <button
                  onClick={() => {
                    setShowAudioModal(false);
                    setGeneratedAudioUrl(null);
                    setAudioText('');
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Select Dialogue from Story or Scenes */}
              {(parsedStory?.scenes && parsedStory.scenes.length > 0 || scenes.length > 0) && (
                <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h3 className="font-semibold mb-3">Select Dialogue from Scenes</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {scenes.map((dbScene) => {
                      const parsedScene = parsedStory?.scenes?.find(s => s.sceneNumber === dbScene.scene_number);
                      const dialogue = parsedScene?.dialogue || 
                        (dbScene.description?.match(/Dialogue:\s*(.+)/i)?.[1] || '');
                      
                      return (
                        <button
                          key={dbScene.id}
                          onClick={() => selectDialogueFromScene(dbScene.scene_number - 1)}
                          className="w-full text-left p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-sm"
                        >
                          <div className="font-medium">Scene {dbScene.scene_number}: {parsedScene?.title || dbScene.description?.substring(0, 30) || 'Untitled'}</div>
                          {dialogue && (
                            <div className="text-gray-400 text-xs mt-1 truncate">
                              {dialogue.replace(/^["']|["']$/g, '').substring(0, 60)}...
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Text Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Text to Convert to Audio
                </label>
                <textarea
                  value={audioText}
                  onChange={(e) => setAudioText(e.target.value)}
                  placeholder="Enter text to generate audio, or select dialogue from story above..."
                  className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  maxLength={5000}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {audioText.length} / 5000 characters
                </div>
              </div>

              {/* Voice Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Voice</label>
                <select
                  value={audioVoice}
                  onChange={(e) => setAudioVoice(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Fritz-PlayAI">Fritz-PlayAI</option>
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateAudio}
                disabled={generatingAudio || !audioText.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center font-medium"
              >
                {generatingAudio ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Audio...
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Generate Audio
                  </>
                )}
              </button>

              {/* Generated Audio Player */}
              {generatedAudioUrl && (
                <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h3 className="font-semibold mb-3">Generated Audio</h3>
                  <audio
                    controls
                    src={generatedAudioUrl}
                    className="w-full mb-3"
                  />
                  
                  {/* Insert into Scene */}
                  {scenes.length > 0 && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-2">Insert into Scene</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            insertAudioIntoScene(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        defaultValue=""
                      >
                        <option value="">Select a scene...</option>
                        {scenes.map((scene) => (
                          <option key={scene.id} value={scene.id}>
                            Scene {scene.scene_number}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <a
                      href={generatedAudioUrl}
                      download="generated-audio.wav"
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-center transition"
                    >
                      Download Audio
                    </a>
                    <button
                      onClick={() => {
                        const audio = new Audio(generatedAudioUrl);
                        audio.play();
                      }}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
                    >
                      Play Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Character Generation Modal */}
      {showCharacterModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Smile className="h-6 w-6" />
                  <span>Create Character with AI</span>
                </h2>
                <button
                  onClick={() => {
                    setShowCharacterModal(false);
                    setCharacterName('');
                    setCharacterDescription('');
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Character Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Character Name *
                </label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="e.g., Benny the Bear"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  maxLength={50}
                />
              </div>

              {/* Character Description Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Character Description *
                </label>
                <textarea
                  value={characterDescription}
                  onChange={(e) => setCharacterDescription(e.target.value)}
                  placeholder={`Describe the character in detail for AI generation:
                  
Example: "A friendly brown bear with a red scarf, loves honey, brave and adventurous"
                  
Include:
• Appearance (species, colors, clothing)
• Personality traits
• Age or size
• Special features or accessories"`}
                  className="w-full h-48 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  maxLength={1000}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {characterDescription.length} / 1000 characters
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 The more detailed your description, the better the AI can generate your character!
                </p>
              </div>

              {/* Create Button */}
              <button
                onClick={createCharacterWithAI}
                disabled={generatingCharacter || !characterName.trim() || !characterDescription.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center font-medium"
              >
                {generatingCharacter ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Character...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Character with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}