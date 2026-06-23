import type {
  CreateApplicationPayload,
  AvailableInterviewSlot,
  InterviewBooking,
  BookInterviewPayload
} from '@/types/selection-process';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  if (res.status >= 500) return fallback;
  try {
    const json = await res.json();
    if (typeof json.message === 'string') return json.message;
    if (Array.isArray(json.message)) return json.message.join(', ');
  } catch {}
  return fallback;
}

export async function submitApplication(
  payload: CreateApplicationPayload
): Promise<{ id: string; created_at: string }> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/selection-process/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
  }

  if (!res.ok) {
    let message = 'Ocorreu um erro inesperado. Tente novamente.';
    if (res.status === 404) message = 'Não há processo seletivo ativo no momento.';
    if (res.status === 409)
      message = 'Já existe uma candidatura com este e-mail neste processo seletivo.';
    message = await parseErrorMessage(res, message);
    throw new Error(message);
  }

  return res.json() as Promise<{ id: string; created_at: string }>;
}

export async function getAvailableInterviewSlots(): Promise<AvailableInterviewSlot[]> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/selection-process/interviews`);
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
  }

  if (!res.ok) {
    throw new Error('Não foi possível carregar os horários disponíveis.');
  }

  return res.json() as Promise<AvailableInterviewSlot[]>;
}

export async function bookInterview(payload: BookInterviewPayload): Promise<InterviewBooking> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/selection-process/interviews`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
  }

  if (!res.ok) {
    let message = 'Ocorreu um erro inesperado. Tente novamente.';
    if (res.status === 401) message = 'Link inválido ou expirado.';
    if (res.status === 409)
      message = 'Você já possui uma entrevista agendada ou o horário não está mais disponível.';
    message = await parseErrorMessage(res, message);
    throw new Error(message);
  }

  return res.json() as Promise<InterviewBooking>;
}
