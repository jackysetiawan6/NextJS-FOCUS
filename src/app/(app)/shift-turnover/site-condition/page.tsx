
import { redirect } from 'next/navigation';

export default function SiteConditionRedirectPage() {
  // Redirect to the first sub-page of the new site condition structure
  redirect('/shift-turnover/site-condition/alarm-logs');
  return null; 
}
