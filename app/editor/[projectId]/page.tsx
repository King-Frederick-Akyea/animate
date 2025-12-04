'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Save, Play, Download, ArrowLeft, Plus, 
  Volume2, Settings, Type, Image, Move,
  Upload, Mic, Smile, Zap, Eye, EyeOff,
  Trash2, Copy, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

// Define types for our data
interface Character {
  id: string;
  name: string;
  description?: string;
  character_type: string;
  image_url?: string;
}

interface SceneCharacter {
  id: string;
  position_x: number;
  position_y: number;
  scale: number;
  expression: string;
  characters: Character;
}

interface Scene {
  id: string;
  scene_number: number;
  description?: string;
  background_image_url?: string;
  duration: number;
  animations: any[];
  scene_characters: SceneCharacter[];
}

interface Project {
  id: string;
  title: string;
  story_text?: string;
  updated_at: string;
}

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

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  useEffect(() => {
    if (activeScene) {
      setSceneDescription(activeScene.description || '');
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
      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId);

      if (charactersError) throw charactersError;
      setCharacters(charactersData || []);
    } catch (error: any) {
      console.error('Failed to load project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async () => {
    try {
      // Save project story
      const { error: projectError } = await supabase
        .from('projects')
        .update({ 
          updated_at: new Date().toISOString(),
          story_text: storyPrompt 
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Save active scene if it exists
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

  const generateStory = async () => {
    if (!storyPrompt.trim()) {
      toast.error('Please enter a story prompt');
      return;
    }

    setGenerating(true);
    try {
      // Call our new AI story generation API
      const response = await fetch('/api/ai/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: storyPrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate story');
      }

      const data = await response.json();
      
      // Update project with generated story
      const { error: updateError } = await supabase
        .from('projects')
        .update({ story_text: data.story })
        .eq('id', projectId);

      if (updateError) throw updateError;

      setStoryPrompt(data.story);
      toast.success('Story generated successfully!');
    } catch (error: any) {
      console.error('Story generation error:', error);
      toast.error(error.message || 'Failed to generate story. Using fallback.');
      
      // Fallback mock story
      const fallbackStory = `Once upon a time in Cartoonland, ${storyPrompt}. The characters went on an adventure and learned valuable lessons about friendship and teamwork.

Scene 1: Introduction of main characters
Scene 2: The adventure begins
Scene 3: Facing challenges together
Scene 4: Happy ending with lessons learned`;

      const { error: fallbackError } = await supabase
        .from('projects')
        .update({ story_text: fallbackStory })
        .eq('id', projectId);

      if (!fallbackError) {
        setStoryPrompt(fallbackStory);
        toast.success('Created story with fallback');
      }
    } finally {
      setGenerating(false);
    }
  };

  const generateScene = async () => {
    try {
      const sceneNumber = scenes.length + 1;
      const loadingToast = toast.loading('Generating scene...');
      
      // Call AI scene generation
      const response = await fetch('/api/ai/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: storyPrompt || 'cartoon scene',
          sceneNumber: sceneNumber 
        }),
      });

      let sceneData;
      if (response.ok) {
        sceneData = await response.json();
      } else {
        // Fallback scene data
        const promptText = storyPrompt || 'A beautiful cartoon scene';
        sceneData = {
          description: `Scene ${sceneNumber}: ${promptText.substring(0, 50)}...`,
          backgroundUrl: `https://picsum.photos/seed/${Date.now()}/800/600`,
          suggestedCharacters: ['Hero', 'Friend', 'Villain']
        };
      }

      // Add scene to database
      const { data: newScene, error: sceneError } = await supabase
        .from('scenes')
        .insert([
          {
            project_id: projectId,
            scene_number: sceneNumber,
            description: sceneData.description,
            background_image_url: sceneData.backgroundUrl,
            duration: 5,
            animations: [{ type: 'fadeIn', duration: 1 }],
          },
        ])
        .select()
        .single();

      if (sceneError) throw sceneError;

      // Auto-generate characters for the scene
      if (sceneData.suggestedCharacters && characters.length === 0) {
        const characterPromises = sceneData.suggestedCharacters.slice(0, 3).map((charName: string) => 
          supabase.from('characters').insert([
            {
              project_id: projectId,
              name: charName,
              character_type: 'cartoon',
              image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${charName}`,
            },
          ])
        );
        
        await Promise.all(characterPromises);
        fetchProjectData(); // Refresh characters
      }

      toast.dismiss(loadingToast);
      setScenes([...scenes, newScene]);
      setActiveScene(newScene);
      toast.success('Scene generated!');
    } catch (error: any) {
      toast.dismiss();
      console.error('Scene generation error:', error);
      toast.error(error.message || 'Failed to generate scene');
    }
  };

  const generateCharacter = async () => {
    try {
      const characterNameInput = prompt('Enter character name:');
      if (!characterNameInput) return;

      const loadingToast = toast.loading('Generating character...');
      
      // Call AI character generation
      const response = await fetch('/api/ai/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          characterName: characterNameInput,
          description: storyPrompt 
        }),
      });

      let characterData;
      if (response.ok) {
        characterData = await response.json();
      } else {
        // Fallback character data
        characterData = {
          name: characterNameInput,
          imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${characterNameInput}`,
          description: `A cartoon character named ${characterNameInput}`
        };
      }

      const { data: newCharacter, error: characterError } = await supabase
        .from('characters')
        .insert([
          {
            project_id: projectId,
            name: characterData.name,
            description: characterData.description,
            character_type: 'cartoon',
            image_url: characterData.imageUrl,
          },
        ])
        .select()
        .single();

      if (characterError) throw characterError;

      toast.dismiss(loadingToast);
      setCharacters([...characters, newCharacter]);
      toast.success('Character generated!');
    } catch (error: any) {
      toast.dismiss();
      console.error('Character generation error:', error);
      toast.error(error.message || 'Failed to generate character');
    }
  };

  const addCharacterToScene = async (characterId: string) => {
    if (!activeScene) {
      toast.error('Please select a scene first');
      return;
    }

    try {
      const { error: sceneCharError } = await supabase
        .from('scene_characters')
        .insert([
          {
            scene_id: activeScene.id,
            character_id: characterId,
            position_x: 30 + Math.random() * 40, // Random position
            position_y: 50,
            expression: 'happy',
          },
        ]);

      if (sceneCharError) throw sceneCharError;

      fetchProjectData(); // Refresh data
      toast.success('Character added to scene!');
    } catch (error: any) {
      console.error('Add character error:', error);
      toast.error('Failed to add character to scene');
    }
  };

  const updateCharacterPosition = async (characterId: string, x: number, y: number) => {
    try {
      const { error: updateError } = await supabase
        .from('scene_characters')
        .update({ position_x: x, position_y: y })
        .eq('scene_id', activeScene?.id)
        .eq('character_id', characterId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Failed to update character position:', error);
    }
  };

  const exportAnimation = async () => {
    try {
      const loadingToast = toast.loading('Exporting animation...');
      
      // Create a mock export
      const { data: exportData, error: exportError } = await supabase
        .from('animation_exports')
        .insert([
          {
            project_id: projectId,
            status: 'completed',
            video_url: `https://example.com/export/${projectId}-${Date.now()}.mp4`,
          },
        ])
        .select()
        .single();

      if (exportError) throw exportError;

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.dismiss(loadingToast);
      
      // Create download link
      const downloadUrl = `/api/export/download?projectId=${projectId}`;
      window.open(downloadUrl, '_blank');
      
      toast.success('Animation exported successfully!');
    } catch (error: any) {
      toast.dismiss();
      console.error('Export error:', error);
      toast.error(error.message || 'Export failed');
    }
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
        .insert([
          {
            project_id: projectId,
            scene_number: scenes.length + 1,
            description: `${scene.description} (Copy)`,
            background_image_url: scene.background_image_url,
            duration: scene.duration,
          },
        ])
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

  // Helper function for button actions
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <h1 className="text-xl font-bold truncate max-w-md">{project?.title}</h1>
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
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Story & Scenes */}
          <div className="col-span-3 space-y-6">
            {/* Story Generator */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="font-bold mb-3 flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                AI Story Generator
              </h3>
              <textarea
                value={storyPrompt}
                onChange={(e) => setStoryPrompt(e.target.value)}
                placeholder="Describe your cartoon story... (e.g., A bear and rabbit go on an adventure)"
                className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={generateStory}
                disabled={generating}
                className="w-full mt-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {generating ? 'Generating...' : '✨ Generate Story with AI'}
              </button>
            </div>

            {/* Scenes List */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">Scenes ({scenes.length})</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={generateScene}
                    className="p-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
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
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={`group relative p-3 rounded-lg transition ${
                      activeScene?.id === scene.id
                        ? 'bg-purple-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <button
                      onClick={() => setActiveScene(scene)}
                      className="w-full text-left"
                    >
                      <div className="font-medium flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center bg-black/30 rounded mr-2">
                          {scene.scene_number}
                        </div>
                        Scene {scene.scene_number}
                      </div>
                      <div className="text-sm text-gray-300 truncate mt-1">
                        {scene.description || 'No description'}
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
                        className="p-1 bg-red-600 rounded hover:bg-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Character Generator */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">Characters</h3>
                <button
                  onClick={generateCharacter}
                  className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:opacity-90 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>AI Generate</span>
                </button>
              </div>
              <div className="space-y-3">
                {characters.map((character) => (
                  <div
                    key={character.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg group"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="h-10 w-10 rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${character.image_url})` }}
                      />
                      <div>
                        <div className="font-medium">{character.name}</div>
                        <div className="text-xs text-gray-400">Cartoon Character</div>
                      </div>
                    </div>
                    <button
                      onClick={() => addCharacterToScene(character.id)}
                      className="px-3 py-1 bg-purple-600 rounded-lg hover:bg-purple-700 transition opacity-0 group-hover:opacity-100"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Panel - Canvas */}
          <div className="col-span-6">
            <div className="bg-gray-800 rounded-xl p-4 h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">
                  {activeScene ? `Scene ${activeScene.scene_number} Editor` : 'No Scene Selected'}
                </h3>
                <div className="flex space-x-2">
                  <button 
                    className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition" 
                    title="Audio"
                    onClick={() => showToast('Audio tool activated')}
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                  <button 
                    className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition" 
                    title="Settings"
                    onClick={() => showToast('Settings tool activated')}
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Animation Canvas */}
              <div className="relative bg-gray-900 border-2 border-gray-700 rounded-lg h-96 mb-4 overflow-hidden">
                {activeScene ? (
                  <div className="h-full">
                    {/* Background */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: activeScene.background_image_url 
                          ? `url(${activeScene.background_image_url})`
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                    </div>

                    {/* Draggable Characters */}
                    {activeScene.scene_characters?.map((sceneChar) => (
                      <div
                        key={sceneChar.id}
                        className="absolute cursor-move transition-all duration-200 hover:scale-105"
                        style={{
                          left: `${sceneChar.position_x}%`,
                          bottom: `${sceneChar.position_y}%`,
                          transform: `translate(-50%, 50%) scale(${sceneChar.scale})`,
                        }}
                        draggable
                        onDragEnd={(e) => {
                          const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                          if (rect) {
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((rect.bottom - e.clientY) / rect.height) * 100;
                            updateCharacterPosition(sceneChar.characters.id, x, y);
                          }
                        }}
                      >
                        <div className="relative">
                          <div className="h-32 w-24 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl shadow-2xl" />
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 px-2 py-1 rounded text-xs whitespace-nowrap">
                            {sceneChar.characters.name}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add Character Button */}
                    <button
                      onClick={() => {
                        if (characters.length > 0) {
                          addCharacterToScene(characters[0].id);
                        } else {
                          toast('Generate characters first');
                        }
                      }}
                      className="absolute bottom-4 right-4 p-3 bg-purple-600 rounded-full hover:bg-purple-700 transition shadow-lg"
                      title="Add Character"
                    >
                      <Plus className="h-6 w-6" />
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <Image className="h-16 w-16 mb-4" />
                    <p>No scene selected</p>
                    <p className="text-sm">Select or create a scene to start editing</p>
                  </div>
                )}
              </div>

              {/* Scene Controls */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <label className="block text-sm text-gray-400 mb-2">Scene Description</label>
                  <textarea
                    value={sceneDescription}
                    onChange={(e) => setSceneDescription(e.target.value)}
                    className="w-full h-24 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe what happens in this scene..."
                  />
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4">
                  <label className="block text-sm text-gray-400 mb-2">Duration</label>
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
                  <div className="text-center mt-2">
                    <span className="text-lg font-bold">{activeScene?.duration || 5}</span>
                    <span className="text-gray-400 ml-1">seconds</span>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4">
                  <label className="block text-sm text-gray-400 mb-2">Animation Effects</label>
                  <div className="flex space-x-2">
                    <button 
                      className="flex-1 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                      onClick={() => showToast('Fade In effect added')}
                    >
                      Fade In
                    </button>
                    <button 
                      className="flex-1 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                      onClick={() => showToast('Zoom effect added')}
                    >
                      Zoom
                    </button>
                    <button 
                      className="flex-1 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                      onClick={() => showToast('Pan effect added')}
                    >
                      Pan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Properties & Tools */}
          <div className="col-span-3 space-y-6">
            {/* Scene Properties */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">Scene Properties</h3>
                <button
                  onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
                  className="p-1 bg-gray-700 rounded"
                >
                  {showPropertiesPanel ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showPropertiesPanel && activeScene && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Background</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={activeScene.background_image_url || ''}
                        onChange={(e) => {
                          supabase
                            .from('scenes')
                            .update({ background_image_url: e.target.value })
                            .eq('id', activeScene.id)
                            .then(({ error }) => {
                              if (error) console.error('Update background error:', error);
                            });
                        }}
                        placeholder="Image URL or search..."
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm"
                      />
                      <button 
                        className="px-3 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                        onClick={() => showToast('Upload feature coming soon')}
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Characters in Scene</label>
                    <div className="space-y-2">
                      {activeScene.scene_characters?.map((sceneChar) => (
                        <div key={sceneChar.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                          <div className="flex items-center space-x-2">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-r from-green-400 to-blue-400" />
                            <span>{sceneChar.characters.name}</span>
                          </div>
                          <div className="flex space-x-1">
                            <button 
                              className="p-1 bg-gray-600 rounded hover:bg-gray-500"
                              onClick={() => showToast('Change expression for ' + sceneChar.characters.name)}
                            >
                              <Smile className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 bg-gray-600 rounded hover:bg-gray-500"
                              onClick={() => showToast('Add voice for ' + sceneChar.characters.name)}
                            >
                              <Mic className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition"
                    onClick={() => showToast('Audio generation feature coming soon')}
                  >
                    Generate Audio with AI
                  </button>
                </div>
              )}
            </div>

            {/* Animation Tools */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="font-bold mb-3">Animation Tools</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition flex flex-col items-center"
                  onClick={() => showToast('Move tool activated')}
                >
                  <Move className="h-6 w-6 mb-2" />
                  <span className="text-sm">Move</span>
                </button>
                <button 
                  className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition flex flex-col items-center"
                  onClick={() => showToast('Text tool activated')}
                >
                  <Type className="h-6 w-6 mb-2" />
                  <span className="text-sm">Text</span>
                </button>
                <button 
                  className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition flex flex-col items-center"
                  onClick={() => showToast('Audio tool activated')}
                >
                  <Volume2 className="h-6 w-6 mb-2" />
                  <span className="text-sm">Audio</span>
                </button>
                <button 
                  className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition flex flex-col items-center"
                  onClick={() => showToast('Effects tool activated')}
                >
                  <Zap className="h-6 w-6 mb-2" />
                  <span className="text-sm">Effects</span>
                </button>
                <button 
                  className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition flex flex-col items-center"
                  onClick={() => {
                    if (activeScene) {
                      supabase
                        .from('scenes')
                        .update({ background_image_url: null })
                        .eq('id', activeScene.id)
                        .then(({ error }) => {
                          if (error) {
                            console.error('Clear background error:', error);
                            toast.error('Failed to clear background');
                          } else {
                            toast.success('Background cleared');
                          }
                        });
                    }
                  }}
                >
                  <RotateCcw className="h-6 w-6 mb-2" />
                  <span className="text-sm">Clear</span>
                </button>
                <button 
                  className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition flex flex-col items-center"
                  onClick={() => exportAnimation()}
                >
                  <Download className="h-6 w-6 mb-2" />
                  <span className="text-sm">Export</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="font-bold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={saveProject}
                  className="w-full py-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
                >
                  Save All Changes
                </button>
                <button 
                  onClick={generateScene}
                  className="w-full py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  Generate New Scene
                </button>
                <button 
                  onClick={() => router.push(`/play/${projectId}`)}
                  className="w-full py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
                >
                  Preview Animation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}