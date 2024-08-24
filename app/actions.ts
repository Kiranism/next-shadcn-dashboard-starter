'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';

type LoginSignUpData = {
  email: string;
  password: string;
};

export async function login(formData: LoginSignUpData) {
  const supabase = createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  //   const data = {
  //     email: formData.email,
  //     password: formData.password
  //   }

  const { data, error } = await supabase.auth.signInWithPassword(formData);

  if (error) {
    redirect('/not-found');
  }

  revalidatePath('/dashboard', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: LoginSignUpData) {
  const supabase = createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.email,
    password: formData.password
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect('/error');
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
