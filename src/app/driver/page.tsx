import { redirect } from 'next/navigation';

/**
 * /driver — redirects to the Startseite (home).
 */
export default function DriverPage() {
  redirect('/driver/startseite');
}
