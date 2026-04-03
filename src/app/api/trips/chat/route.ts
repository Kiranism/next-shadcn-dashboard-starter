import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { sortPlacesByTimeline } from '@/features/trips/lib/place-timeline';

type TripPlace = {
  name: string;
  city?: string;
  category?: string;
  lng: number;
  lat: number;
  image: string;
  day?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  loyaltyPoints?: number;
};

type ChatRequestBody = {
  query: string;
  taggedPlaceName?: string;
  places: TripPlace[];
  confirm?: boolean;
  pendingAction?: PendingAction;
};

type PlaceOperation = {
  target_name: string;
  action: 'update' | 'delete' | 'add';
  name?: string;
  city?: string;
  category?: string;
  day?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
};

type PendingAction = {
  action_type: 'update' | 'delete' | 'add' | 'none';
  summary: string;
  operations: PlaceOperation[];
};

type ChatResponsePayload = {
  assistant_message: string;
  needs_confirmation: boolean;
  action_type?: 'update' | 'delete' | 'add' | 'none';
  summary?: string;
  pending_action: PendingAction | null;
  places: TripPlace[];
  updates?: PlaceOperation[];
};

type PlaceUpdate = {
  target_name: string;
  name?: string;
  city?: string;
  category?: string;
  day?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
};

const CHAT_UPDATE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    assistant_message: { type: Type.STRING },
    needs_confirmation: { type: Type.BOOLEAN },
    action_type: {
      type: Type.STRING,
      enum: ['update', 'delete', 'add', 'none']
    },
    summary: { type: Type.STRING },
    updates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          target_name: { type: Type.STRING },
          action: {
            type: Type.STRING,
            enum: ['update', 'delete', 'add']
          },
          name: { type: Type.STRING },
          city: { type: Type.STRING },
          category: { type: Type.STRING },
          day: { type: Type.STRING },
          date: { type: Type.STRING },
          startTime: { type: Type.STRING },
          endTime: { type: Type.STRING }
        },
        required: ['target_name', 'action']
      }
    }
  },
  required: ['assistant_message', 'needs_confirmation', 'action_type', 'summary', 'updates']
};

function sanitizeDay(value: string | undefined, fallback: string): string {
  const allowedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (!value) return fallback;
  return allowedDays.includes(value) ? value : fallback;
}

function sanitizeDate(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const isValid = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return isValid ? value : fallback;
}

function sanitizeTime(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const isValid = /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  return isValid ? value : fallback;
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map((segment) => Number(segment));
  return hours * 60 + minutes;
}

function ensureRange(startTime: string, endTime: string) {
  if (timeToMinutes(endTime) > timeToMinutes(startTime)) {
    return { startTime, endTime };
  }

  const shifted = timeToMinutes(startTime) + 90;
  const h = Math.floor((shifted % (24 * 60)) / 60)
    .toString()
    .padStart(2, '0');
  const m = (shifted % 60).toString().padStart(2, '0');

  return {
    startTime,
    endTime: `${h}:${m}`
  };
}

function findPlaceIndex(places: TripPlace[], targetName: string): number {
  const exactIndex = places.findIndex((place) => place.name.toLowerCase() === targetName.toLowerCase());
  if (exactIndex >= 0) return exactIndex;

  return places.findIndex((place) => {
    const source = place.name.toLowerCase();
    const query = targetName.toLowerCase();
    return source.includes(query) || query.includes(source);
  });
}

function normalizePlaceUpdate(update: PlaceUpdate, current: TripPlace): TripPlace {
  const start = sanitizeTime(update.startTime, current.startTime || '09:00');
  const end = sanitizeTime(update.endTime, current.endTime || '10:30');
  const range = ensureRange(start, end);

  return {
    ...current,
    name: update.name?.trim() || current.name,
    city: update.city?.trim() || current.city,
    category: update.category?.trim() || current.category,
    day: sanitizeDay(update.day, current.day || 'Mon'),
    date: sanitizeDate(update.date, current.date || '2026-04-10'),
    startTime: range.startTime,
    endTime: range.endTime
  };
}

function createAddedPlace(operation: PlaceOperation, anchor: TripPlace, index: number): TripPlace {
  const imageByCategory: Record<string, string> = {
    activity: '/images/4.jpg',
    relaxation: '/images/5.jpg',
    food: '/images/3.jpg',
    accommodation: '/images/1.jpg'
  };

  const start = sanitizeTime(operation.startTime, anchor.startTime || '09:00');
  const end = sanitizeTime(operation.endTime, anchor.endTime || '10:30');
  const range = ensureRange(start, end);

  return {
    name: operation.name?.trim() || 'New Trip Event',
    city: operation.city?.trim() || anchor.city,
    category: operation.category?.trim() || 'activity',
    lng: Number((anchor.lng + 0.014 * (index + 1)).toFixed(6)),
    lat: Number((anchor.lat + 0.008 * (index + 1)).toFixed(6)),
    image:
      imageByCategory[(operation.category || 'activity').toLowerCase()] || anchor.image,
    day: sanitizeDay(operation.day, anchor.day || 'Mon'),
    date: sanitizeDate(operation.date, anchor.date || '2026-04-10'),
    startTime: range.startTime,
    endTime: range.endTime,
    loyaltyPoints: 25
  };
}

