import { redirect } from 'next/navigation'
// Registration now skips email confirmation — redirect to login
export default function SignUpSuccessPage() {
  redirect('/auth/login?registered=1')
}
