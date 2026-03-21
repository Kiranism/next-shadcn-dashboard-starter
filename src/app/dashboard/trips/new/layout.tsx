import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Neue Fahrt'
};

export default function NewTripLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
