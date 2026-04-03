import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  GOOGLE_CALENDAR_ACCESS_TOKEN_COOKIE,
  GOOGLE_CALENDAR_EXPIRES_AT_COOKIE,
  GOOGLE_CALENDAR_REFRESH_TOKEN_COOKIE,
  getGoogleOAuthClient,
} from '../../../google-calendar/oauth/_lib';

const CALENDAR_TIME_ZONE = process.env.GOOGLE_CALENDAR_TIME_ZONE || 'Africa/Addis_Ababa';

const calendarPlaceSchema = z.object({
  name: z.string().min(1),
  city: z.string().optional(),
  category: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
});

const exportRequestSchema = z.object({
  tripName: z.string().min(1).optional(),
  calendarId: z.string().min(1).optional(),
  places: z.array(calendarPlaceSchema).min(1)
});

type ExportRequestBody = z.infer<typeof exportRequestSchema>;

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map((segment) => Number(segment));
  return hours * 60 + minutes;
}

function ensureTimeRange(startTime: string, endTime: string) {
  if (timeToMinutes(endTime) > timeToMinutes(startTime)) {
    return { startTime, endTime };
  }

  const shiftedEnd = timeToMinutes(startTime) + 90;
  const hours = Math.floor((shiftedEnd % (24 * 60)) / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (shiftedEnd % 60).toString().padStart(2, '0');

  return {
    startTime,
    endTime: `${hours}:${minutes}`
  };
}

function toCalendarDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

function getCalendarClient(request: NextRequest) {
  const oauthClient = getGoogleOAuthClient(request);

  if (!oauthClient) {
    return null;
  }

  const accessToken = request.cookies.get(GOOGLE_CALENDAR_ACCESS_TOKEN_COOKIE)?.value || '';
  const refreshToken = request.cookies.get(GOOGLE_CALENDAR_REFRESH_TOKEN_COOKIE)?.value || '';
  const expiresAtRaw = request.cookies.get(GOOGLE_CALENDAR_EXPIRES_AT_COOKIE)?.value || '';
  const expiresAt = Number(expiresAtRaw);

  oauthClient.setCredentials({
    access_token: accessToken || undefined,
    refresh_token: refreshToken || undefined,
    expiry_date: Number.isFinite(expiresAt) ? expiresAt : undefined
  });

  return oauthClient;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExportRequestBody;
    const parsed = exportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid calendar export payload.' },
        { status: 400 }
      );
    }

    const auth = getCalendarClient(request);
    if (!auth) {
      return NextResponse.json(
        {
          error: 'Connect Google Calendar first to export these events.'
        },
        { status: 401 }
      );
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || parsed.data.calendarId || 'primary';
    const calendar = google.calendar({ version: 'v3', auth });
    const tripName = parsed.data.tripName || 'Trip itinerary';
    const places = parsed.data.places;

    const results = await Promise.allSettled(
      places.map((place, index) => {
        const { startTime, endTime } = ensureTimeRange(place.startTime, place.endTime);
        const eventDay = `${place.day ?? ''}`.trim();
        const location = [place.city, place.category].filter(Boolean).join(' · ');

        return calendar.events.insert({
          calendarId,
          sendUpdates: 'none',
          requestBody: {
            summary: `${tripName} - ${place.name}`,
            location: place.city,
            description: [
              `Trip: ${tripName}`,
              `Place: ${place.name}`,
              location ? `Details: ${location}` : null,
              eventDay ? `Day: ${eventDay}` : null,
              `Source order: ${index + 1}`
            ]
              .filter(Boolean)
              .join('\n'),
            start: {
              dateTime: toCalendarDateTime(place.date, startTime),
              timeZone: CALENDAR_TIME_ZONE
            },
            end: {
              dateTime: toCalendarDateTime(place.date, endTime),
              timeZone: CALENDAR_TIME_ZONE
            }
          }
        });
      })
    );

    const successfulResults = results.filter((result) => result.status === 'fulfilled');
    const failedResults = results.length - successfulResults.length;

    if (successfulResults.length === 0) {
      return NextResponse.json(
        { error: 'Google Calendar export failed for every event.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        failedResults > 0
          ? 'Google Calendar export completed with some skipped events.'
          : 'Google Calendar export completed successfully.',
      createdCount: successfulResults.length,
      failedCount: failedResults,
      calendarId
    });
  } catch (error) {
    console.error('Failed to export trip events to Google Calendar:', error);

    return NextResponse.json(
      { error: 'Failed to export trip events to Google Calendar.' },
      { status: 500 }
    );
  }
}