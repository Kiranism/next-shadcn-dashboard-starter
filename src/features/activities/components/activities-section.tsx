'use client';

import { useQueryState, parseAsString } from 'nuqs';
import { ActivityFormCard } from './activity-form-card';
import { ActivityCalendarCard } from './activity-calendar-card';

function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ActivitiesSection() {
  const [selectedDate, setSelectedDate] = useQueryState(
    'date',
    parseAsString.withDefault(todayISODate())
  );

  return (
    <div className='grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 lg:gap-6'>
      <ActivityFormCard selectedDate={selectedDate} />
      <ActivityCalendarCard selectedDate={selectedDate} onSelectDate={setSelectedDate} />
    </div>
  );
}
