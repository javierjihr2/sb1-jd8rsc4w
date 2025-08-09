export type PlayerProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  level: number;
  rank: string;
  stats: {
    wins: number;
    kills: number;
    kdRatio: number;
  };
  isAdmin?: boolean;
};

export type Tournament = {
  id: string;
  name: string;
  date: string;
  prize: string;
  mode: 'Solo' | 'Dúo' | 'Escuadra';
  status: 'Abierto' | 'Cerrado' | 'Próximamente';
  region: 'N.A.' | 'S.A.';
};

export type Chat = {
  id: string;
  name: string;
  message: string;
  avatarUrl: string;
  unread: boolean;
};

export type NewsArticle = {
  id: string;
  title: string;
  summary: string;
  date: string;
  imageUrl: string;
  category: string;
};

export type Player = {
    id: string;
    name: string;
    avatarUrl: string;
};

export type Team = {
    id: string;
    name: string;
    players: Player[];
};
