import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { getDocsByCategory } from '@/lib/documentation';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

export default function DocumentationPage() {
  const categories = getDocsByCategory();

  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pt-6 md:p-8'>
      <div className='flex items-start justify-between'>
        <Heading
          title='Dokumentation'
          description='Hier findest du Erklärungen und Anleitungen zu den verschiedenen Funktionen des Systems.'
        />
      </div>
      <Separator />

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {Object.entries(categories).map(([category, docs]) => (
          <div key={category} className='space-y-4'>
            <h2 className='text-lg font-semibold tracking-tight'>{category}</h2>
            <div className='grid gap-4'>
              {docs.map((doc) => {
                const Icon =
                  (doc.icon && Icons[doc.icon as keyof typeof Icons]) ||
                  Icons.page;
                return (
                  <Link
                    key={doc.slug}
                    href={`/dashboard/documentation/${doc.slug}`}
                  >
                    <Card className='hover:bg-accent group cursor-pointer transition-colors'>
                      <CardHeader className='flex flex-row items-center gap-4 space-y-0 p-4'>
                        <div className='bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground rounded-full p-2 transition-colors'>
                          <Icon className='h-5 w-5' />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <CardTitle className='truncate text-base'>
                            {doc.title}
                          </CardTitle>
                          {doc.description && (
                            <CardDescription className='truncate text-xs'>
                              {doc.description}
                            </CardDescription>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
