/**
 * EcoPoint - Banco de dados em memória
 * Simula persistência de dados para demonstração do sistema.
 * Em produção, seria substituído por chamadas a uma API REST.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type UserRole = 'driver' | 'admin' | 'agent' | 'resident';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  cpf?: string;
  address?: string;
}

export interface Route {
  id: string;
  name: string;
  description: string;
  estimatedResidences: number;
  neighborhoods: string[];
}

export type ResidenceStatus = 'Pendente' | 'Descarte Consciente' | 'Não participou' | 'Validado';

export interface Residence {
  id: string;
  address: string;
  residentName: string;
  cpf: string;
  status: ResidenceStatus;
  routeName: string;
  registeredAt: string;
  latitude?: number;
  longitude?: number;
}

export interface Participant {
  id: string;
  address: string;
  residentName: string;
  participations: number;
  totalCollections: number;
  discount: number; // percentual 0-15
  lastCollection: string;
  points: number;
}

export interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types: string[]; // plástico, papel, metal, orgânico, eletrônico
  schedule: string;
}

// ─── Dados iniciais ───────────────────────────────────────────────────────────

const initialUsers: User[] = [
  {
    id: 'u1',
    name: 'Motorista Ecoleta',
    email: 'motorista@ecoleta.mga.br',
    password: 'senha123',
    role: 'driver',
  },
  {
    id: 'u2',
    name: 'Administrador',
    email: 'admin@ecoleta.mga.br',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 'u3',
    name: 'Agente Público',
    email: 'agente@ecoleta.mga.br',
    password: 'agente123',
    role: 'agent',
  },
  {
    id: 'u4',
    name: 'Maria Silva',
    email: 'maria@email.com',
    password: 'morador123',
    role: 'resident',
    cpf: '123.456.789-00',
    address: 'Av. Brasil, 1500 - Zona 01, Maringá - PR',
  },
  {
    id: 'u5',
    name: 'João Santos',
    email: 'joao@email.com',
    password: 'morador123',
    role: 'resident',
    cpf: '987.654.321-00',
    address: 'Rua Joubert de Carvalho, 340 - Zona 07, Maringá - PR',
  },
];

const initialRoutes: Route[] = [
  {
    id: 'r1',
    name: 'Rota Alpha',
    description: 'Coleta na Zona 01 e Zona 02 — região central de Maringá.',
    estimatedResidences: 45,
    neighborhoods: ['Zona 01', 'Zona 02'],
  },
  {
    id: 'r2',
    name: 'Rota Beta',
    description: 'Coleta na Zona 07 e Jardim Alvorada.',
    estimatedResidences: 60,
    neighborhoods: ['Zona 07', 'Jd. Alvorada'],
  },
  {
    id: 'r3',
    name: 'Rota Gamma',
    description: 'Coleta no Jardim Universitário e Vila Esperança.',
    estimatedResidences: 38,
    neighborhoods: ['Jd. Universitário', 'Vila Esperança'],
  },
  {
    id: 'r4',
    name: 'Rota Delta',
    description: 'Coleta no Parque das Laranjeiras e Zona 05.',
    estimatedResidences: 52,
    neighborhoods: ['Pq. das Laranjeiras', 'Zona 05'],
  },
];

const initialResidences: Residence[] = [
  // Rota Alpha — Zona 01 / Zona 02 (centro de Maringá)
  {
    id: 'res1',
    address: 'Av. Brasil, 1500 - Zona 01, Maringá - PR',
    residentName: 'Maria Silva',
    cpf: '123.456.789-00',
    status: 'Pendente',
    routeName: 'Rota Alpha',
    registeredAt: '2026-01-10',
    latitude: -23.4253,
    longitude: -51.9386,
  },
  {
    id: 'res2',
    address: 'Av. Brasil, 2200 - Zona 01, Maringá - PR',
    residentName: 'Carlos Pereira',
    cpf: '111.222.333-44',
    status: 'Pendente',
    routeName: 'Rota Alpha',
    registeredAt: '2026-01-10',
    latitude: -23.4268,
    longitude: -51.9362,
  },
  {
    id: 'res3',
    address: 'Rua Pioneiro Antônio Consonni, 80 - Zona 02, Maringá - PR',
    residentName: 'Ana Costa',
    cpf: '555.666.777-88',
    status: 'Pendente',
    routeName: 'Rota Alpha',
    registeredAt: '2026-01-12',
    latitude: -23.4240,
    longitude: -51.9410,
  },
  {
    id: 'res4',
    address: 'Rua Duque de Caxias, 150 - Zona 02, Maringá - PR',
    residentName: 'Luiza Ferreira',
    cpf: '100.200.300-40',
    status: 'Pendente',
    routeName: 'Rota Alpha',
    registeredAt: '2026-01-10',
    latitude: -23.4232,
    longitude: -51.9430,
  },
  // Rota Beta — Zona 07 / Jd. Alvorada
  {
    id: 'res5',
    address: 'Rua Joubert de Carvalho, 340 - Zona 07, Maringá - PR',
    residentName: 'João Santos',
    cpf: '987.654.321-00',
    status: 'Pendente',
    routeName: 'Rota Beta',
    registeredAt: '2026-01-08',
    latitude: -23.4195,
    longitude: -51.9280,
  },
  {
    id: 'res6',
    address: 'Av. Mandacaru, 1800 - Zona 07, Maringá - PR',
    residentName: 'Fernanda Lima',
    cpf: '222.333.444-55',
    status: 'Pendente',
    routeName: 'Rota Beta',
    registeredAt: '2026-01-08',
    latitude: -23.4210,
    longitude: -51.9255,
  },
  {
    id: 'res7',
    address: 'Rua Minas Gerais, 620 - Jd. Alvorada, Maringá - PR',
    residentName: 'Roberto Alves',
    cpf: '333.444.555-66',
    status: 'Pendente',
    routeName: 'Rota Beta',
    registeredAt: '2026-01-15',
    latitude: -23.4225,
    longitude: -51.9230,
  },
  // Rota Gamma — Jd. Universitário
  {
    id: 'res8',
    address: 'Av. Colombo, 5790 - Jd. Universitário, Maringá - PR',
    residentName: 'Patrícia Souza',
    cpf: '444.555.666-77',
    status: 'Pendente',
    routeName: 'Rota Gamma',
    registeredAt: '2026-01-05',
    latitude: -23.4012,
    longitude: -51.9087,
  },
  {
    id: 'res9',
    address: 'Rua Paranaguá, 200 - Jd. Universitário, Maringá - PR',
    residentName: 'Eduardo Martins',
    cpf: '500.600.700-80',
    status: 'Pendente',
    routeName: 'Rota Gamma',
    registeredAt: '2026-01-05',
    latitude: -23.4025,
    longitude: -51.9070,
  },
  // Rota Delta — Pq. das Laranjeiras / Zona 05
  {
    id: 'res10',
    address: 'Rua Pará, 450 - Zona 05, Maringá - PR',
    residentName: 'Marcos Oliveira',
    cpf: '666.777.888-99',
    status: 'Pendente',
    routeName: 'Rota Delta',
    registeredAt: '2026-01-20',
    latitude: -23.4310,
    longitude: -51.9450,
  },
  {
    id: 'res11',
    address: 'Av. Herval, 900 - Pq. das Laranjeiras, Maringá - PR',
    residentName: 'Camila Rocha',
    cpf: '777.888.999-00',
    status: 'Pendente',
    routeName: 'Rota Delta',
    registeredAt: '2026-01-20',
    latitude: -23.4330,
    longitude: -51.9470,
  },
];

const initialParticipants: Participant[] = [
  {
    id: 'p1',
    address: 'Av. Brasil, 1500 - Zona 01, Maringá - PR',
    residentName: 'Maria Silva',
    participations: 0,
    totalCollections: 0,
    discount: 0,
    lastCollection: 'N/A',
    points: 0,
  },
  {
    id: 'p2',
    address: 'Av. Brasil, 2200 - Zona 01, Maringá - PR',
    residentName: 'Carlos Pereira',
    participations: 0,
    totalCollections: 0,
    discount: 0,
    lastCollection: 'N/A',
    points: 0,
  },
  {
    id: 'p3',
    address: 'Rua Joubert de Carvalho, 340 - Zona 07, Maringá - PR',
    residentName: 'João Santos',
    participations: 0,
    totalCollections: 0,
    discount: 0,
    lastCollection: 'N/A',
    points: 0,
  },
  {
    id: 'p4',
    address: 'Av. Mandacaru, 1800 - Zona 07, Maringá - PR',
    residentName: 'Fernanda Lima',
    participations: 0,
    totalCollections: 0,
    discount: 0,
    lastCollection: 'N/A',
    points: 0,
  },
  {
    id: 'p5',
    address: 'Av. Colombo, 5790 - Jd. Universitário, Maringá - PR',
    residentName: 'Patrícia Souza',
    participations: 0,
    totalCollections: 0,
    discount: 0,
    lastCollection: 'N/A',
    points: 0,
  },
];

const initialCollectionPoints: CollectionPoint[] = [
  {
    id: 'cp1',
    name: 'Ecoponto Central',
    address: 'Av. Brasil, 3500 - Zona 01, Maringá - PR',
    latitude: -23.4258,
    longitude: -51.9330,
    types: ['plástico', 'papel', 'metal', 'vidro'],
    schedule: 'Seg-Sex: 8h-18h | Sáb: 8h-13h',
  },
  {
    id: 'cp2',
    name: 'Ecoponto Mandacaru',
    address: 'Av. Mandacaru, 2500 - Zona 07, Maringá - PR',
    latitude: -23.4205,
    longitude: -51.9240,
    types: ['plástico', 'papel', 'eletrônico'],
    schedule: 'Seg-Sex: 7h-17h',
  },
  {
    id: 'cp3',
    name: 'Ecoponto UEM',
    address: 'Av. Colombo, 5790 - Jd. Universitário, Maringá - PR',
    latitude: -23.4018,
    longitude: -51.9080,
    types: ['metal', 'vidro', 'orgânico', 'eletrônico'],
    schedule: 'Ter-Sáb: 8h-16h',
  },
  {
    id: 'cp4',
    name: 'Ecoponto Zona 05',
    address: 'Rua Pará, 800 - Zona 05, Maringá - PR',
    latitude: -23.4315,
    longitude: -51.9460,
    types: ['plástico', 'papel', 'metal', 'vidro', 'eletrônico', 'orgânico'],
    schedule: 'Seg-Dom: 7h-19h',
  },
];

// ─── Classe do banco de dados ─────────────────────────────────────────────────

class Database {
  private _users: User[] = [...initialUsers];
  private _routes: Route[] = [...initialRoutes];
  private _residences: Residence[] = [...initialResidences];
  private _participants: Participant[] = [...initialParticipants];
  private _collectionPoints: CollectionPoint[] = [...initialCollectionPoints];
  private _nextId = 100;

  // Registro de rotas finalizadas: chave = "YYYY-MM-DD|routeName"
  private _completedRoutes: Set<string> = new Set();

  private generateId(): string {
    return `id_${this._nextId++}`;
  }

  private todayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ── Usuários ──────────────────────────────────────────────────────────────

  get users(): User[] {
    return this._users;
  }

  findUserByEmail(email: string): User | undefined {
    return this._users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user: Omit<User, 'id'>): User {
    const newUser: User = { ...user, id: this.generateId() };
    this._users.push(newUser);
    return newUser;
  }

  // ── Rotas ─────────────────────────────────────────────────────────────────

  get routes(): Route[] {
    return this._routes;
  }

  /** Marca uma rota como finalizada no dia de hoje */
  markRouteCompleted(routeName: string): void {
    this._completedRoutes.add(`${this.todayKey()}|${routeName}`);
  }

  /** Verifica se a rota foi finalizada hoje */
  isRouteCompletedToday(routeName: string): boolean {
    return this._completedRoutes.has(`${this.todayKey()}|${routeName}`);
  }

  // ── Residências ───────────────────────────────────────────────────────────

  get residences(): Residence[] {
    return this._residences;
  }

  getResidencesByRoute(routeName: string): Residence[] {
    return this._residences.filter(r => r.routeName === routeName);
  }

  getResidenceByAddress(address: string): Residence | undefined {
    return this._residences.find(r => r.address === address);
  }

  addResidence(residence: Omit<Residence, 'id' | 'registeredAt'>): Residence {
    const newResidence: Residence = {
      ...residence,
      id: this.generateId(),
      registeredAt: new Date().toISOString().split('T')[0],
    };
    this._residences.push(newResidence);
    return newResidence;
  }

  updateResidenceStatus(address: string, newStatus: ResidenceStatus): boolean {
    const residence = this._residences.find(r => r.address === address);
    if (residence) {
      residence.status = newStatus;
      if (newStatus === 'Descarte Consciente') {
        this.recordParticipation(address);
      }
      return true;
    }
    return false;
  }

  // ── Participantes ─────────────────────────────────────────────────────────

  get participants(): Participant[] {
    return this._participants;
  }

  getParticipantByAddress(address: string): Participant | undefined {
    return this._participants.find(p => p.address === address);
  }

  addParticipant(data: { address: string; residentName: string }): Participant {
    const existing = this.getParticipantByAddress(data.address);
    if (existing) return existing;

    const newParticipant: Participant = {
      id: this.generateId(),
      address: data.address,
      residentName: data.residentName,
      participations: 0,
      totalCollections: 0,
      discount: 0,
      lastCollection: 'N/A',
      points: 0,
    };
    this._participants.push(newParticipant);
    return newParticipant;
  }

  recordParticipation(address: string): void {
    const participant = this._participants.find(p => p.address === address);
    if (participant) {
      participant.participations += 1;
      participant.totalCollections += 1;
      participant.points += 30;
      participant.lastCollection = new Date().toLocaleDateString('pt-BR');
      participant.discount = Math.min(15, Math.floor(participant.participations * 1.5));
    }
  }

  updateDiscount(address: string, discount: number): boolean {
    const participant = this._participants.find(p => p.address === address);
    if (participant) {
      participant.discount = Math.min(15, Math.max(0, discount));
      return true;
    }
    return false;
  }

  // ── Pontos de coleta ──────────────────────────────────────────────────────

  get collectionPoints(): CollectionPoint[] {
    return this._collectionPoints;
  }
}

// Singleton
const db = new Database();
export default db;
