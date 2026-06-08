import type { CreateApplicationPayload } from '@/types/selection-process';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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
    if (res.status < 500) {
      try {
        const json = await res.json();
        if (typeof json.message === 'string') message = json.message;
        else if (Array.isArray(json.message)) message = json.message.join(', ');
      } catch {}
    }
    throw new Error(message);
  }

  return res.json() as Promise<{ id: string; created_at: string }>;
}
