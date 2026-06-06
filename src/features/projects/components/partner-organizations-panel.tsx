/**
 * @file: partner-organizations-panel.tsx
 * @description: Управление B2B-организациями (сети фитнес-клубов) внутри проекта
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2, Network, Plus, Trash2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/composite/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PartnerUserCombobox } from './partner-user-combobox';

type PlanOption = { id: string; name: string };

type Organization = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  defaultReferralCommissionPlanId: string | null;
  directorUserId: string | null;
  defaultReferralCommissionPlan?: { id: string; name: string } | null;
  _count?: { members: number };
};

interface Props {
  projectId: string;
}

export function PartnerOrganizationsPanel({ projectId }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [defaultPlanId, setDefaultPlanId] = useState<string>('');
  const [directorUserId, setDirectorUserId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orgRes, planRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/organizations`),
        fetch(`/api/projects/${projectId}/referral-commission-plans`)
      ]);
      if (orgRes.ok) {
        const data = await orgRes.json();
        setOrganizations(data.organizations ?? []);
      }
      if (planRes.ok) {
        const data = await planRes.json();
        setPlans(
          (data.plans ?? []).map((p: { id: string; name: string }) => ({
            id: p.id,
            name: p.name
          }))
        );
      }
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить организации',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: 'Укажите название организации', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          defaultReferralCommissionPlanId: defaultPlanId || null,
          directorUserId: directorUserId || null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Не удалось создать');

      toast({ title: 'Организация создана' });
      setName('');
      setSlug('');
      setDescription('');
      setDefaultPlanId('');
      setDirectorUserId('');
      await load();
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Не удалось создать',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/organizations/${deleteTarget.id}`,
        { method: 'DELETE' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Не удалось удалить');
      toast({ title: 'Организация удалена' });
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Не удалось удалить',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Alert>
        <Building2 className='h-4 w-4' />
        <AlertTitle>Организации — сети внутри проекта</AlertTitle>
        <AlertDescription>
          Создайте отдельные сети (например, три фитнес-бренда). У каждой — свой
          директор, план комиссий и изолированная иерархия. Реферальные ссылки
          партнёров автоматически добавляют{' '}
          <code className='text-xs'>utm_org=slug</code>.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Plus className='h-5 w-5' />
            Новая организация
          </CardTitle>
          <CardDescription>
            Slug используется в ссылках и скрипте атрибуции на Tilda
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label>Название</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Сеть X-Fit Москва'
            />
          </div>
          <div className='space-y-2'>
            <Label>Slug (URL)</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder='xfit-moscow — опционально'
            />
          </div>
          <div className='space-y-2 md:col-span-2'>
            <Label>Описание</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className='space-y-2'>
            <Label>План комиссий по умолчанию</Label>
            <Select
              value={defaultPlanId || '__none__'}
              onValueChange={(v) => setDefaultPlanId(v === '__none__' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Не выбран' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='__none__'>Не выбран</SelectItem>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label>Директор сети</Label>
            <PartnerUserCombobox
              projectId={projectId}
              value={directorUserId}
              onChange={(user) => setDirectorUserId(user?.id ?? '')}
              partnerRolesOnly
              placeholder='Выберите директора…'
            />
          </div>
          <div className='md:col-span-2'>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Создать организацию
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-4'>
        {organizations.length === 0 ? (
          <Card>
            <CardContent className='text-muted-foreground py-10 text-center text-sm'>
              Организаций пока нет. Создайте первую сеть выше.
            </CardContent>
          </Card>
        ) : (
          organizations.map((org) => (
            <Card key={org.id}>
              <CardHeader className='flex flex-row items-start justify-between gap-4'>
                <div>
                  <CardTitle className='flex flex-wrap items-center gap-2'>
                    {org.name}
                    <Badge variant={org.isActive ? 'default' : 'secondary'}>
                      {org.isActive ? 'Активна' : 'Выключена'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className='mt-1'>
                    slug: <code>{org.slug}</code>
                    {' · '}
                    участников: {org._count?.members ?? 0}
                    {org.defaultReferralCommissionPlan && (
                      <>
                        {' · '}
                        план: {org.defaultReferralCommissionPlan.name}
                      </>
                    )}
                  </CardDescription>
                </div>
                <div className='flex shrink-0 gap-2'>
                  <Button variant='outline' size='sm' asChild>
                    <Link
                      href={`/dashboard/projects/${projectId}/referral/hierarchy?organizationId=${org.id}`}
                    >
                      <Network className='mr-2 h-4 w-4' />
                      Иерархия
                    </Link>
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setDeleteTarget(org)}
                  >
                    <Trash2 className='text-destructive h-4 w-4' />
                  </Button>
                </div>
              </CardHeader>
              {org.description && (
                <CardContent className='text-muted-foreground pt-0 text-sm'>
                  {org.description}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title='Удалить организацию?'
        description={
          deleteTarget
            ? `«${deleteTarget.name}» будет удалена. Участники останутся в проекте, но потеряют привязку к сети.`
            : ''
        }
        confirmLabel='Удалить'
        variant='destructive'
        onConfirm={handleDelete}
      />
    </div>
  );
}
