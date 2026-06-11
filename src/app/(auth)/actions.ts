'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { loginUser, logoutUser, signUpUser } from '@/utils/auth-server'

export async function emailLogin(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  // Simple local validation for testing offline
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." }
  }

  try {
    await loginUser(email);
  } catch (err: any) {
    return { error: err.message || "An error occurred during sign in." }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logOut() {
  await logoutUser();
  redirect('/login')
}

export async function resetPassword(prevState: any, formData: FormData) {
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!newPassword || !confirmPassword) {
    return { error: "All fields are required." }
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match." }
  }

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters." }
  }

  // Local/Offline mock password reset, nothing database related needed
  redirect('/login')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login')
  }

  try {
    await signUpUser(email);
  } catch (err) {
    redirect('/login')
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}