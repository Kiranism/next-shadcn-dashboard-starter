import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default function CtaGithub() {
  return (
    <Button
      variant='ghost'
      size='sm'
      className='group hidden sm:flex'
      nativeButton={false}
      aria-label='View on GitHub'
      render={
        <a
          aria-label='View on GitHub'
          href='https://github.com/Kiranism/next-shadcn-dashboard-starter'
          rel='noopener noreferrer'
          target='_blank'
          className='text-muted-foreground hover:text-foreground transition-colors duration-300'
        />
      }
    >
      <Icons.github className='transition-transform duration-300 group-hover:animate-bounce' />
    </Button>
  );
}
