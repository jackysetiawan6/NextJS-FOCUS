import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
  // Optional: return a loading component or null
  return null; 
}