function applyPendingAction(places: TripPlace[], pendingAction: PendingAction): TripPlace[] {
  const nextPlaces = [...places];

  pendingAction.operations.forEach((operation) => {
    const index = findPlaceIndex(nextPlaces, operation.target_name);
    const anchor = index >= 0 ? nextPlaces[index] : nextPlaces[0];

    if (operation.action === 'delete') {
      if (index < 0) return;
      nextPlaces.splice(index, 1);
      return;
    }

    if (operation.action === 'add') {
      nextPlaces.push(
        createAddedPlace(
          operation,
          anchor || {
            name: 'Anchor',
            city: operation.city || 'Trip City',
            category: operation.category || 'activity',
            lng: 0,
            lat: 0,
            image: '/images/4.jpg',
            day: 'Mon',
            date: '2026-04-10',
            startTime: '09:00',
            endTime: '10:30'
          },
          nextPlaces.length
        )
      );
      return;
    }

    if (index < 0) return;

    nextPlaces[index] = normalizePlaceUpdate(operation, nextPlaces[index]);
  });

  return sortPlacesByTimeline(nextPlaces);
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing GEMINI_API_KEY on server environment.' },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ChatRequestBody;
    const query = body.query?.trim() || '';
    const places = Array.isArray(body.places) ? body.places : [];
    const taggedPlaceName = body.taggedPlaceName?.trim() || '';
    const confirm = Boolean(body.confirm);
    const pendingAction = body.pendingAction ?? null;

    if (confirm && pendingAction) {
      const nextPlaces = applyPendingAction(places, pendingAction);

      return NextResponse.json({
        assistant_message:
          pendingAction.action_type === 'delete'
            ? 'Deleted the selected place(s) from your trip.'
            : pendingAction.action_type === 'add'
              ? 'Added the requested place(s) to your trip.'
            : 'Applied your requested updates to the trip.',
        needs_confirmation: false,
        pending_action: null,
        places: nextPlaces
      } satisfies ChatResponsePayload);
    }

    if (!query || places.length === 0) {
      return NextResponse.json(
        { error: 'Missing query or places payload.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a trip operations assistant.
User request: ${query}
Tagged place (if any): ${taggedPlaceName || 'None'}

Current places:
${JSON.stringify(places)}

  Return concise assistant_message, needs_confirmation, action_type, summary, and updates.
Rules:
  - If the request updates, moves, renames, reschedules, adds, or deletes place(s), set needs_confirmation to true.
  - If the request is informational only, set action_type to none and needs_confirmation to false.
  - When deleting, set action_type to delete and use delete operations.
  - When adding a new event, set action_type to add and use add operations with name, city, category, day, date, startTime, and endTime.
  - When changing any place detail, set action_type to update and include only required field changes.
  - Use target_name that exists in current places.
  - For durations, adjust startTime/endTime.
  - Use day in Mon..Sun.
  - Use date format YYYY-MM-DD.
  - Use time format HH:mm (24h).
  - Never remove coordinates/image fields.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: CHAT_UPDATE_SCHEMA
      }
    });

    const parsed = JSON.parse(response.text || '{}') as ChatResponsePayload;
    const updates = Array.isArray(parsed.updates) ? parsed.updates : [];
    const pending: PendingAction = {
      action_type: parsed.action_type || 'none',
      summary: parsed.summary?.trim() || 'I found a trip change request.',
      operations: updates.map((update) => ({
        target_name: update.target_name,
        action: update.action,
        name: update.name,
        city: update.city,
        category: update.category,
        day: update.day,
        date: update.date,
        startTime: update.startTime,
        endTime: update.endTime
      }))
    };

    if (pending.action_type === 'none') {
      return NextResponse.json({
        assistant_message:
          parsed.assistant_message?.trim() || 'I can help update or remove places if you want.',
        needs_confirmation: false,
        pending_action: null,
        places: sortPlacesByTimeline(places)
      } satisfies ChatResponsePayload);
    }

    return NextResponse.json({
      assistant_message:
        parsed.assistant_message?.trim() ||
        `I found a ${pending.action_type} request. Do you want me to apply it?`,
      needs_confirmation: true,
      pending_action: pending,
      places: sortPlacesByTimeline(places)
    } satisfies ChatResponsePayload);
  } catch (error) {
    console.error('Failed to chat-update trip:', error);
    return NextResponse.json({ error: 'Failed to update trip from chat.' }, { status: 500 });
  }
}
