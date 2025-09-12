'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'M' | 'F';
  complaint: string;
  priority: 'baixa' | 'media' | 'alta' | 'emergencia';
  arrivalTime: string;
  room?: string;
  status: 'triagem' | 'atendimento' | 'exames' | 'alta' | 'internacao';
  anamnese?: ExtendedAnamneseData;
}

// Extended interface for the new anamnesis structure
export interface ExtendedAnamneseData {
  // Context discriminator to specialize flows
  contextType: 'geral' | 'pronto-socorro' | 'ambulatorio' | 'enfermaria';
  paciente: {
    id: string;
    faixaEtaria: 'pediatrico' | 'adulto' | 'idoso' | '';
    sexoBiologico: 'M' | 'F' | '';
    gestante: boolean;
    telefone: string;
    consentimentoWhatsApp: boolean;
    timestamp: Date;
  };
  // Emergency triage information
  triage?: {
    manchesterLevel?: 1 | 2 | 3 | 4 | 5;
    arrivalTime?: string;
    chiefComplaintTriage?: string;
    vitalSignsOnArrival?: {
      pa?: string;
      fc?: string;
      fr?: string;
      temp?: string;
      sat?: string;
      glicemia?: string;
    };
    painScale?: number;
    consciousnessLevel?: 'A' | 'V' | 'P' | 'U' | 'GCS';
  };
  queixaPrincipal: {
    selectedComplaints: Record<string, boolean>;
    generatedText: string;
    duracaoSintomas: string;
    intensidade: number;
    caracteristicas: string[];
    fatoresAssociados: string[];
    observacoes: string;
  };
  historicoMedico: {
    comorbidades: string[];
    medicamentosUso: string[];
    alergias: string[];
    cirurgiasAnteriores: string[];
    historicoFamiliar: string[];
    habitosVida: string[];
  };
  exameFisico: {
    sinaisVitais: {
      pa: string;
      fc: string;
      fr: string;
      temp: string;
      sat: string;
      glicemia: string;
    };
    exameFisico: {
      aspectoGeral: string;
      cabecaPescoco: string;
      torax: string;
      cardiovascular: string;
      respiratorio: string;
      abdome: string;
      extremidades: string;
      neurologico: string;
    };
    observacoes: string;
  };
  // Timeline of vitals during stay/evolution
  vitalsTimeline?: Array<{
    timestamp: string; // ISO string
    pa?: string;
    fc?: string;
    fr?: string;
    temp?: string;
    sat?: string;
    glicemia?: string;
    painScale?: number;
    notes?: string;
  }>;
  medicamentos: {
    prescricaoAtual: Array<{
      medicamento: string;
      dose: string;
      via: string;
      frequencia: string;
      duracao: string;
      orientacoes: string;
    }>;
    medicamentosEmUso: string[];
  };
  avaliacaoConduta: {
    hipoteseDiagnostica: string[];
    condutaImediata: string[];
    examesSolicitados: string[];
    retorno: string;
    orientacoes: string[];
  };
  // Interventions performed with timestamps
  interventions?: Array<{
    timestamp: string; // ISO string
    type: string;
    details?: string;
  }>;
  // Disposition after care
  disposition?: {
    dischargeType?: 'alta' | 'internacao' | 'transferencia' | 'obito';
    followUpInstructions?: string;
    returnPrecautions?: string;
    dischargeTime?: string;
  };
  // Clinician block for medical-legal
  clinician?: {
    name: string;
    crm: string;
    specialty?: string;
    signature?: string; // base64 or text
  };
  // Consent metadata
  consent?: {
    informedConsent: boolean;
    consentDate?: string; // ISO date
    witnessName?: string;
    patientSignature?: string;
  };
}

