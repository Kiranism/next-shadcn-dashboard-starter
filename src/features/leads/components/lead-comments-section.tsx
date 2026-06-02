'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { LeadsRepository } from '@/repositories/leads.repository';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { toUserMessage } from '@/lib/api-client';
import type { LeadComment } from '@/types/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

interface LeadCommentsSectionProps {
  leadId: string;
  comments: LeadComment[];
}

export function LeadCommentsSection({ leadId, comments }: LeadCommentsSectionProps) {
  const { profile, rank } = useUserProfile();
  const createComment = LeadsRepository.useCreateComment();
  const updateComment = LeadsRepository.useUpdateComment();
  const deleteComment = LeadsRepository.useDeleteComment();

  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  function handleCreate() {
    if (!newContent.trim()) return;
    createComment.mutate(
      { leadId, content: newContent.trim() },
      {
        onSuccess: () => {
          toast.success('Comentário adicionado.');
          setNewContent('');
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  function startEdit(comment: LeadComment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  function handleUpdate(commentId: string) {
    if (!editContent.trim()) return;
    updateComment.mutate(
      { leadId, commentId, content: editContent.trim() },
      {
        onSuccess: () => {
          toast.success('Comentário atualizado.');
          setEditingId(null);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  function handleDelete(commentId: string) {
    deleteComment.mutate(
      { leadId, commentId },
      {
        onSuccess: () => toast.success('Comentário removido.'),
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <div className='space-y-3'>
      <h3 className='text-sm font-semibold'>Comentários</h3>

      {/* Thread */}
      {comments.length === 0 ? (
        <p className='text-sm text-muted-foreground italic'>Nenhum comentário ainda.</p>
      ) : (
        <div className='space-y-3'>
          {comments.map((comment) => {
            const isOwn = comment.user_id === profile?.id;
            const canDelete = isOwn || rank > 0;

            const displayName = isOwn ? (profile?.name ?? comment.user_name) : comment.user_name;

            return (
              <div key={comment.id} className='group rounded-lg border bg-card p-3 space-y-1.5'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex items-center gap-1.5 min-w-0'>
                    {displayName && (
                      <span className='text-xs font-medium truncate'>{displayName}</span>
                    )}
                    {isOwn && (
                      <span className='text-xs font-bold text-muted-foreground shrink-0'>
                        (você)
                      </span>
                    )}
                    <span className='text-xs text-muted-foreground shrink-0'>
                      · {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <div className='flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                    {isOwn && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-6'
                        onClick={() => startEdit(comment)}
                        aria-label='Editar comentário'
                      >
                        <Icons.edit className='size-3' />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-6 text-destructive hover:text-destructive'
                        onClick={() => handleDelete(comment.id)}
                        aria-label='Remover comentário'
                        disabled={deleteComment.isPending}
                      >
                        <Icons.trash className='size-3' />
                      </Button>
                    )}
                  </div>
                </div>

                {editingId === comment.id ? (
                  <div className='space-y-2'>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      className='resize-none text-sm'
                      disabled={updateComment.isPending}
                    />
                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setEditingId(null)}
                        disabled={updateComment.isPending}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size='sm'
                        onClick={() => handleUpdate(comment.id)}
                        disabled={!editContent.trim() || updateComment.isPending}
                        isLoading={updateComment.isPending}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className='text-sm whitespace-pre-wrap'>{comment.content}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New comment */}
      <div className='space-y-2'>
        <Textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder='Escreva um comentário…'
          rows={2}
          className='resize-none text-sm'
          disabled={createComment.isPending}
        />
        <div className='flex justify-end'>
          <Button
            size='sm'
            onClick={handleCreate}
            disabled={!newContent.trim() || createComment.isPending}
            isLoading={createComment.isPending}
          >
            <Icons.send className='mr-1.5 size-3.5' />
            Comentar
          </Button>
        </div>
      </div>
    </div>
  );
}
