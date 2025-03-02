'use client';

import React, { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ContentEditable } from '@/components/editor/editor-ui/content-editable';
import { editorTheme } from '@/components/editor/themes/editor-theme';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { Editor as TournamentEditor } from '@/app/dashboard/tournament/create/page';
import { toast } from 'sonner';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

const editorConfig = {
  namespace: 'MyEditor',
  theme: editorTheme,
  onError: (error: Error) => console.error(error)
};

interface EditorProps {
  onEditorChange?: (jsonString: string) => void;
}

export default function CreateTournamentPage() {
  const callApi = useApi();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [playersNumber, setPlayersNumber] = useState('');
  const [fullDescription, setFullDescription] = useState(''); // store JSON as string

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError(null);
      setIsLoading(true);

      // Convert to ISO 8601 strings
      const startDateISO = new Date(startDate).toISOString();
      const endDateISO = new Date(endDate).toISOString();

      // Convert the saved JSON string to an object for 'full_description'
      let fullDescObj = {};
      try {
        if (fullDescription) {
          fullDescObj = JSON.parse(fullDescription);
        }
      } catch (parseErr) {
        console.error('Failed to parse editor content', parseErr);
      }

      const payload = {
        name,
        description,
        images: [],
        start_date: startDateISO,
        end_date: endDateISO,
        players_number: Number(playersNumber),
        full_description: fullDescObj
      };

      // Call API
      const resp = await callApi('/tournament/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data?.message || 'Failed to create tournament');
      }

      // success toast
      toast.success('Tournament created successfully!');

      router.push('/dashboard/tournament/overview');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='mx-auto max-w-2xl p-4'>
      <h1 className='mb-4 text-2xl font-bold'>Create Tournament</h1>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='mb-1 block text-sm font-medium'>Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium'>Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
          />
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium'>
            Start Date/Time
          </label>
          <Input
            type='datetime-local'
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium'>
            End Date/Time
          </label>
          <Input
            type='datetime-local'
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium'>
            Players Number
          </label>
          <Input
            type='number'
            value={playersNumber}
            onChange={(e) => setPlayersNumber(e.target.value)}
            min={1}
            required
          />
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium'>
            Full Description
          </label>
          <TournamentEditor onEditorChange={setFullDescription} />
        </div>

        {error && <div className='text-sm text-destructive'>{error}</div>}

        <Button
          type='submit'
          className='bg-primary text-primary-foreground'
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Create'}
        </Button>
      </form>
    </div>
  );
}

function EditorToolbar() {
  const [editor] = useLexicalComposerContext();
  return (
    <div className='mb-2 space-x-2 border-b p-2'>
      <button
        type='button'
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        className='rounded border px-2 py-1'
      >
        Bold
      </button>
      <button
        type='button'
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        className='rounded border px-2 py-1'
      >
        Italic
      </button>
      <button
        type='button'
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        className='rounded border px-2 py-1'
      >
        Underline
      </button>
    </div>
  );
}

export function Editor({ onEditorChange }: EditorProps) {
  const [, setEditorStateJSON] = React.useState('');

  function handleChange(editorState: any) {
    const jsonString = JSON.stringify(editorState);
    setEditorStateJSON(jsonString);
    onEditorChange?.(jsonString);
  }

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <EditorToolbar />
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className='max-h-64 min-h-[150px] overflow-y-auto border p-2'
            placeholder='Type something here...'
          />
        }
        placeholder={
          <div className='p-2 text-muted-foreground'>
            Type something here...
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <OnChangePlugin onChange={handleChange} />
    </LexicalComposer>
  );
}