interface MedicalContextType {
  // Anamnese estendida (novo formato)
  anamnesisData: ExtendedAnamneseData;
  updateAnamnesisData: (data: Partial<ExtendedAnamneseData>) => void;
  setContextType: (type: ExtendedAnamneseData['contextType']) => void;
  updateNestedAnamnesisData: <T extends keyof ExtendedAnamneseData>(
    section: T,
    field: keyof ExtendedAnamneseData[T],
    value: any
  ) => void;
  updateQueixaPrincipal: (
    data: Partial<ExtendedAnamneseData['queixaPrincipal']>
  ) => void;
  resetAnamnese: (contextType?: ExtendedAnamneseData['contextType']) => void;

  // Validação e exportação
  validateData: () => boolean;
  exportAnamnese: () => string;

  // Pacientes do kanban
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  removePatient: (id: string) => void;

  // Cores do sistema WellWave
  medicalColors: {
    // Cores primárias baseadas no logo WellWave
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;

    // Especialidades médicas com tons do azul WellWave
    cardiology: string;
    respiratory: string;
    neurology: string;
    gastro: string;
    endocrinology: string;
    orthopedics: string;
    dermatology: string;
    psychiatry: string;
    pediatrics: string;
    geriatrics: string;

    // Status médicos
    emergency: string;
    urgent: string;
    moderate: string;
    stable: string;
    success: string;
    warning: string;
    danger: string;
    info: string;

    // Gradientes oficiais
    gradients: {
      primary: string;
      secondary: string;
      accent: string;
      wave: string;
      soft: string;
      reverse: string;
      medical: string;
      emergency: string;
    };

    // Sombras médicas
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      glow: string;
      focus: string;
    };
  };
}

const createDefaultExtendedAnamnese = (
  type: ExtendedAnamneseData['contextType'] = 'geral'
): ExtendedAnamneseData => {
  const uniqueId = (() => {
    try {
      const g: any =
        typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
      if (g?.crypto && typeof g.crypto.randomUUID === 'function') {
        return `PAC-${g.crypto.randomUUID()}`;
      }
    } catch {}
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `PAC-${Date.now().toString().slice(-6)}-${rand}`;
  })();

  return {
    contextType: type,
    paciente: {
      id: uniqueId,
      faixaEtaria: '',
      sexoBiologico: '',
      gestante: false,
      telefone: '',
      consentimentoWhatsApp: false,
      timestamp: new Date()
    },
    triage: {},
    queixaPrincipal: {
      selectedComplaints: {},
      generatedText: '',
      duracaoSintomas: '',
      intensidade: 5,
      caracteristicas: [],
      fatoresAssociados: [],
      observacoes: ''
    },
    historicoMedico: {
      comorbidades: [],
      medicamentosUso: [],
      alergias: [],
      cirurgiasAnteriores: [],
      historicoFamiliar: [],
      habitosVida: []
    },
    exameFisico: {
      sinaisVitais: {
        pa: '',
        fc: '',
        fr: '',
        temp: '',
        sat: '',
        glicemia: ''
      },
      exameFisico: {
        aspectoGeral: '',
        cabecaPescoco: '',
        torax: '',
        cardiovascular: '',
        respiratorio: '',
        abdome: '',
        extremidades: '',
        neurologico: ''
      },
      observacoes: ''
    },
    vitalsTimeline: [],
    medicamentos: {
      prescricaoAtual: [],
      medicamentosEmUso: []
    },
    avaliacaoConduta: {
      hipoteseDiagnostica: [],
      condutaImediata: [],
      examesSolicitados: [],
      retorno: '',
      orientacoes: []
    },
    interventions: [],
    disposition: {},
    clinician: {
      name: '',
      crm: ''
    },
    consent: {
      informedConsent: false
    }
  };
};

const MedicalContext = createContext<MedicalContextType | undefined>(undefined);

