export interface ParsedStory {
  title: string;
  summary: string;
  genre: string;
  ageGroup: string;
  characters: Array<{
    name: string;
    description: string;
  }>;
  scenes: Array<{
    sceneNumber: number;
    title: string;
    location: string;
    characters: string[];
    action: string;
    dialogue: string;
  }>;
  moral: string;
  ending: string;
}

export function parseStoryText(storyText: string): ParsedStory {
  const lines = storyText.split('\n');
  
  const parsed: ParsedStory = {
    title: '',
    summary: '',
    genre: '',
    ageGroup: '',
    characters: [],
    scenes: [],
    moral: '',
    ending: ''
  };

  let currentSection = '';
  let currentScene: any = null;
  let inScene = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '=== STORY START ===' || line === '=== STORY END ===') {
      continue;
    }
    
    if (line.startsWith('TITLE:')) {
      parsed.title = line.replace('TITLE:', '').trim();
    } else if (line.startsWith('GENRE:')) {
      parsed.genre = line.replace('GENRE:', '').trim();
    } else if (line.startsWith('AGE GROUP:')) {
      parsed.ageGroup = line.replace('AGE GROUP:', '').trim();
    } else if (line.startsWith('SUMMARY:')) {
      parsed.summary = line.replace('SUMMARY:', '').trim();
      // Get multi-line summary
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith('CHARACTERS:') && 
             !lines[j].trim().startsWith('SCENE')) {
        if (lines[j].trim()) {
          parsed.summary += ' ' + lines[j].trim();
        }
        j++;
      }
      i = j - 1;
    } else if (line.startsWith('CHARACTERS:')) {
      currentSection = 'characters';
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith('SCENE')) {
        const charLine = lines[j].trim();
        if (charLine.startsWith('•')) {
          const parts = charLine.replace('•', '').split('-');
          if (parts.length >= 2) {
            parsed.characters.push({
              name: parts[0].trim(),
              description: parts[1].trim()
            });
          }
        }
        j++;
      }
      i = j - 1;
    } else if (line.match(/^SCENE \d+:/)) {
      // If we have a previous scene, save it first
      if (currentScene) {
        parsed.scenes.push(currentScene);
        currentScene = null;
      }
      inScene = true;
      const match = line.match(/^SCENE (\d+):\s*(.*)/);
      if (match) {
        currentScene = {
          sceneNumber: parseInt(match[1]),
          title: match[2] || '',
          location: '',
          characters: [],
          action: '',
          dialogue: ''
        };
      }
    } else if (inScene) {
      if (line.startsWith('LOCATION:')) {
        currentScene.location = line.replace('LOCATION:', '').trim();
      } else if (line.startsWith('CHARACTERS:')) {
        const chars = line.replace('CHARACTERS:', '').trim();
        currentScene.characters = chars.split(',').map(c => c.trim()).filter(c => c.length > 0);
      } else if (line.startsWith('ACTION:')) {
        currentScene.action = line.replace('ACTION:', '').trim();
        // Handle multi-line action
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().startsWith('DIALOGUE:') && 
               !lines[j].trim().startsWith('SCENE') && lines[j].trim() !== '' &&
               !lines[j].trim().startsWith('MORAL:') && !lines[j].trim().startsWith('STORY ENDING:')) {
          if (lines[j].trim()) {
            currentScene.action += ' ' + lines[j].trim();
          }
          j++;
        }
        i = j - 1;
      } else if (line.startsWith('DIALOGUE:')) {
        currentScene.dialogue = line.replace('DIALOGUE:', '').trim();
        // Handle multi-line dialogue
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().startsWith('SCENE') && 
               !lines[j].trim().startsWith('ACTION:') && !lines[j].trim().startsWith('LOCATION:') &&
               !lines[j].trim().startsWith('CHARACTERS:') && lines[j].trim() !== '' &&
               !lines[j].trim().startsWith('MORAL:') && !lines[j].trim().startsWith('STORY ENDING:')) {
          if (lines[j].trim()) {
            currentScene.dialogue += ' ' + lines[j].trim();
          }
          j++;
        }
        i = j - 1;
      } else if (line === '') {
        // End of scene (empty line)
        if (currentScene && currentScene.location && currentScene.action) {
          parsed.scenes.push(currentScene);
          currentScene = null;
          inScene = false;
        }
      }
    } else if (line.startsWith('MORAL:')) {
      parsed.moral = line.replace('MORAL:', '').trim();
    } else if (line.startsWith('STORY ENDING:')) {
      parsed.ending = line.replace('STORY ENDING:', '').trim();
    }
  }

  // Add the last scene if exists
  if (currentScene) {
    parsed.scenes.push(currentScene);
  }

  return parsed;
}

// Simple fallback parser for non-structured stories
export function parseSimpleStory(storyText: string): ParsedStory {
  const lines = storyText.split('\n').filter(line => line.trim());
  
  const parsed: ParsedStory = {
    title: lines[0] || 'Untitled Story',
    summary: lines.slice(1, 3).join(' ') || 'A wonderful story',
    genre: 'fantasy',
    ageGroup: 'children',
    characters: [
      { name: 'Main Character', description: 'The hero of the story' },
      { name: 'Friend', description: 'A helpful companion' }
    ],
    scenes: [],
    moral: 'Always be kind and brave',
    ending: 'And they lived happily ever after.'
  };

  // Try to extract scenes from the text
  let sceneCount = 0;
  let currentContent = '';
  
  for (let i = 2; i < lines.length; i++) {
    if (lines[i].match(/^Scene \d+:/i) || 
        lines[i].match(/^Chapter \d+:/i) || 
        lines[i].match(/^Part \d+:/i)) {
      // Save previous scene
      if (currentContent && sceneCount < 5) {
        parsed.scenes.push({
          sceneNumber: sceneCount + 1,
          title: `Scene ${sceneCount + 1}`,
          location: 'A magical place',
          characters: ['Main Character', 'Friend'],
          action: currentContent.substring(0, 100) + '...',
          dialogue: ''
        });
        sceneCount++;
        currentContent = '';
      }
    } else {
      currentContent += lines[i] + ' ';
    }
  }

  // Add remaining content as last scene
  if (currentContent && sceneCount < 5) {
    parsed.scenes.push({
      sceneNumber: sceneCount + 1,
      title: `Scene ${sceneCount + 1}`,
      location: 'A magical place',
      characters: ['Main Character', 'Friend'],
      action: currentContent.substring(0, 100) + '...',
      dialogue: ''
    });
  }

  // If no scenes were found, create default ones
  if (parsed.scenes.length === 0) {
    parsed.scenes = [
      {
        sceneNumber: 1,
        title: 'The Beginning',
        location: 'A magical forest',
        characters: ['Main Character'],
        action: 'The adventure begins in a colorful forest',
        dialogue: '"What an amazing day for an adventure!"'
      },
      {
        sceneNumber: 2,
        title: 'The Challenge',
        location: 'A mysterious cave',
        characters: ['Main Character', 'Friend'],
        action: 'They face their first challenge together',
        dialogue: '"We can do this if we work together!"'
      }
    ];
  }

  return parsed;
}