'use client';
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Heading } from '@/components/ui/heading';
import { createListing } from '@/utils/listings';
import { CurrentUserContextType } from '@/@types/user';
import { UserContext } from '@/context/UserProvider';
import { useRouter } from 'next/navigation';

import ClipLoader from 'react-spinners/ClipLoader';

import MDEditor from '@uiw/react-md-editor';
import FileUploadFive from '@/components/file-upload-five';
import { createBlog } from '@/utils/blogs';

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.'
  }),
  tag: z.string().min(1, {
    message: 'Please enter tags associated with the blog.'
  })
});

export default function CreateListingForm() {
  const { user } = React.useContext(UserContext) as CurrentUserContextType;
  const router = useRouter();

  const [markdown, setMarkdown] = React.useState('');

  function handleEditorChange({ html, text }: { html: string; text: string }) {
    setMarkdown(text);
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      tag: ''
    }
  });

  React.useEffect(() => {
    document.body.style.overflow = 'auto'; // Ensure scrolling is enabled
  }, []);

  const [listingImages, setListingImages] = React.useState([]);
  const [reRender, setReRender] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const fileImages = (images: any) => {
    setListingImages(images);
    setReRender((prevState) => !prevState);
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    console.log(values);
    const { title, tag } = values;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('tag', tag);
    formData.append('content', markdown);
    formData.append('author', user?.userId);
    formData.append('author', user?.userId);

    for (const image of listingImages) {
      formData.append('blogImage', image);
    }

    createBlog(formData, user?.token)
      .then((res) => {
        console.log(res);
        setLoading(false);
        router.back();
      })
      .catch((e) => {
        console.log(e);
      });
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">New Blog</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <Heading
                      title={'Tags'}
                      description=" Please enter tags associated with blog post."
                    />
                    <FormControl>
                      <Textarea placeholder="Enter tags" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <Heading
                title={'Blog Image'}
                description=" Please upload image for blog post. This is the main image that will be displayed."
              />
              <FileUploadFive fileImages={fileImages} />
            </div>
            <div data-color-mode="light">
              <Heading
                title={'Content'}
                description=" Please write content of blog post here."
              />
              <MDEditor
                value={markdown}
                onChange={(val) => setMarkdown(val || '')}
                height={'500px'}
              />
            </div>
            <Button type="submit" disabled={loading}>
              Submit
              <ClipLoader
                color="white"
                loading={loading}
                //cssOverride={override}
                size={25}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
