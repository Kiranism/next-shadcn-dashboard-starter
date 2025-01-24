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
import FileUpload from './fileUpload';
import { CurrentUserContextType } from '@/@types/user';
import { UserContext } from '@/context/UserProvider';
import { useRouter, useSearchParams } from 'next/navigation';

import ClipLoader from 'react-spinners/ClipLoader';

import MDEditor from '@uiw/react-md-editor';
import { deleteBlog, getBlog, updateBlog } from '@/utils/blogs';

interface IBlog {
  title: string;
  tag: string;
  blockQuote: string;
  content: string;
}

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.'
  }),

  tag: z.string().min(1, {
    message: 'Please enter tags associated with the listing.'
  })
});

export default function EditBlogForm() {
  const { user } = React.useContext(UserContext) as CurrentUserContextType;
  const router = useRouter();

  const search = useSearchParams();
  const id = search.get('id');
  const [markdown, setMarkdown] = React.useState('');

  const [blog, setBlog] = React.useState<IBlog>();
  const [images, setImages] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [updateLoading, setUpdateLoading] = React.useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = React.useState<boolean>(false);

  const [file, setFile] = React.useState<Blob | string | null>(null);
  const [reRender, setReRender] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      tag: ''
    }
  });

  React.useEffect(() => {
    getBlog(id)
      .then((res: any) => {
        if (res.status === 200) {
          setLoading(false);
          setBlog(res?.data?.blog);
          form.reset({
            title: res?.data?.data?.title,

            tag: Array.isArray(res?.data?.data?.tag)
              ? res?.data?.data?.tag.join(', ')
              : res?.data?.data?.tag
          });
          setMarkdown(res?.data?.data?.content);
          setImages(res?.data?.data?.blogImage);
          // setListingImages(res?.data?.data?.blogImage);
        } else {
          router.push('/not-found');
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }, [form.reset]);

  React.useEffect(() => {
    document.body.style.overflow = 'auto'; // Ensure scrolling is enabled
  }, []);

  const fileImages = (images: any) => {
    setFile(images);
    setReRender((prevState) => !prevState);
  };
  function onSubmit(values: z.infer<typeof formSchema>) {
    setUpdateLoading(true);
    const { title, tag } = values;
    const formData = new FormData();
    formData.append('title', title);
    formData.append('tag', tag);
    formData.append('author', user?.userId);
    formData.append('content', markdown);

    formData.append('userId', user?.userId);
    if (file) {
      formData.append('blogImage', file);
    }

    updateBlog(formData, user?.token, id)
      .then((res) => {
        console.log(res);
        setUpdateLoading(false);
        router.back();
      })
      .catch((e) => {
        console.log(e);
      });
  }

  function handleDelete(): void {
    setDeleteLoading(true);
    deleteBlog(id, user?.token).then((res) => {
      router.back();
      setDeleteLoading(false);
    });
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Edit Post
        </CardTitle>
      </CardHeader>
      {!loading && (
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
                <FileUpload defaultImage={images} fileImages={fileImages} />
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
              <Button type="submit" disabled={updateLoading || deleteLoading}>
                Update Post
                <ClipLoader
                  color="white"
                  loading={updateLoading}
                  //cssOverride={override}
                  size={25}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              </Button>
              <Button
                type="submit"
                className="ms-5 bg-red-700"
                onClick={handleDelete}
                disabled={updateLoading || deleteLoading}
              >
                Delete Post
                <ClipLoader
                  color="white"
                  loading={deleteLoading}
                  //cssOverride={override}
                  size={25}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              </Button>
            </form>
          </Form>
        </CardContent>
      )}
      {loading && (
        <CardTitle className="ms-6 text-left text-2xl font-bold">
          Loading...
        </CardTitle>
      )}
    </Card>
  );
}
