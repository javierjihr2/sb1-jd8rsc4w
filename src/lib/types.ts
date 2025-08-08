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
};

export type Tournament = {
  id: string;
  name: string;
  date: string;
  prize: string;
  mode: 'Solo' | 'Dúo' | 'Escuadra';
  status: 'Abierto' | 'Cerrado' | 'Próximamente';
};

export type Chat = {
  id: string;
  name: string;
  message: string;
  avatarUrl: string;
  unread: boolean;
};
