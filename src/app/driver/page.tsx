import { redirect } from 'next/navigation';

/**
 * /driver — redirects to the shift tracker.
 */
export default function DriverPage() {
  redirect('/driver/shift');
}
