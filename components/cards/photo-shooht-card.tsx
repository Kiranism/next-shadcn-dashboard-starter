'use client';
import { FC} from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Eye } from 'lucide-react';

interface CustomCardProps {
  coverImage: string;
  title: string;
  author: string;
  id: string;
}

const PhotoShootCard: FC<CustomCardProps> = ({ coverImage, title, author, id }) => {
  const router = useRouter();

  return (
    <Card className="m-4 w-80">
      <CardHeader className="p-0 relative">
        <div className="relative w-full h-48">
          <Image src={coverImage} alt={title} layout="fill" objectFit="cover" className="rounded-t-lg" />
        </div>
        <DropdownMenu modal={false} >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/photoshoot/${id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/photoshoot/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4 cursor-pointer" onClick={() => router.push(`/dashboard/photoshoot/${id}`)}>
        <CardTitle className="text-xl font-semibold mb-2">{title}</CardTitle>
        <p className="text-gray-700">{author}</p>
      </CardContent>
    </Card>
  );
};

export default PhotoShootCard;
