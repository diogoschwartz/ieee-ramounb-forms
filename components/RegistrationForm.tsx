import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { RegistrationStep, UserData } from '../types';
import { COURSES, ROLES, AVAILABLE_CHAPTERS, CHAPTER_ROLES, ACADEMIC_BONDS } from '../constants';
import { supabase } from '../lib/supabase';
import { encryptData } from '../lib/encryption';
import { cpf } from 'cpf-cnpj-validator';
import {
  ArrowRight, ArrowLeft, User, Mail, Hash, BookOpen,
  Lock, CheckCircle2, Loader2, Calendar, Award, Globe,
  Github, Linkedin as LinkedinIcon, Instagram, X, Plus, Trash2, ShieldCheck, MapPin, Link as LinkIcon, Image as ImageIcon, HeartHandshake
} from 'lucide-react';

const RegistrationForm: React.FC = () => {
  const [step, setStep] = useState<RegistrationStep>(RegistrationStep.ACCOUNT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const [formData, setFormData] = useState<UserData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    matricula: '',
    cpf: '',
    birthDate: '',
    membershipNumber: '', // will be set to null if checkbox checked
    role: ROLES[0],
    course: '',
    socialLinks: { linkedin: '', github: '', instagram: '' },
    chapters: [],
    bio: '',
    skills: [],
    photo_url: '',
    ieeeMembershipDate: '',
    phone: ''
  });

  const [academicBond, setAcademicBond] = useState(ACADEMIC_BONDS[0]); // Default to first bond

  // Checkbox states for social media
  const [socialChecks, setSocialChecks] = useState({
    linkedin: false,
    github: false,
    instagram: false
  });

  // UI State for IEEE Membership Checkbox
  const [noIEEE, setNoIEEE] = useState(false);
  const [bioTab, setBioTab] = useState<'write' | 'preview'>('write');

  // Validation State
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Support Request State
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportData, setSupportData] = useState({
    financial: 'Não',
    physical: 'Não',
    physicalDetail: '',
    neurodiversityCondition: '', // New Field
    neurodiversity: [] as string[],
    neurodiversityOther: '',
    technical: 'Não',
    technicalDetail: ''
  });

  const handleSupportChange = (field: string, value: any) => {
    setSupportData(prev => ({ ...prev, [field]: value }));
  };

  const handleNeurodiversityChange = (value: string) => {
    setSupportData(prev => {
      const current = prev.neurodiversity;
      if (current.includes(value)) {
        return { ...prev, neurodiversity: current.filter(item => item !== value) };
      } else {
        return { ...prev, neurodiversity: [...current, value] };
      }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    // Mask: +XX (XX) XXXXX-XXXX
    let v = value.replace(/\D/g, ''); // Remove non-digits

    // Limit to 13 digits (2 Country + 2 Area + 9 Number)
    if (v.length > 13) v = v.substring(0, 13);

    // Default to Brazil (+55) if user starts typing local number and it's getting long
    // But for a generic mask, let's just format what we have.
    // However, user requested +XX (XX)...
    // If empty, return empty
    if (v.length === 0) return '';

    // 1. Country Code (+XX)
    if (v.length <= 2) return `+${v}`;

    // 2. Area Code (+XX (XX))
    if (v.length <= 4) return `+${v.substring(0, 2)} (${v.substring(2)}`;

    // 3. First Part of Number (+XX (XX) XXXXX)
    if (v.length <= 9) return `+${v.substring(0, 2)} (${v.substring(2, 4)}) ${v.substring(4)}`;

    // 4. Full Number (+XX (XX) XXXXX-XXXX)
    return `+${v.substring(0, 2)} (${v.substring(2, 4)}) ${v.substring(4, 9)}-${v.substring(9)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Clear validation error on change
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }

    if (name.startsWith('social_')) {
      const field = name.split('_')[1] as 'linkedin' | 'github' | 'instagram';

      // Auto-check if user starts typing
      if (value.trim().length > 0 && !socialChecks[field]) {
        setSocialChecks(prev => ({ ...prev, [field]: true }));
      }

      setFormData(prev => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [field]: value }
      }));
    } else if (name === 'cpf') {
      setFormData(prev => ({ ...prev, cpf: formatCPF(value) }));
    } else if (name === 'phone') {
      setFormData(prev => ({ ...prev, phone: formatPhone(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Skill Tags Management
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim().replace(/,$/, '');
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  // Chapter Management
  const addChapter = () => {
    setFormData(prev => ({
      ...prev,
      chapters: [...prev.chapters, { id: '', role: '' }]
    }));
  };

  const removeChapter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      chapters: prev.chapters.filter((_, i) => i !== index)
    }));
  };

  const updateChapter = (index: number, field: 'id' | 'role', value: string) => {
    setFormData(prev => {
      const newChapters = [...prev.chapters];
      newChapters[index] = { ...newChapters[index], [field]: value };
      return { ...prev, chapters: newChapters };
    });
  };

  // Validation Logic
  const validateStep = (currentStep: RegistrationStep): boolean => {
    const errors: { [key: string]: string } = {};
    let isValid = true;

    if (currentStep === RegistrationStep.ACCOUNT) {
      if (!formData.fullName.trim()) {
        errors.fullName = 'Nome é obrigatório';
      } else if (formData.fullName.trim().split(/\s+/).length < 2) {
        errors.fullName = 'Por favor, informe seu nome completo (Nome e Sobrenome)';
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) errors.email = 'E-mail inválido';

      if (!formData.password || formData.password.length < 6) errors.password = 'Senha deve ter no mínimo 6 caracteres';
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'As senhas não coincidem';
    }

    if (currentStep === RegistrationStep.ACADEMIC) {
      if (!formData.matricula.trim()) errors.matricula = 'Matrícula é obrigatória';
      if (!formData.birthDate) errors.birthDate = 'Data de nascimento é obrigatória';

      if (!cpf.isValid(formData.cpf)) errors.cpf = 'CPF inválido';

      if (!noIEEE && (!formData.membershipNumber || formData.membershipNumber.trim() === '')) {
        // Optionally validate membership number format if strict rule exists
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      isValid = false;
    }

    return isValid;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;

    if (step === RegistrationStep.ACCOUNT) {
      setShowEmailModal(true);
    } else if (step === RegistrationStep.ACADEMIC) {
      setStep(RegistrationStep.CHAPTERS);
    } else if (step === RegistrationStep.CHAPTERS) {
      setStep(RegistrationStep.PROFILE);
    } else if (step === RegistrationStep.PROFILE) {
      setStep(RegistrationStep.SUPPORT);
    }
  };

  const confirmEmail = () => {
    setShowEmailModal(false);
    setStep(RegistrationStep.ACADEMIC);
  };

  const handleBack = () => {
    if (step === RegistrationStep.ACADEMIC) setStep(RegistrationStep.ACCOUNT);
    else if (step === RegistrationStep.CHAPTERS) setStep(RegistrationStep.ACADEMIC);
    else if (step === RegistrationStep.PROFILE) setStep(RegistrationStep.CHAPTERS);
    else if (step === RegistrationStep.SUPPORT) setStep(RegistrationStep.PROFILE);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare Notes
      let finalNotes = null;
      if (showSupportForm) {
        finalNotes = `[SOLICITAÇÃO DE APOIO]
1. Renda Familiar <= 1SM: ${supportData.financial}
2. Acessibilidade Física: ${supportData.physical}${supportData.physical === 'Sim' ? ` (${supportData.physicalDetail})` : ''}
2. Acessibilidade Física: ${supportData.physical}${supportData.physical === 'Sim' ? ` (${supportData.physicalDetail})` : ''}
3. Neurodiversidade: ${supportData.neurodiversityCondition ? `[${supportData.neurodiversityCondition}] ` : ''}${supportData.neurodiversity.join(', ')}${supportData.neurodiversityOther ? `, Outro: ${supportData.neurodiversityOther}` : ''}
4. Suporte Técnico: ${supportData.technical}${supportData.technical === 'Sim' ? ` (${supportData.technicalDetail})` : ''}`;
      }

      // 2. Determine Main Role (Dynamic)
      let finalRole = academicBond; // Default Fallback

      if (formData.chapters.length > 0) {
        const priorityRoles = ['Presidente', 'Vice', 'Diretor', 'Tesoureiro', 'Secretário', 'Advisor', 'Counselor'];

        // Find highest priority role
        let foundPriority = null;
        for (const pRole of priorityRoles) {
          const match = formData.chapters.find(c => c.role.includes(pRole));
          if (match) {
            foundPriority = match;
            break;
          }
        }

        if (foundPriority) {
          const chap = AVAILABLE_CHAPTERS.find(c => c.id === foundPriority!.id);
          finalRole = `${foundPriority.role} ${chap?.acronym || ''}`;
        } else {
          // All members or other lower roles
          const acronyms = formData.chapters.map(c => {
            const chap = AVAILABLE_CHAPTERS.find(ch => ch.id === c.id);
            return chap?.acronym;
          }).filter(Boolean);
          finalRole = `Membro ${acronyms.join(' & ')}`;
        }
      }

      // 1. Auth Sign Up (Trigger will handle Profile creation)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password!,
        options: {
          data: {
            full_name: formData.fullName,
            role: finalRole,
            avatar_initials: getInitials(formData.fullName),
            phone: formData.phone,
            matricula: formData.matricula,
            birth_date: formData.birthDate,
            membership_number: noIEEE ? null : formData.membershipNumber,
            social_links: {
              linkedin: socialChecks.linkedin ? formData.socialLinks.linkedin : null,
              github: socialChecks.github ? formData.socialLinks.github : null,
              instagram: socialChecks.instagram ? formData.socialLinks.instagram : null
            },
            course: `${formData.course} - ${academicBond}`,
            skills: formData.skills,
            photo_url: formData.photo_url || null,
            ieee_membership_date: formData.ieeeMembershipDate ? formData.ieeeMembershipDate.replace('-', '/') : null,
            notes: encryptData(finalNotes || ''),
            cpf: [formData.cpf, formData.nationality || ''],
            bio: formData.bio,
            cover_config: 'from-sky-500 to-slate-700', // Default Cover
            chapters: formData.chapters // Passing chapters for the trigger
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Profile and Chapters are created automatically by DB Trigger

        // 4. Show Success
      }

      setStep(RegistrationStep.SUCCESS);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao realizar o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  if (step === RegistrationStep.SUCCESS) {
    return (
      <div className="text-center py-12 px-6 animate-in zoom-in duration-300 max-w-4xl mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Cadastro Finalizado!</h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Seu cadastro foi realizado com sucesso. Assista ao tutorial abaixo para aprender a utilizar o aplicativo.
        </p>

        {/* YouTube Embed */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl mb-8 border border-gray-100 bg-black">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/TzIOeSB9RaU"
            title="Tutorial Conecta IEEE"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          ></iframe>
        </div>

        <a
          href="https://unb.conectaieee.com"
          className="inline-flex items-center justify-center bg-[#00629b] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#004b7a] transition-all hover:scale-105"
        >
          Acessar o Conecta IEEE
          <ArrowRight className="ml-2 w-5 h-5" />
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden mt-[-3rem] z-20 relative border border-gray-100">
        <div className="bg-[#00629b] h-2 w-full"></div>

        <div className="p-8 md:p-12">
          {/* Header & Steps */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {step === RegistrationStep.ACCOUNT && "Crie sua Conta"}
                {step === RegistrationStep.ACADEMIC && "Dados Acadêmicos"}
                {step === RegistrationStep.CHAPTERS && "Seus Capítulos"}
                {step === RegistrationStep.PROFILE && "Perfil Profissional"}
                {step === RegistrationStep.SUPPORT && "Solicitação de Apoio"}
              </h2>
              <p className="text-gray-500 text-sm">
                {step === RegistrationStep.ACCOUNT && "Inicie seu cadastro com seus dados básicos."}
                {step === RegistrationStep.ACADEMIC && "Informe seus dados de vínculo com a universidade."}
                {step === RegistrationStep.CHAPTERS && "Selecione os capítulos que você participa."}
                {step === RegistrationStep.PROFILE && "Personalize seu perfil com fotos e redes sociais."}
                {step === RegistrationStep.SUPPORT && "Informe suas necessidades de apoio (opcional)."}
              </p>
            </div>
            <div className="flex gap-2">
              {[RegistrationStep.ACCOUNT, RegistrationStep.ACADEMIC, RegistrationStep.CHAPTERS, RegistrationStep.PROFILE, RegistrationStep.SUPPORT].map((s, idx) => (
                <div
                  key={idx}
                  className={`w-10 h-1.5 rounded-full transition-all duration-300 ${step === s ? 'bg-[#00629b]' : 'bg-gray-100'
                    }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* STEP 1: ACCOUNT */}
            {step === RegistrationStep.ACCOUNT && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#00629b]" /> Nome Completo
                  </label>
                  <input
                    required
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${validationErrors.fullName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#00629b]'}`}
                    placeholder="Seu nome completo"
                  />
                  {validationErrors.fullName && <p className="text-xs text-red-500">{validationErrors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#00629b]" /> E-mail Principal
                  </label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${validationErrors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#00629b]'}`}
                    placeholder="exemplo@gmail.com"
                  />
                  {validationErrors.email && <p className="text-xs text-red-500">{validationErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    WhatsApp / Telefone
                  </label>
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${validationErrors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#00629b]'}`}
                    placeholder="+55 (61) 99999-9999"
                  />
                  {validationErrors.phone && <p className="text-xs text-red-500">{validationErrors.phone}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#00629b]" /> Senha
                    </label>
                    <input
                      required
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${validationErrors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#00629b]'}`}
                      placeholder="Mín. 6 caracteres"
                    />
                    {validationErrors.password && <p className="text-xs text-red-500">{validationErrors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#00629b]" /> Confirmar Senha
                    </label>
                    <input
                      required
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${validationErrors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#00629b]'}`}
                      placeholder="Repita a senha"
                    />
                    {validationErrors.confirmPassword && <p className="text-xs text-red-500">{validationErrors.confirmPassword}</p>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 bg-[#00629b] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#004b7a] transition-all group"
                >
                  Próximo: Dados Acadêmicos <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* STEP 2: ACADEMIC */}
            {step === RegistrationStep.ACADEMIC && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">

                {/* CPF */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00629b]" /> CPF
                    </label>
                    <input
                      required
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleInputChange}
                      maxLength={14}
                      placeholder="000.000.000-00"
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${validationErrors.cpf ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#00629b]'}`}
                    />
                    {validationErrors.cpf && <p className="text-xs text-red-500">{validationErrors.cpf}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-[#00629b]" /> Nacionalidade
                    </label>
                    <input
                      required
                      type="text"
                      name="nationality"
                      value={formData.nationality || ''}
                      onChange={handleInputChange}
                      placeholder="Ex: Brasileira"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00629b] transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-[#00629b]" /> Matrícula UnB
                    </label>
                    <input
                      required
                      type="text"
                      name="matricula"
                      value={formData.matricula}
                      onChange={handleInputChange}
                      placeholder="00/0000000"
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${validationErrors.matricula ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#00629b]'}`}
                    />
                    {validationErrors.matricula && <p className="text-xs text-red-500">{validationErrors.matricula}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#00629b]" /> Data de Nascimento
                    </label>
                    <input
                      required
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${validationErrors.birthDate ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#00629b]'}`}
                    />
                    {validationErrors.birthDate && <p className="text-xs text-red-500">{validationErrors.birthDate}</p>}
                  </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Course */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#00629b]" /> Curso
                    </label>
                    <input
                      type="text"
                      name="course"
                      value={formData.course}
                      onChange={handleInputChange}
                      placeholder="Ex: Engenharia Elétrica"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00629b]/20 focus:border-[#00629b] transition-all outline-none bg-white"
                    />
                  </div>

                  {/* Bond with UnB */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00629b]" /> Vínculo com a UnB
                    </label>
                    <select
                      value={academicBond}
                      onChange={(e) => setAcademicBond(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00629b]/20 focus:border-[#00629b] transition-all outline-none bg-white"
                    >
                      {ACADEMIC_BONDS.map(bond => <option key={bond} value={bond}>{bond}</option>)}
                    </select>
                  </div>

                  {/* IEEE Membership */}
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-[#00629b]" /> Nº Membresia IEEE
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="membershipNumber"
                        value={noIEEE ? '' : (formData.membershipNumber || '')}
                        onChange={handleInputChange}
                        disabled={noIEEE}
                        placeholder={noIEEE ? "Não possuo" : "Nº de Membresia"}
                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00629b]/20 focus:border-[#00629b] transition-all outline-none ${noIEEE ? 'bg-gray-50 text-gray-400' : ''}`}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        id="noIEEE"
                        checked={noIEEE}
                        onChange={(e) => setNoIEEE(e.target.checked)}
                        className="rounded text-[#00629b] focus:ring-[#00629b]"
                      />
                      <label htmlFor="noIEEE" className="text-xs text-gray-500 cursor-pointer select-none">Não tenho membresia IEEE</label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-100 text-gray-500 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" /> Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-[2] flex items-center justify-center gap-2 bg-[#00629b] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#004b7a] transition-all group"
                  >
                    Próximo: Capítulos <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CHAPTERS */}
            {step === RegistrationStep.CHAPTERS && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-800 text-sm">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                  <p>Adicione os capítulos que você participa e seu cargo atual em cada um. </p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-[#00629b]" /> Capítulos e Cargos
                  </label>

                  {/* Dynamic Chapter List */}
                  <div className="space-y-3">
                    {formData.chapters.map((chapter, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-2 items-start animate-in slide-in-from-left-2 duration-300 p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                        <div className="flex-1 space-y-1 w-full">
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Capítulo</label>
                          <select
                            value={chapter.id}
                            onChange={(e) => updateChapter(index, 'id', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00629b]/20 focus:border-[#00629b] transition-all outline-none bg-white"
                          >
                            <option value="">Selecione...</option>
                            {AVAILABLE_CHAPTERS.map(c => (
                              <option key={c.id} value={c.id}>{c.acronym} - {c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1 space-y-1 w-full">
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Cargo</label>
                          <select
                            value={chapter.role}
                            onChange={(e) => updateChapter(index, 'role', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00629b]/20 focus:border-[#00629b] transition-all outline-none bg-white"
                          >
                            <option value="">Selecione...</option>
                            {CHAPTER_ROLES.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeChapter(index)}
                          className="md:mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all self-end md:self-auto"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addChapter}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-semibold hover:border-[#00629b] hover:text-[#00629b] hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> Adicionar Capítulo
                    </button>
                  </div>
                </div>

                {/* IEEE Membership Date */}
                <div className="pt-4 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Calendar className="w-3.5 h-3.5 text-[#00629b]" /> Data de Entrada no IEEE
                  </label>
                  <div className="flex gap-4">
                    {/* Month Select */}
                    <div className="flex-1">
                      <select
                        value={formData.ieeeMembershipDate ? formData.ieeeMembershipDate.split('-')[1] : ''}
                        onChange={(e) => {
                          const newMonth = e.target.value;
                          const currentYear = formData.ieeeMembershipDate ? formData.ieeeMembershipDate.split('-')[0] : new Date().getFullYear().toString();
                          setFormData(prev => ({ ...prev, ieeeMembershipDate: `${currentYear}-${newMonth}` }));
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00629b]/20 focus:border-[#00629b] transition-all outline-none bg-white"
                      >
                        <option value="" disabled>Mês</option>
                        {[
                          { val: '01', label: 'Janeiro' }, { val: '02', label: 'Fevereiro' }, { val: '03', label: 'Março' },
                          { val: '04', label: 'Abril' }, { val: '05', label: 'Maio' }, { val: '06', label: 'Junho' },
                          { val: '07', label: 'Julho' }, { val: '08', label: 'Agosto' }, { val: '09', label: 'Setembro' },
                          { val: '10', label: 'Outubro' }, { val: '11', label: 'Novembro' }, { val: '12', label: 'Dezembro' }
                        ].map(m => (
                          <option key={m.val} value={m.val}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Year Select */}
                    <div className="flex-1">
                      <select
                        value={formData.ieeeMembershipDate ? formData.ieeeMembershipDate.split('-')[0] : ''}
                        onChange={(e) => {
                          const newYear = e.target.value;
                          const currentMonth = formData.ieeeMembershipDate ? formData.ieeeMembershipDate.split('-')[1] : '01';
                          setFormData(prev => ({ ...prev, ieeeMembershipDate: `${newYear}-${currentMonth}` }));
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00629b]/20 focus:border-[#00629b] transition-all outline-none bg-white"
                      >
                        <option value="" disabled>Ano</option>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                        {/* Add some older years if needed, or make the range dynamic */}
                        {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 10 - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Selecione o mês e ano aproximado de sua filiação ao IEEE.</p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-100 text-gray-500 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" /> Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-[2] flex items-center justify-center gap-2 bg-[#00629b] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#004b7a] transition-all group"
                  >
                    Próximo: Perfil <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PROFILE */}
            {step === RegistrationStep.PROFILE && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">

                {/* PHOTO URL */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-[#00629b]" /> Foto de Perfil
                  </label>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          name="photo_url"
                          value={formData.photo_url}
                          onChange={handleInputChange}
                          placeholder="https://media.licdn.com/dms/image/..."
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00629b]/20 focus:border-[#00629b] transition-all outline-none bg-white text-sm"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Recomendamos usar a URL da sua foto do <strong>LinkedIn</strong>. Clique com botão direito na sua foto de perfil e escolha "Copiar endereço da imagem".
                      </p>
                    </div>

                    {/* Avatar Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
                        {formData.photo_url ? (
                          <img
                            src={formData.photo_url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '';
                              (e.target as HTMLImageElement).style.display = 'none';
                              // Show initials fallback if specific parent logic allowed, but simpler to just hide img and show fallback behind it? 
                              // Actually let's just use a conditional render or a fallback div behind.
                            }}
                          />
                        ) : (
                          <span className="text-xl font-bold text-gray-400">
                            {getInitials(formData.fullName)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BIO WITH MARKDOWN EDITOR */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#00629b]" /> Bio / Mini Currículo
                    </label>
                    <div className="flex bg-gray-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setBioTab('write')}
                        className={`text-xs font-medium px-3 py-1 rounded-md transition-all ${bioTab === 'write' ? 'bg-white text-[#00629b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Escrever
                      </button>
                      <button
                        type="button"
                        onClick={() => setBioTab('preview')}
                        className={`text-xs font-medium px-3 py-1 rounded-md transition-all ${bioTab === 'preview' ? 'bg-white text-[#00629b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Visualizar
                      </button>
                    </div>
                  </div>

                  {bioTab === 'write' ? (
                    <div className="relative">
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Conte um pouco sobre você... (Markdown suportado: **negrito**, *itálico*, links, etc)"
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00629b]/20 focus:border-[#00629b] transition-all outline-none resize-none font-mono text-sm"
                      />
                      <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 pointer-events-none">
                        Markdown Suportado
                      </div>
                    </div>
                  ) : (
                    <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 min-h-[150px] prose prose-sm prose-blue max-w-none overflow-y-auto">
                      {formData.bio ? (
                        <ReactMarkdown>{formData.bio}</ReactMarkdown>
                      ) : (
                        <span className="text-gray-400 italic">Nada para visualizar...</span>
                      )}
                    </div>
                  )}
                </div>

                {/* SKILLS - TAG INPUT */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-[#00629b]" /> Habilidades
                  </label>
                  <div className="w-full px-2 py-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#00629b]/20 focus-within:border-[#00629b] transition-all bg-white min-h-[50px] flex flex-wrap gap-2">
                    {formData.skills.map((skill, idx) => (
                      <span key={idx} className="bg-[#00629b]/10 text-[#00629b] px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 animate-in zoom-in-50 duration-200">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      onBlur={addSkill}
                      placeholder={formData.skills.length === 0 ? "Digite tags ex: React, Python..." : "Add..."}
                      className="flex-1 min-w-[100px] outline-none text-sm px-2 py-1"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">Pressione Enter ou Vírgula para adicionar</p>
                </div>

                {/* SOCIAL LINKS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={socialChecks.linkedin}
                        onChange={(e) => setSocialChecks(prev => ({ ...prev, linkedin: e.target.checked }))}
                        className="rounded text-[#00629b] focus:ring-[#00629b]"
                      />
                      <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${socialChecks.linkedin ? 'text-gray-600' : 'text-gray-400'}`}>
                        <LinkedinIcon className="w-3.5 h-3.5 text-[#00629b]" /> LinkedIn
                      </label>
                    </div>
                    <input
                      type="url"
                      name="social_linkedin"
                      disabled={!socialChecks.linkedin}
                      value={formData.socialLinks.linkedin}
                      onChange={handleInputChange}
                      placeholder="URL do perfil"
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${!socialChecks.linkedin ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-200 focus:ring-2 focus:ring-[#00629b]/20 focus:border-[#00629b]'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={socialChecks.github}
                        onChange={(e) => setSocialChecks(prev => ({ ...prev, github: e.target.checked }))}
                        className="rounded text-[#00629b] focus:ring-[#00629b]"
                      />
                      <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${socialChecks.github ? 'text-gray-600' : 'text-gray-400'}`}>
                        <Github className="w-3.5 h-3.5 text-[#00629b]" /> GitHub
                      </label>
                    </div>
                    <input
                      type="url"
                      name="social_github"
                      disabled={!socialChecks.github}
                      value={formData.socialLinks.github}
                      onChange={handleInputChange}
                      placeholder="URL do perfil"
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${!socialChecks.github ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-200 focus:ring-2 focus:ring-[#00629b]/20 focus:border-[#00629b]'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={socialChecks.instagram}
                        onChange={(e) => setSocialChecks(prev => ({ ...prev, instagram: e.target.checked }))}
                        className="rounded text-[#00629b] focus:ring-[#00629b]"
                      />
                      <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${socialChecks.instagram ? 'text-gray-600' : 'text-gray-400'}`}>
                        <Instagram className="w-3.5 h-3.5 text-[#00629b]" /> Instagram
                      </label>
                    </div>
                    <input
                      type="url"
                      name="social_instagram"
                      disabled={!socialChecks.instagram}
                      value={formData.socialLinks.instagram}
                      onChange={handleInputChange}
                      placeholder="URL do perfil"
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${!socialChecks.instagram ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-200 focus:ring-2 focus:ring-[#00629b]/20 focus:border-[#00629b]'}`}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-100 text-gray-500 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" /> Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-[2] flex items-center justify-center gap-2 bg-[#00629b] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#004b7a] transition-all group"
                  >
                    Próximo: Apoio <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 5: SUPPORT */}
            {step === RegistrationStep.SUPPORT && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-blue-50 p-6 rounded-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-white p-2 rounded-full shadow-sm">
                      <HeartHandshake className="w-6 h-6 text-[#00629b]" />
                    </div>
                    <h3 className="font-bold text-[#00629b] text-lg">Solicitação de Apoio</h3>
                  </div>

                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-blue-100 mb-2">
                    <span className="text-sm font-medium text-gray-700">Deseja preencher a Solicitação de Apoio para Baixa Renda ou Necessidades Especiais?</span>
                    <button
                      type="button"
                      onClick={() => setShowSupportForm(!showSupportForm)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00629b] focus:ring-offset-2 ${showSupportForm ? 'bg-[#00629b]' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showSupportForm ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <p className="text-xs text-blue-800/70 ml-1">
                    Suas respostas ajudarão a equipe a prover o suporte necessário.
                  </p>
                </div>

                {showSupportForm && (
                  <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">

                    {/* Security Notice */}
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                      <Lock className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-emerald-800 text-sm">Dados Seguros e Criptografados (LGPD)</h4>
                        <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                          Fique tranquilo! As informações fornecidas nesta etapa são <strong>criptografadas</strong> antes do envio e armazenadas com segurança.
                          O tratamento desses dados segue rigorosamente a Lei Geral de Proteção de Dados (LGPD), garantindo sigilo total e acesso restrito apenas para fins de concessão do auxílio.
                        </p>
                      </div>
                    </div>

                    {/* 1. Renda */}
                    <div className="space-y-3 p-4 border border-gray-100 rounded-xl">
                      <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        1. Critério de Auxílio Socioeconômico (Renda)
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Apoio à Participação e Permanência: Considerando os critérios de equidade da nossa organização (alinhados à UnB), você se enquadra no perfil de renda familiar bruta mensal igual ou inferior a 1 salário mínimo e meio por pessoa?
                        <br /><span className="italic text-[10px] text-gray-400">Nota: Esta informação é confidencial e utilizada apenas para viabilizar auxílios.</span>
                      </p>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="financial" value="Sim" checked={supportData.financial === 'Sim'} onChange={(e) => handleSupportChange('financial', e.target.value)} className="text-[#00629b] focus:ring-[#00629b]" />
                          <span className="text-sm text-gray-700">Sim</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="financial" value="Não" checked={supportData.financial === 'Não'} onChange={(e) => handleSupportChange('financial', e.target.value)} className="text-[#00629b] focus:ring-[#00629b]" />
                          <span className="text-sm text-gray-700">Não</span>
                        </label>
                      </div>
                    </div>

                    {/* 2. Físico */}
                    <div className="space-y-3 p-4 border border-gray-100 rounded-xl">
                      <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        2. Acessibilidade e Mobilidade (Físico)
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Para garantir que nossas reuniões e visitas técnicas sejam acessíveis a todos, você necessita de alguma adaptação física ou arquitetônica?
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="physical" value="Não" checked={supportData.physical === 'Não'} onChange={(e) => handleSupportChange('physical', e.target.value)} className="text-[#00629b] focus:ring-[#00629b]" />
                          <span className="text-sm text-gray-700">Não.</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="physical" value="Sim" checked={supportData.physical === 'Sim'} onChange={(e) => handleSupportChange('physical', e.target.value)} className="text-[#00629b] focus:ring-[#00629b]" />
                          <span className="text-sm text-gray-700">Sim.</span>
                        </label>
                        {supportData.physical === 'Sim' && (
                          <input
                            type="text"
                            placeholder="Por favor, indique a necessidade..."
                            value={supportData.physicalDetail}
                            onChange={(e) => handleSupportChange('physicalDetail', e.target.value)}
                            className="w-full mt-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00629b]"
                          />
                        )}
                      </div>
                    </div>

                    {/* 3. Neurodiversidade */}
                    <div className="space-y-3 p-4 border border-gray-100 rounded-xl">
                      <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        3. Suporte à Neurodiversidade e Produtividade
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Para otimizar sua produtividade e bem-estar, quais ajustes de comunicação seriam úteis para você?
                      </p>
                      <div className="space-y-2 mt-2">
                        <div className="mb-3">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Condição (Opcional)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: TDAH, Autismo, Dislexia..."
                            value={supportData.neurodiversityCondition}
                            onChange={(e) => handleSupportChange('neurodiversityCondition', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00629b] bg-white"
                          />
                        </div>

                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                          Pontos de Apoio
                        </label>
                        {['Receber pautas/prazos por escrito', 'Flexibilidade de entregas', 'Acesso a gravações', 'Ambiente com baixo estímulo'].map(opt => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={supportData.neurodiversity.includes(opt)}
                              onChange={() => handleNeurodiversityChange(opt)}
                              className="rounded text-[#00629b] focus:ring-[#00629b]"
                            />
                            <span className="text-sm text-gray-700">{opt}</span>
                          </label>
                        ))}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-sm text-gray-700 min-w-fit">Outro:</span>
                          <input
                            type="text"
                            value={supportData.neurodiversityOther}
                            onChange={(e) => handleSupportChange('neurodiversityOther', e.target.value)}
                            className="w-full px-2 py-1 text-sm border-b border-gray-200 focus:outline-none focus:border-[#00629b]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4. Técnico */}
                    <div className="space-y-3 p-4 border border-gray-100 rounded-xl">
                      <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        4. Recursos e Ferramentas (Assistência Técnica)
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Você necessita de algum software, hardware ou recurso de tecnologia assistiva específico?
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="technical" value="Não" checked={supportData.technical === 'Não'} onChange={(e) => handleSupportChange('technical', e.target.value)} className="text-[#00629b] focus:ring-[#00629b]" />
                          <span className="text-sm text-gray-700">Não.</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="technical" value="Sim" checked={supportData.technical === 'Sim'} onChange={(e) => handleSupportChange('technical', e.target.value)} className="text-[#00629b] focus:ring-[#00629b]" />
                          <span className="text-sm text-gray-700">Sim.</span>
                        </label>
                        {supportData.technical === 'Sim' && (
                          <input
                            type="text"
                            placeholder="Especifique o recurso..."
                            value={supportData.technicalDetail}
                            onChange={(e) => handleSupportChange('technicalDetail', e.target.value)}
                            className="w-full mt-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00629b]"
                          />
                        )}
                      </div>
                    </div>

                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-100 text-gray-500 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" /> Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] flex items-center justify-center gap-2 bg-[#00629b] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#004b7a] transition-all disabled:opacity-70"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Finalizar <CheckCircle2 className="w-5 h-5" /></>
                    )}
                  </button>
                </div>

              </div>
            )}

          </form>
        </div >
      </div >

      {/* Email Confirmation Modal */}
      {
        showEmailModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 p-3 rounded-full">
                    <Mail className="w-8 h-8 text-[#00629b]" />
                  </div>
                  <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmação de E-mail</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Este e-mail (<span className="font-semibold text-[#00629b]">{formData.email}</span>) será utilizado para comunicação oficial do IEEE e também para agendamento de eventos.
                  <br /><br />
                  <strong>Recomendamos o uso de um Gmail</strong> para melhor integração. Você confirma que vê esse e-mail com frequência?
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={confirmEmail}
                    className="w-full bg-[#00629b] text-white py-3 rounded-xl font-bold shadow-md hover:bg-[#004b7a] transition-all flex items-center justify-center gap-2"
                  >
                    Confirmar e Continuar <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="w-full bg-gray-50 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all border border-gray-200"
                  >
                    Alterar E-mail
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default RegistrationForm;
