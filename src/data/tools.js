export const categories = [
  { id: 'image', label: 'Image', color: '#E8734A', icon: '🖼️' },
  { id: 'texte', label: 'Texte', color: '#4A7BA8', icon: '📝' },
  { id: 'video', label: 'Vidéo', color: '#3D9A6B', icon: '🎬' },
  { id: 'audio', label: 'Audio', color: '#C458A8', icon: '🎵' },
  { id: 'code', label: 'Code', color: '#5B8FBF', icon: '💻' },
  { id: 'data', label: 'Data', color: '#4BAF7A', icon: '📊' },
];

export const recommendedTools = [
  {
    id: 1,
    name: 'ChatGPT',
    description: 'Assistant conversationnel polyvalent',
    rating: 4.8,
    avatar: 'C',
    avatarColor: '#5B8FBF',
    tags: [
      { label: 'Texte', color: '#5B8FBF' },
      { label: 'Freemium', color: '#C9A84C' }
    ],
    isTrending: true
  },
  {
    id: 2,
    name: 'Midjourney',
    description: "Génération d'images haute qualité",
    rating: 4.6,
    avatar: 'M',
    avatarColor: '#D4865E',
    tags: [
      { label: 'Image', color: '#D4865E' },
      { label: 'Payant', color: '#888' }
    ],
    isNew: true
  },
  {
    id: 3,
    name: 'Claude 3',
    description: 'Analyse et rédaction avancée',
    rating: 4.9,
    avatar: 'C',
    avatarColor: '#D4B85E',
    tags: [
      { label: 'Texte', color: '#D4B85E' },
      { label: 'Freemium', color: '#C9A84C' }
    ],
    isTrending: true
  },
  {
    id: 4,
    name: 'Synthesia',
    description: 'Création de vidéos avec avatars IA',
    rating: 4.5,
    avatar: 'S',
    avatarColor: '#71A07A',
    tags: [
      { label: 'Vidéo', color: '#71A07A' },
      { label: 'Payant', color: '#888' }
    ]
  },
  {
    id: 5,
    name: 'ElevenLabs',
    description: 'Génération de voix ultra-réalistes',
    rating: 4.7,
    avatar: 'E',
    avatarColor: '#A071A0',
    tags: [
      { label: 'Audio', color: '#A071A0' },
      { label: 'Freemium', color: '#C9A84C' }
    ],
    isNew: true
  },
  {
    id: 6,
    name: 'GitHub Copilot',
    description: 'Assistant de programmation IA',
    rating: 4.8,
    avatar: 'G',
    avatarColor: '#65A3C7',
    tags: [
      { label: 'Code', color: '#65A3C7' },
      { label: 'Payant', color: '#888' }
    ],
    isTrending: true
  }
];

export const suggestionPills = [
  'Générer une image',
  'Résumer un texte',
  'Écrire du code',
  'Créer une vidéo',
];