export const MedicalProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [anamnesisData, setAnamnesisData] = useState<ExtendedAnamneseData>(() =>
    createDefaultExtendedAnamnese()
  );
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: '1',
      name: 'Maria Silva',
      age: 45,
      sex: 'F',
      complaint: 'Dor torácica',
      priority: 'alta',
      arrivalTime: '14:30',
      room: 'Sala 1',
      status: 'atendimento'
    },
    {
      id: '2',
      name: 'João Santos',
      age: 12,
      sex: 'M',
      complaint: 'Febre alta',
      priority: 'media',
      arrivalTime: '15:15',
      status: 'triagem'
    }
  ]);

  // 🌊 PALETA DE CORES MÉDICAS WELLWAVE (Baseada no Logo)
  const medicalColors = {
    // Cores primárias do logo WellWave
    primary: '#2E7CD6', // Azul principal do logo
    primaryLight: '#4A90E2', // Azul médio
    primaryDark: '#1E5BA8', // Azul profundo
    secondary: '#87CEEB', // Azul céu
    accent: '#E3F5FF', // Azul mais claro

    // Especialidades médicas com variações do azul WellWave
    cardiology: '#DC2626', // Vermelho para cardio (contraste)
    respiratory: '#059669', // Verde para respiratório
    neurology: '#7C3AED', // Roxo para neurologia
    gastro: '#D97706', // Laranja para gastro
    endocrinology: '#BE2EDD', // Rosa para endocrinologia
    orthopedics: '#0F3A6B', // Azul mais escuro para ortopedia
    dermatology: '#4A90E2', // Azul médio para dermatologia
    psychiatry: '#6366F1', // Índigo para psiquiatria
    pediatrics: '#2E7CD6', // Azul principal para pediatria
    geriatrics: '#1E5BA8', // Azul profundo para geriatria

    // Status médicos
    emergency: '#EF4444', // Vermelho emergência
    urgent: '#F59E0B', // Amarelo urgente
    moderate: '#2E7CD6', // Azul moderado (WellWave)
    stable: '#10B981', // Verde estável
    success: '#10B981', // Verde sucesso
    warning: '#F59E0B', // Amarelo aviso
    danger: '#EF4444', // Vermelho perigo
    info: '#2E7CD6', // Azul informativo (WellWave)

    // Gradientes oficiais do logo WellWave
    gradients: {
      primary: 'linear-gradient(135deg, #2E7CD6 0%, #4A90E2 50%, #87CEEB 100%)',
      secondary: 'linear-gradient(135deg, #87CEEB 0%, #E3F5FF 100%)',
      accent:
        'linear-gradient(135deg, #E3F5FF 0%, #87CEEB 25%, #4A90E2 50%, #2E7CD6 75%, #1E5BA8 100%)',
      wave: 'linear-gradient(135deg, #E3F5FF 0%, #87CEEB 25%, #4A90E2 50%, #2E7CD6 75%, #1E5BA8 100%)',
      soft: 'linear-gradient(180deg, #E3F5FF 0%, #87CEEB 50%, #4A90E2 100%)',
      reverse:
        'linear-gradient(135deg, #1E5BA8 0%, #2E7CD6 25%, #4A90E2 50%, #87CEEB 75%, #E3F5FF 100%)',
      medical: 'linear-gradient(45deg, #2E7CD6 0%, #10B981 100%)',
      emergency: 'linear-gradient(45deg, #EF4444 0%, #F59E0B 100%)'
    },

    // Sombras médicas WellWave
    shadows: {
      sm: '0 2px 4px rgba(30, 91, 168, 0.08)',
      md: '0 4px 8px rgba(30, 91, 168, 0.10)',
      lg: '0 8px 16px rgba(30, 91, 168, 0.12)',
      xl: '0 16px 32px rgba(30, 91, 168, 0.15)',
      glow: '0 0 40px rgba(74, 144, 226, 0.2)',
      focus: '0 0 0 4px rgba(74, 144, 226, 0.1)'
    }
  };

  const updateAnamnesisData = (data: Partial<ExtendedAnamneseData>) => {
    setAnamnesisData((prev) => ({ ...prev, ...data }));
  };

  const setContextType = (type: ExtendedAnamneseData['contextType']) => {
    updateAnamnesisData({ contextType: type });
  };

  const updateNestedAnamnesisData = <T extends keyof ExtendedAnamneseData>(
    section: T,
    field: keyof ExtendedAnamneseData[T],
    value: any
  ) => {
    setAnamnesisData((prev) => ({
      ...prev,
      [section]: {
        ...(((prev as any)[section] as any) || {}),
        [field]: value
      }
    }));
  };

  const updateQueixaPrincipal = (
    data: Partial<ExtendedAnamneseData['queixaPrincipal']>
  ) => {
    setAnamnesisData((prev) => ({
      ...prev,
      queixaPrincipal: {
        ...prev.queixaPrincipal,
        ...data
      }
    }));
  };

  const resetAnamnese = (contextType?: ExtendedAnamneseData['contextType']) => {
    setAnamnesisData(createDefaultExtendedAnamnese(contextType ?? 'geral'));
  };

  const validateData = (): boolean => {
    // Validate basic patient data
    const hasPatientData = !!(
      anamnesisData.paciente.faixaEtaria && anamnesisData.paciente.sexoBiologico
    );

    // Validate chief complaint
    const hasChiefComplaint =
      !!anamnesisData.queixaPrincipal.generatedText?.trim();

    // Validate at least one section with meaningful data
    const hasMedicalData = !!(
      anamnesisData.historicoMedico.comorbidades?.length ||
      anamnesisData.historicoMedico.medicamentosUso?.length ||
      anamnesisData.exameFisico.sinaisVitais.pa ||
      anamnesisData.exameFisico.sinaisVitais.fc ||
      anamnesisData.avaliacaoConduta.hipoteseDiagnostica?.length
    );

    return hasPatientData && hasChiefComplaint && hasMedicalData;
  };

  const exportAnamnese = (): string => {
    const {
      contextType,
      paciente,
      triage,
      vitalsTimeline,
      clinician,
      consent,
      queixaPrincipal,
      historicoMedico,
      exameFisico,
      medicamentos,
      avaliacaoConduta,
      interventions,
      disposition
    } = anamnesisData;

    let anamneseText = '';

    // Header com branding WellWave
    anamneseText += `🌊 WELLWAVE - ANAMNESE MÉDICA DIGITAL\n`;
    anamneseText += `=====================================\n`;
    // Contexto (linha solicitada)
    anamneseText += `Contexto: ${contextType || 'geral'}\n\n`;

    // Patient identification (anonymous)
    anamneseText += `📋 IDENTIFICAÇÃO PACIENTE:\n`;
    anamneseText += `ID: ${paciente.id}\n`;
    anamneseText += `Faixa Etária: ${paciente.faixaEtaria || 'Não informado'}\n`;
    anamneseText += `Sexo: ${paciente.sexoBiologico === 'M' ? 'Masculino' : paciente.sexoBiologico === 'F' ? 'Feminino' : 'Não informado'}\n`;
    if (paciente.sexoBiologico === 'F' && paciente.gestante) {
      anamneseText += `Gestante: ✓ Sim\n`;
    }
    if (paciente.telefone && paciente.consentimentoWhatsApp) {
      anamneseText += `Contato: ${paciente.telefone} (WhatsApp autorizado)\n`;
    }
    anamneseText += `Data/Hora: ${paciente.timestamp.toLocaleString('pt-BR')}\n\n`;

    // Emergency triage (if present)
    if (
      triage &&
      (triage.manchesterLevel ||
        triage.arrivalTime ||
        triage.chiefComplaintTriage)
    ) {
      anamneseText += `🚨 TRIAGEM (Manchester):\n`;
      if (typeof triage.manchesterLevel !== 'undefined')
        anamneseText += `Prioridade: ${triage.manchesterLevel}\n`;
      if (triage.arrivalTime)
        anamneseText += `Chegada: ${triage.arrivalTime}\n`;
      if (triage.chiefComplaintTriage)
        anamneseText += `Queixa na triagem: ${triage.chiefComplaintTriage}\n`;
      const v = triage.vitalSignsOnArrival || ({} as any);
      if (v.pa || v.fc || v.fr || v.temp || v.sat || v.glicemia) {
        anamneseText += `Sinais vitais na chegada:\n`;
        if (v.pa) anamneseText += `  • PA: ${v.pa} mmHg\n`;
        if (v.fc) anamneseText += `  • FC: ${v.fc} bpm\n`;
        if (v.fr) anamneseText += `  • FR: ${v.fr} irpm\n`;
        if (v.temp) anamneseText += `  • T°: ${v.temp}°C\n`;
        if (v.sat) anamneseText += `  • SatO2: ${v.sat}%\n`;
        if (v.glicemia) anamneseText += `  • Glicemia: ${v.glicemia} mg/dL\n`;
      }
      if (typeof triage.painScale === 'number')
        anamneseText += `Dor (0-10): ${triage.painScale}\n`;
      if (triage.consciousnessLevel)
        anamneseText += `Nível de consciência: ${triage.consciousnessLevel}\n`;
      anamneseText += `\n`;
    }

    // Chief complaint
    if (queixaPrincipal.generatedText) {
      anamneseText += `🔍 QUEIXA PRINCIPAL:\n`;
      anamneseText += `${queixaPrincipal.generatedText}\n`;
      if (queixaPrincipal.duracaoSintomas) {
        anamneseText += `Duração: ${queixaPrincipal.duracaoSintomas}\n`;
      }
      if (queixaPrincipal.intensidade) {
        anamneseText += `Intensidade: ${queixaPrincipal.intensidade}/10\n`;
      }
      if (queixaPrincipal.caracteristicas.length) {
        anamneseText += `Características: ${queixaPrincipal.caracteristicas.join(', ')}\n`;
      }
      if (queixaPrincipal.fatoresAssociados.length) {
        anamneseText += `Fatores associados: ${queixaPrincipal.fatoresAssociados.join(', ')}\n`;
      }
      if (queixaPrincipal.observacoes) {
        anamneseText += `Observações: ${queixaPrincipal.observacoes}\n`;
      }
      anamneseText += `\n`;
    }

    // Medical history
    anamneseText += `📚 HISTÓRIA MÉDICA:\n`;
    if (historicoMedico.comorbidades.length) {
      anamneseText += `Comorbidades: ${historicoMedico.comorbidades.join(', ')}\n`;
    } else {
      anamneseText += `Comorbidades: Nega antecedentes patológicos relevantes\n`;
    }
    if (historicoMedico.medicamentosUso.length) {
      anamneseText += `Medicamentos em uso: ${historicoMedico.medicamentosUso.join(', ')}\n`;
    } else {
      anamneseText += `Medicamentos: Não faz uso de medicações contínuas\n`;
    }
    if (historicoMedico.alergias.length) {
      anamneseText += `Alergias: ${historicoMedico.alergias.join(', ')}\n`;
    } else {
      anamneseText += `Alergias: Nega alergias conhecidas\n`;
    }
    if (historicoMedico.cirurgiasAnteriores.length) {
      anamneseText += `Cirurgias anteriores: ${historicoMedico.cirurgiasAnteriores.join(', ')}\n`;
    }
    if (historicoMedico.habitosVida.length) {
      anamneseText += `Hábitos de vida: ${historicoMedico.habitosVida.join(', ')}\n`;
    }
    anamneseText += `\n`;

    // Physical examination
    anamneseText += `🩺 EXAME FÍSICO:\n`;
    const sv = exameFisico.sinaisVitais;
    if (sv.pa || sv.fc || sv.fr || sv.temp || sv.sat || sv.glicemia) {
      anamneseText += `Sinais vitais:\n`;
      if (sv.pa) anamneseText += `  • PA: ${sv.pa} mmHg\n`;
      if (sv.fc) anamneseText += `  • FC: ${sv.fc} bpm\n`;
      if (sv.fr) anamneseText += `  • FR: ${sv.fr} irpm\n`;
      if (sv.temp) anamneseText += `  • T°: ${sv.temp}°C\n`;
      if (sv.sat) anamneseText += `  • SatO2: ${sv.sat}%\n`;
      if (sv.glicemia) anamneseText += `  • Glicemia: ${sv.glicemia} mg/dL\n`;
      anamneseText += `\n`;
    }

    const ef = exameFisico.exameFisico;
    if (ef.aspectoGeral) anamneseText += `Aspecto geral: ${ef.aspectoGeral}\n`;
    if (ef.cardiovascular)
      anamneseText += `Cardiovascular: ${ef.cardiovascular}\n`;
    if (ef.respiratorio) anamneseText += `Respiratório: ${ef.respiratorio}\n`;
    if (ef.abdome) anamneseText += `Abdome: ${ef.abdome}\n`;
    if (ef.neurologico) anamneseText += `Neurológico: ${ef.neurologico}\n`;
    if (exameFisico.observacoes)
      anamneseText += `Observações: ${exameFisico.observacoes}\n`;
    anamneseText += `\n`;

    // Vitals timeline (if present)
    if (vitalsTimeline && vitalsTimeline.length) {
      anamneseText += `📈 EVOLUÇÃO DOS SINAIS VITAIS:\n`;
      vitalsTimeline.forEach((entry, idx) => {
        anamneseText += `${idx + 1}. ${entry.timestamp}`;
        const fields = [
          entry.pa && `PA ${entry.pa} mmHg`,
          entry.fc && `FC ${entry.fc} bpm`,
          entry.fr && `FR ${entry.fr} irpm`,
          entry.temp && `T° ${entry.temp}°C`,
          entry.sat && `SatO2 ${entry.sat}%`,
          entry.glicemia && `Glicemia ${entry.glicemia} mg/dL`
        ].filter(Boolean);
        if (fields.length) anamneseText += ` — ${fields.join(' | ')}`;
        if (typeof entry.painScale === 'number')
          anamneseText += ` — Dor: ${entry.painScale}/10`;
        if (entry.notes) anamneseText += ` — ${entry.notes}`;
        anamneseText += `\n`;
      });
      anamneseText += `\n`;
    }

    // Medications
    if (medicamentos.prescricaoAtual.length) {
      anamneseText += `💊 PRESCRIÇÃO MÉDICA:\n`;
      medicamentos.prescricaoAtual.forEach((med, index) => {
        if (med.medicamento) {
          anamneseText += `${index + 1}. ${med.medicamento}`;
          if (med.dose) anamneseText += ` ${med.dose}`;
          anamneseText += `\n`;
          if (med.via || med.frequencia) {
            anamneseText += `   `;
            if (med.via) anamneseText += `Via: ${med.via}`;
            if (med.via && med.frequencia) anamneseText += ` | `;
            if (med.frequencia) anamneseText += `Frequência: ${med.frequencia}`;
            anamneseText += `\n`;
          }
          if (med.duracao) anamneseText += `   Duração: ${med.duracao}\n`;
          if (med.orientacoes)
            anamneseText += `   Orientações: ${med.orientacoes}\n`;
          anamneseText += `\n`;
        }
      });
    }

    // Interventions (if any)
    if (interventions && interventions.length) {
      anamneseText += `🛠️ INTERVENÇÕES REALIZADAS:\n`;
      interventions.forEach((it, i) => {
        anamneseText += `${i + 1}. ${it.timestamp} — ${it.type}`;
        if (it.details) anamneseText += `: ${it.details}`;
        anamneseText += `\n`;
      });
      anamneseText += `\n`;
    }

    // Assessment and plan
    anamneseText += `⚕️ AVALIAÇÃO E CONDUTA:\n`;
    if (avaliacaoConduta.hipoteseDiagnostica.length) {
      anamneseText += `Hipótese diagnóstica: ${avaliacaoConduta.hipoteseDiagnostica.join(', ')}\n`;
    }
    if (avaliacaoConduta.condutaImediata.length) {
      anamneseText += `Conduta imediata: ${avaliacaoConduta.condutaImediata.join(', ')}\n`;
    }
    if (avaliacaoConduta.examesSolicitados.length) {
      anamneseText += `Exames solicitados: ${avaliacaoConduta.examesSolicitados.join(', ')}\n`;
    }
    if (avaliacaoConduta.retorno) {
      anamneseText += `Retorno: ${avaliacaoConduta.retorno}\n`;
    }
    if (avaliacaoConduta.orientacoes.length) {
      anamneseText += `Orientações: ${avaliacaoConduta.orientacoes.join(', ')}\n`;
    }

    // Disposition (if any)
    if (
      disposition &&
      (disposition.dischargeType ||
        disposition.followUpInstructions ||
        disposition.returnPrecautions)
    ) {
      anamneseText += `🚪 DESFECHO/ALTA:\n`;
      if (disposition.dischargeType)
        anamneseText += `Tipo: ${disposition.dischargeType}\n`;
      if (disposition.dischargeTime)
        anamneseText += `Horário: ${disposition.dischargeTime}\n`;
      if (disposition.followUpInstructions)
        anamneseText += `Acompanhamento: ${disposition.followUpInstructions}\n`;
      if (disposition.returnPrecautions)
        anamneseText += `Sinais de alarme: ${disposition.returnPrecautions}\n`;
      anamneseText += `\n`;
    }

    // Footer
    anamneseText += `\n`;
    anamneseText += `🌊 Documento gerado pelo WellWave Medical System\n`;
    anamneseText += `📅 ${new Date().toLocaleString('pt-BR')}\n`;
    anamneseText += `🔒 Sistema que preserva privacidade médica\n`;
    if (clinician && (clinician.name || clinician.crm || clinician.specialty)) {
      anamneseText += `\n👩‍⚕️ Profissional responsável:\n`;
      if (clinician.name) anamneseText += `Nome: ${clinician.name}\n`;
      if (clinician.crm) anamneseText += `CRM: ${clinician.crm}\n`;
      if (clinician.specialty)
        anamneseText += `Especialidade: ${clinician.specialty}\n`;
    }
    if (
      consent &&
      (consent.informedConsent ||
        consent.patientSignature ||
        consent.witnessName)
    ) {
      anamneseText += `\n✅ Consentimento e registros:\n`;
      anamneseText += `Consentimento informado: ${consent.informedConsent ? 'Sim' : 'Não'}\n`;
      if (consent.consentDate)
        anamneseText += `Data do consentimento: ${consent.consentDate}\n`;
      if (consent.witnessName)
        anamneseText += `Testemunha: ${consent.witnessName}\n`;
    }

    return anamneseText;
  };

  const addPatient = (patient: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...patient,
      id: Date.now().toString()
    };
    setPatients((prev) => [...prev, newPatient]);
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((patient) =>
        patient.id === id ? { ...patient, ...updates } : patient
      )
    );
  };

  const removePatient = (id: string) => {
    setPatients((prev) => prev.filter((patient) => patient.id !== id));
  };

  return (
    <MedicalContext.Provider
      value={{
        anamnesisData,
        updateAnamnesisData,
        setContextType,
        updateNestedAnamnesisData,
        updateQueixaPrincipal,
        resetAnamnese,
        validateData,
        exportAnamnese,
        patients,
        addPatient,
        updatePatient,
        removePatient,
        medicalColors
      }}
    >
      {children}
    </MedicalContext.Provider>
  );
};

export const useMedical = () => {
  const context = useContext(MedicalContext);
  if (context === undefined) {
    throw new Error('useMedical must be used within a MedicalProvider');
  }
  return context;
};
