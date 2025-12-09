export interface Character {
  id: string;
  name: string;
  description?: string;
  character_type: string;
  image_url?: string;
  project_id: string;
  created_at?: string;
  is_ai_generated?: boolean;
}

export interface SceneCharacter {
  id: string;
  position_x: number;
  position_y: number;
  scale: number;
  expression: string;
  characters: Character;
  character_id: string;
}

export interface Scene {
  id: string;
  scene_number: number;
  description?: string;
  background_image_url?: string;
  audio_url?: string;
  duration: number;
  animations: any[];
  scene_characters: SceneCharacter[];
}

export interface Project {
  id: string;
  title: string;
  story_text?: string;
  updated_at: string;
}

export interface StoryOptions {
  genre: string;
  ageGroup: string;
  length: 'short' | 'medium' | 'long';
}

export interface ExportProgress {
  status: 'idle' | 'exporting' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
}