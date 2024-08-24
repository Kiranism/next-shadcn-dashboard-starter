import { CalendarDateRangePicker } from '@/components/date-range-picker';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

import { EnterIcon, SlashIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

export default function page() {
  return (
    <PageContainer scrollable={true}>
      <div className="space-y-5">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Students</h2>
          <div className="hidden items-center space-x-2 md:flex">
            <CalendarDateRangePicker />
          </div>
        </div>
        <small>
          In here you can find tools witch are designed to help students
        </small>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <SlashIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Students</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card className="w-[250px]">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center justify-between">
                <h3>Translate Your documents</h3>
              </div>
            </CardTitle>
            <CardDescription></CardDescription>
          </CardHeader>
          <CardContent>
            <img src="https://cdn-icons-png.flaticon.com/512/3263/3263116.png"></img>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="students/translate">
              <Button>
                Start Translating
                <EnterIcon style={{ marginLeft: 10 }}></EnterIcon>
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
}
