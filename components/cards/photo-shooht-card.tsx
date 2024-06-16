import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { FC } from 'react';
interface CustomCardProps {
    // image: string;
    title: string;
    author: string;
    coverImage:string;
  }
  
  const PhotoShootCard: FC<CustomCardProps> = ({ coverImage, title, author }) => {
  return (
    <Card className="m-4 w-80">
      <CardHeader className="p-0">
        <div className="relative w-full h-48">
          <Image src={coverImage} alt={title} layout="fill" objectFit="cover" className="rounded-t-lg" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-xl font-semibold mb-2">{title}</CardTitle>
        <p className="text-gray-700">{author}</p>
      </CardContent>
    </Card>
  );
};

export default PhotoShootCard;
