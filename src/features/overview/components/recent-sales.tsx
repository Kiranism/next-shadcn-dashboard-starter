import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';

export function RecentSales() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>You made 265 sales this month.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          <div className='flex items-center'>
            <Avatar className='h-9 w-9'>
              <AvatarImage
                src='https://api.slingacademy.com/public/sample-users/1.png'
                alt='Avatar'
              />
              <AvatarFallback>OM</AvatarFallback>
            </Avatar>
            <div className='ml-4 space-y-1'>
              <p className='text-sm font-medium leading-none'>Olivia Martin</p>
              <p className='text-sm text-muted-foreground'>
                olivia.martin@email.com
              </p>
            </div>
            <div className='ml-auto font-medium'>+$1,999.00</div>
          </div>
          <div className='flex items-center'>
            <Avatar className='flex h-9 w-9 items-center justify-center space-y-0 border'>
              <AvatarImage
                src='https://api.slingacademy.com/public/sample-users/2.png'
                alt='Avatar'
              />
              <AvatarFallback>JL</AvatarFallback>
            </Avatar>
            <div className='ml-4 space-y-1'>
              <p className='text-sm font-medium leading-none'>Jackson Lee</p>
              <p className='text-sm text-muted-foreground'>
                jackson.lee@email.com
              </p>
            </div>
            <div className='ml-auto font-medium'>+$39.00</div>
          </div>
          <div className='flex items-center'>
            <Avatar className='h-9 w-9'>
              <AvatarImage
                src='https://api.slingacademy.com/public/sample-users/3.png'
                alt='Avatar'
              />
              <AvatarFallback>IN</AvatarFallback>
            </Avatar>
            <div className='ml-4 space-y-1'>
              <p className='text-sm font-medium leading-none'>
                Isabella Nguyen
              </p>
              <p className='text-sm text-muted-foreground'>
                isabella.nguyen@email.com
              </p>
            </div>
            <div className='ml-auto font-medium'>+$299.00</div>
          </div>
          <div className='flex items-center'>
            <Avatar className='h-9 w-9'>
              <AvatarImage
                src='https://api.slingacademy.com/public/sample-users/4.png'
                alt='Avatar'
              />
              <AvatarFallback>WK</AvatarFallback>
            </Avatar>
            <div className='ml-4 space-y-1'>
              <p className='text-sm font-medium leading-none'>William Kim</p>
              <p className='text-sm text-muted-foreground'>will@email.com</p>
            </div>
            <div className='ml-auto font-medium'>+$99.00</div>
          </div>
          <div className='flex items-center'>
            <Avatar className='h-9 w-9'>
              <AvatarImage
                src='https://api.slingacademy.com/public/sample-users/5.png'
                alt='Avatar'
              />
              <AvatarFallback>SD</AvatarFallback>
            </Avatar>
            <div className='ml-4 space-y-1'>
              <p className='text-sm font-medium leading-none'>Sofia Davis</p>
              <p className='text-sm text-muted-foreground'>
                sofia.davis@email.com
              </p>
            </div>
            <div className='ml-auto font-medium'>+$39.00</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
