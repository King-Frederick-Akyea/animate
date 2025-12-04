'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Play, Pause, SkipBack, SkipForward, Volume2, Home, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  
  const [project, setProject] = useState<any>(null);
  const [scenes, setScenes] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  useEffect(() => {
    if (isPlaying) {
      startProgress();
    } else {
      stopProgress();
    }

    return () => {
      stopProgress();
    };
  }, [isPlaying, currentSceneIndex]);

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
        setDuration(scenesData[0].duration || 5);
      }

      // Fetch all characters
      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId);

      if (charactersError) throw charactersError;
      setCharacters(charactersData || []);
    } catch (error: any) {
      toast.error('Failed to load animation');
    }
  };

  const startProgress = () => {
    stopProgress();
    const sceneDuration = scenes[currentSceneIndex]?.duration || 5;
    
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 100 / (sceneDuration * 10); // 10 updates per second
        
        if (newProgress >= 100) {
          nextScene();
          return 0;
        }
        
        return newProgress;
      });
    }, 100);
  };

  const stopProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextScene = () => {
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
      setProgress(0);
    } else {
      setIsPlaying(false);
      setCurrentSceneIndex(0);
      setProgress(0);
    }
  };

  const prevScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
      setProgress(0);
    }
  };

  const handleExport = async () => {
    toast.loading('Preparing download...');
    try {
      // For now, we'll create a mock video file
      // In production, this would generate an actual video
      const { error } = await supabase
        .from('animation_exports')
        .insert([
          {
            project_id: projectId,
            status: 'completed',
            video_url: `https://example.com/export-${projectId}.mp4`,
          },
        ]);

      if (error) throw error;

      // Create a download link
      const blob = new Blob(['Mock video file'], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.title || 'animation'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('Animation exported!');
    } catch (error: any) {
      toast.dismiss();
      toast.error('Export failed');
    }
  };

  const currentScene = scenes[currentSceneIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
            >
              <Home className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold">{project?.title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              <Download className="h-4 w-4" />
              <span>Export MP4</span>
            </button>
            <button
              onClick={() => router.push(`/editor/${projectId}`)}
              className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
            >
              Edit Animation
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Animation Canvas */}
        <div className="relative bg-gray-800 rounded-2xl overflow-hidden mb-8" style={{ height: '70vh' }}>
          {currentScene ? (
            <>
              {/* Background */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: currentScene.background_image_url 
                    ? `url(${currentScene.background_image_url})`
                    : 'linear-gradient(to right, #4f46e5, #7c3aed)'
                }}
              >
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* Characters */}
              {currentScene.scene_characters?.map((sceneChar: any) => (
                <div
                  key={sceneChar.id}
                  className="absolute transition-all duration-500"
                  style={{
                    left: `${sceneChar.position_x}%`,
                    bottom: `${sceneChar.position_y}%`,
                    transform: `scale(${sceneChar.scale}) translate(-50%, 50%)`,
                  }}
                >
                  <div className="relative">
                    {/* Character avatar */}
                    <div className="h-40 w-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl shadow-2xl" />
                    {/* Character name */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 px-3 py-1 rounded-lg whitespace-nowrap">
                      <span className="font-bold">{sceneChar.characters?.name}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Scene Description */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-xl max-w-2xl w-full">
                <p className="text-center text-lg">
                  Scene {currentScene.scene_number}: {currentScene.description || 'No description'}
                </p>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl mb-4">No scenes available</p>
                <button
                  onClick={() => router.push(`/editor/${projectId}`)}
                  className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
                >
                  Create Scenes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Scene {currentSceneIndex + 1} of {scenes.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center items-center space-x-8">
            <button
              onClick={prevScene}
              disabled={currentSceneIndex === 0}
              className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipBack className="h-6 w-6" />
            </button>

            <button
              onClick={togglePlay}
              className="p-6 bg-purple-600 rounded-full hover:bg-purple-700 transition"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8" />
              )}
            </button>

            <button
              onClick={nextScene}
              disabled={currentSceneIndex === scenes.length - 1}
              className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipForward className="h-6 w-6" />
            </button>

            <button className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 transition">
              <Volume2 className="h-6 w-6" />
            </button>
          </div>

          {/* Scene Thumbnails */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4">Scenes</h3>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {scenes.map((scene, index) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    setCurrentSceneIndex(index);
                    setProgress(0);
                    setIsPlaying(false);
                  }}
                  className={`flex-shrink-0 w-48 h-32 rounded-xl overflow-hidden relative transition-all ${
                    currentSceneIndex === index 
                      ? 'ring-4 ring-purple-500 scale-105' 
                      : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{
                      backgroundImage: scene.background_image_url 
                        ? `url(${scene.background_image_url})`
                        : 'linear-gradient(to right, #4f46e5, #7c3aed)'
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                    <p className="text-sm font-medium">Scene {scene.scene_number}</p>
                    <p className="text-xs truncate">{scene.description || 'No description'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}