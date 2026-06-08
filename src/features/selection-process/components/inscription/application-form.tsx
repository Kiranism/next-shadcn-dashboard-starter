'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { createClient } from '@/utils/supabase/client';
import { uploadApplicationFiles } from '../../lib/upload-application-files';
import { submitApplication } from '../../lib/api-public';
import { SuccessScreen } from './success-screen';
import { NoActiveProcess } from './no-active-process';

const ACCEPTED_PDF = ['application/pdf'];
const ACCEPTED_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  course: z.string().min(2, 'Curso obrigatório'),
  period: z.coerce.number().int().min(1, 'Período inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido'),
  instagram: z.string().min(1, 'Instagram obrigatório'),
  how_heard: z.string().min(2, 'Campo obrigatório'),
  motivation: z.string().min(10, 'Conte um pouco mais sobre sua motivação'),
  why_watt: z.string().min(10, 'Conte um pouco mais sobre o motivo'),
  shirt_size: z.enum(['P', 'M', 'G', 'GG', 'XG'])
});

type FormValues = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL: FormValues = {
  name: '',
  course: '',
  period: 1,
  phone: '',
  email: '',
  instagram: '',
  how_heard: '',
  motivation: '',
  why_watt: '',
  shirt_size: 'M'
};

function FileField({
  label,
  accept,
  file,
  onChange,
  error
}: {
  label: string;
  accept: string[];
  file: File | null;
  onChange: (f: File | null, err: string) => void;
  error?: string;
}) {
  return (
    <div className='space-y-1.5'>
      <Label>{label} *</Label>
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors hover:bg-muted/50 ${error ? 'border-destructive' : 'border-border'}`}
      >
        <input
          type='file'
          className='sr-only'
          accept={accept.join(',')}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (!f) return onChange(null, '');
            if (!accept.includes(f.type)) return onChange(null, 'Formato inválido');
            if (f.size > MAX_SIZE) return onChange(null, 'Arquivo excede 10 MB');
            onChange(f, '');
          }}
        />
        {file ? (
          <>
            <Icons.check className='size-5 text-emerald-600' />
            <span className='text-sm font-medium text-emerald-700 dark:text-emerald-400 truncate max-w-[180px]'>
              {file.name}
            </span>
          </>
        ) : (
          <>
            <Icons.upload className='size-5 text-muted-foreground' />
            <span className='text-sm text-muted-foreground'>
              Clique para selecionar
              <br />
              <span className='text-xs'>
                {accept.includes('application/pdf') ? 'PDF' : 'JPG, PNG ou WebP'} · máx. 10 MB
              </span>
            </span>
          </>
        )}
      </label>
      {error && <p className='text-destructive text-xs'>{error}</p>}
    </div>
  );
}

export function ApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState({ resume: '', transcript: '', photo: '' });

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function validate(): boolean {
    const result = schema.safeParse(values);
    if (!result.success) {
      const errs: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
    }
    const fileErrs = { resume: '', transcript: '', photo: '' };
    if (!resumeFile) fileErrs.resume = 'Currículo obrigatório (PDF)';
    if (!transcriptFile) fileErrs.transcript = 'Histórico obrigatório (PDF)';
    if (!photoFile) fileErrs.photo = 'Foto obrigatória (imagem)';
    setFileErrors(fileErrs);
    return result.success && !fileErrs.resume && !fileErrs.transcript && !fileErrs.photo;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setServerError('');

    try {
      const supabase = createClient();
      const { resumePath, transcriptPath, photoPath } = await uploadApplicationFiles(
        resumeFile!,
        transcriptFile!,
        photoFile!,
        supabase
      );
      await submitApplication({
        ...values,
        resume_path: resumePath,
        transcript_path: transcriptPath,
        photo_path: photoPath
      });
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) return <SuccessScreen />;
  if (serverError === 'Não há processo seletivo ativo no momento.') return <NoActiveProcess />;

  return (
    <form onSubmit={handleSubmit} className='space-y-8'>
      {/* Dados Pessoais */}
      <section className='space-y-4'>
        <div>
          <h2 className='text-base font-semibold'>Dados Pessoais</h2>
          <p className='text-muted-foreground text-sm'>Suas informações de contato</p>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-1.5 sm:col-span-2'>
            <Label htmlFor='name'>Nome completo *</Label>
            <Input
              id='name'
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder='Seu nome completo'
            />
            {fieldErrors.name && <p className='text-destructive text-xs'>{fieldErrors.name}</p>}
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='email'>E-mail *</Label>
            <Input
              id='email'
              type='email'
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder='seu@email.com'
            />
            {fieldErrors.email && <p className='text-destructive text-xs'>{fieldErrors.email}</p>}
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='phone'>Telefone *</Label>
            <Input
              id='phone'
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder='(11) 99999-0000'
            />
            {fieldErrors.phone && <p className='text-destructive text-xs'>{fieldErrors.phone}</p>}
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='instagram'>Instagram *</Label>
            <Input
              id='instagram'
              value={values.instagram}
              onChange={(e) => set('instagram', e.target.value)}
              placeholder='@seuinstagram'
            />
            {fieldErrors.instagram && (
              <p className='text-destructive text-xs'>{fieldErrors.instagram}</p>
            )}
          </div>
          <div className='space-y-1.5'>
            <Label>Tamanho de camiseta *</Label>
            <Select
              value={values.shirt_size}
              onValueChange={(v) => set('shirt_size', v as FormValues['shirt_size'])}
            >
              <SelectTrigger>
                <SelectValue placeholder='Selecione' />
              </SelectTrigger>
              <SelectContent>
                {(['P', 'M', 'G', 'GG', 'XG'] as const).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.shirt_size && (
              <p className='text-destructive text-xs'>{fieldErrors.shirt_size}</p>
            )}
          </div>
        </div>
      </section>

      {/* Formação */}
      <section className='space-y-4'>
        <div>
          <h2 className='text-base font-semibold'>Formação</h2>
          <p className='text-muted-foreground text-sm'>Dados acadêmicos</p>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-1.5 sm:col-span-2'>
            <Label htmlFor='course'>Curso *</Label>
            <Input
              id='course'
              value={values.course}
              onChange={(e) => set('course', e.target.value)}
              placeholder='Ex.: Engenharia Elétrica'
            />
            {fieldErrors.course && <p className='text-destructive text-xs'>{fieldErrors.course}</p>}
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='period'>Período atual *</Label>
            <Input
              id='period'
              type='number'
              min={1}
              value={values.period}
              onChange={(e) => set('period', Number(e.target.value))}
              placeholder='Ex.: 4'
            />
            {fieldErrors.period && <p className='text-destructive text-xs'>{fieldErrors.period}</p>}
          </div>
        </div>
      </section>

      {/* Motivação */}
      <section className='space-y-4'>
        <div>
          <h2 className='text-base font-semibold'>Motivação</h2>
          <p className='text-muted-foreground text-sm'>Conte-nos um pouco sobre você</p>
        </div>
        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='how_heard'>Como você ficou sabendo da Watt? *</Label>
            <Input
              id='how_heard'
              value={values.how_heard}
              onChange={(e) => set('how_heard', e.target.value)}
              placeholder='Ex.: Indicação de um amigo'
            />
            {fieldErrors.how_heard && (
              <p className='text-destructive text-xs'>{fieldErrors.how_heard}</p>
            )}
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='motivation'>Por que você quer participar da Watt? *</Label>
            <Textarea
              id='motivation'
              value={values.motivation}
              onChange={(e) => set('motivation', e.target.value)}
              rows={4}
              placeholder='Fale sobre sua motivação e o que espera aprender...'
            />
            {fieldErrors.motivation && (
              <p className='text-destructive text-xs'>{fieldErrors.motivation}</p>
            )}
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='why_watt'>Por que você se encaixa na Watt? *</Label>
            <Textarea
              id='why_watt'
              value={values.why_watt}
              onChange={(e) => set('why_watt', e.target.value)}
              rows={4}
              placeholder='Fale sobre suas habilidades e como elas se alinham com a Watt...'
            />
            {fieldErrors.why_watt && (
              <p className='text-destructive text-xs'>{fieldErrors.why_watt}</p>
            )}
          </div>
        </div>
      </section>

      {/* Documentos */}
      <section className='space-y-4'>
        <div>
          <h2 className='text-base font-semibold'>Documentos</h2>
          <p className='text-muted-foreground text-sm'>Envie seus arquivos em PDF ou imagem</p>
        </div>
        <div className='grid gap-4 sm:grid-cols-3'>
          <FileField
            label='Currículo'
            accept={ACCEPTED_PDF}
            file={resumeFile}
            onChange={(f, err) => {
              setResumeFile(f);
              setFileErrors((p) => ({ ...p, resume: err }));
            }}
            error={fileErrors.resume}
          />
          <FileField
            label='Histórico Escolar'
            accept={ACCEPTED_PDF}
            file={transcriptFile}
            onChange={(f, err) => {
              setTranscriptFile(f);
              setFileErrors((p) => ({ ...p, transcript: err }));
            }}
            error={fileErrors.transcript}
          />
          <FileField
            label='Foto'
            accept={ACCEPTED_IMAGE}
            file={photoFile}
            onChange={(f, err) => {
              setPhotoFile(f);
              setFileErrors((p) => ({ ...p, photo: err }));
            }}
            error={fileErrors.photo}
          />
        </div>
      </section>

      {serverError && (
        <div className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
          {serverError}
        </div>
      )}

      <Button type='submit' className='w-full' size='lg' disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Icons.spinner className='mr-2 size-4 animate-spin' />
            Enviando candidatura...
          </>
        ) : (
          <>
            <Icons.send className='mr-2 size-4' />
            Enviar Candidatura
          </>
        )}
      </Button>
    </form>
  );
}
