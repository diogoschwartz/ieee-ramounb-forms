
import React from 'react';
import { Instagram, Linkedin, Mail } from 'lucide-react';

export const COLORS = {
  IEEE_BLUE: '#00629B',
  IEEE_DARK_BLUE: '#004b7a',
  UNB_WHITE: '#FFFFFF',
};

export const SOCIAL_LINKS = [
  { icon: <Instagram className="w-5 h-5" />, label: '@ramoieeeunb', href: 'https://instagram.com/ramoieeeunb' },
  { icon: <Linkedin className="w-5 h-5" />, label: '/company/ramo-unb', href: 'https://linkedin.com/company/ramo-unb' },
  { icon: <Mail className="w-5 h-5" />, label: 'sb.ieee.unb@gmail.com', href: 'mailto:sb.ieee.unb@gmail.com' },
];

export const COURSES = [
  'Engenharia Elétrica',
  'Engenharia de Redes de Comunicação',
  'Engenharia de Computação',
  'Engenharia Mecatrônica',
  'Ciência da Computação',
  'Sistemas de Informação',
  'Outros'
];

export const ACADEMIC_BONDS = [
  'Graduação',
  'Pós-Graduação',
  'Professor',
  'Servidor',
  'Externo'
];

export const ROLES = [
  'Estudante',
  'Professor',
  'Pesquisador',
  'Engenheiro',
  'Outro'
];

export const AVAILABLE_CHAPTERS = [
  { id: '1', acronym: 'RamoUnB', name: 'Ramo Estudantil IEEE UnB' },
  { id: '2', acronym: 'AESS', name: 'Aerospace & Electronic Systems Society' },
  { id: '3', acronym: 'CAS', name: 'Circuits and Systems Society' },
  { id: '4', acronym: 'ComSoc', name: 'Communications Society' },
  { id: '5', acronym: 'CIS', name: 'Computational Intelligence Society' },
  { id: '6', acronym: 'CS', name: 'Computer Society' },
  { id: '7', acronym: 'CSS', name: 'Control Systems Society' },
  { id: '8', acronym: 'EdSoc', name: 'Education Society' },
  { id: '9', acronym: 'EMBS', name: 'Engineering in Medicine & Biology Society' },
  { id: '10', acronym: 'MTTS', name: 'Microwave Theory and Technology Society' },
  { id: '11', acronym: 'PES', name: 'Power & Energy Society' },
  { id: '12', acronym: 'RAS', name: 'Robotics & Automation Society' },
  { id: '13', acronym: 'SPS', name: 'Signal Processing Society' },
  { id: '14', acronym: 'SSIT', name: 'Society on Social Implications of Technology' },
  { id: '15', acronym: 'VTS', name: 'Vehicular Technology Society' },
  { id: '16', acronym: 'WIE', name: 'Women in Engineering' }
];

export const CHAPTER_ROLES = [
  'Membro',
  'Presidente',
  'Vice-Presidente',
  'Diretor de Projetos',
  'Diretor de Marketing',
  'Tesoureiro',
  'Secretário'
];
