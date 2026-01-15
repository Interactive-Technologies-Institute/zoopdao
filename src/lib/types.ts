import type { Database } from './supabase-types.gen';

export type Game = Database['public']['Tables']['games']['Row'];

export type GameId = Game['id'];

export type GameLobbyStateEnum = 'waiting' | 'ready';

export type GameStateEnum = 'starting' | 'playing' | 'finished';

export type CardId = Database['public']['Tables']['cards']['Row']['id'];

export type CardType = Database['public']['Enums']['stop_type'];

export type CharacterCategory = 'human' | 'non-human';

export type Card = {
	id: number;
	type: CardType;
	title: string | null;
	hero_steps: number[];
	character_category: CharacterCategory[];
};

export type CardPrompt = {
	id: number;
	card_id: number;
	lang: 'en' | 'pt';
	text: string;
};

export type Round = Database['public']['Tables']['rounds']['Row'];

export type Character = Database['public']['Enums']['character_type'];

// Roles for ZoopDAO (replacing characters)
export type Role = 'administration' | 'research' | 'reception' | 'operations' | 'bar' | 'cleaning';

export const ROLES: Role[] = [
	'administration',
	'research',
	'reception',
	'operations',
	'bar',
	'cleaning'
];

// Keep CHARACTER_CATEGORIES for backward compatibility, but only use human roles
export const CHARACTER_CATEGORIES: Record<CharacterCategory, Character[]> = {
	human: ROLES as unknown as Character[],
	'non-human': []
};

export type Landmark = {
	id: number;
	name: string;
	description: { en: string; pt: string };
	image_url: string;
};

export const CHARACTER_OPTIONS: Character[] = [
	...CHARACTER_CATEGORIES['human'],
	...CHARACTER_CATEGORIES['non-human']
];

export function getCharacterCategory(character: Character): CharacterCategory {
	if (CHARACTER_CATEGORIES.human.includes(character)) {
		return 'human';
	}
	return 'non-human';
}

export type CharacterCard = {
	type: Character;
	title: string;
	description: string;
	secondary?: string;
};

export type PlayerId = Database['public']['Tables']['players']['Row']['id'];

export type Player = Database['public']['Tables']['players']['Row'];

export type GameRound = Database['public']['Tables']['game_rounds']['Row'] & {
	timer_duration?: number;
};

export type PlayerCard = Database['public']['Tables']['player_cards']['Row'];

export type PlayerAnswer = Database['public']['Tables']['player_answers']['Row'];

export type PlayerState =
	| {
			state: 'starting';
	  }
	| {
			state: 'moving';
	  }
	| {
			state: 'writing';
	  }
	| {
			state: 'done';
	  };

export type StoryCharacter = {
	type: Character;
	nickname: string;
	description: string;
};

export type StoryRound = {
	round: number;
	card_id: number | null;
	type: CardType | null;
	answer: string | null;
};

export type SavedStory = {
	id: number;
	story_id: string;
	created_at: string;
	player_name: string;
	story_title: string;
	character: StoryCharacter;
	rounds: Record<string, StoryRound>;
	card_types: string[];
	full_story: string;
};

// AI Agent types for ZoopDAO
export type AIAgentId = string;

export type AIAgent = {
	id: AIAgentId;
	name: string;
	role: Role;
	avatar?: string; // URL to avatar image
};

export type AIMessage = {
	id: string;
	agent_id: AIAgentId;
	round: number;
	content: string;
	created_at: string;
};

export type Participant = 
	| { type: 'human'; player: Player }
	| { type: 'ai'; agent: AIAgent };
