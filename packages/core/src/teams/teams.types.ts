/** A team a player or bot can be on. */
export type PlayableTeam = 'light' | 'dark';

/** Who owns something in the world. Neutral things belong to no player team. */
export type Team = PlayableTeam | 'neutral';
