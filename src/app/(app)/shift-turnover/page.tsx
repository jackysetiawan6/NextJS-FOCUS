
import { redirect } from 'next/navigation';

export default function OldShiftTurnoverPage() {
  // Redirect to the first sub-page of the new shift turnover structure
  redirect('/shift-turnover/site-condition');
  return null; 
}
