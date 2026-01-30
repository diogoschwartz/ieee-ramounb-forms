
export interface SocialLinks {
  linkedin?: string;
  github?: string;
  instagram?: string;
}

export interface UserData {
  fullName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  matricula: string;
  cpf: string;
  birthDate: string;
  membershipNumber?: string | null;
  role: string;
  course: string;
  socialLinks: SocialLinks;
  chapters: { id: string; role: string }[];
  bio: string;
  skills: string[]; // Changed to array for better handling
  photo_url?: string;
  ieeeMembershipDate?: string;
  notes?: string;
  phone?: string;
  nationality?: string;
}

export enum RegistrationStep {
  ACCOUNT = 'ACCOUNT',
  ACADEMIC = 'ACADEMIC', // Academic + Personal (CPF, Birth)
  CHAPTERS = 'CHAPTERS', // Chapter Selection
  PROFILE = 'PROFILE',   // Bio, Skills, Social
  SUPPORT = 'SUPPORT',   // Apoio (Financeiro, Acessibilidade, Neurodiversidade)
  SUCCESS = 'SUCCESS'
}

export interface Chapter {
  id: string;
  name: string;
  acronym: string;
}
