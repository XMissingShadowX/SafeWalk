import { Shield, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">SafeWalk</h1>
        </div>

        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-safe/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-safe" />
            </div>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent you a confirmation link. Please check your email to complete your registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Mail className="w-5 h-5 text-primary" />
              <p className="text-sm">
                Click the link in the email to verify your account and start using SafeWalk.
              </p>
            </div>
            
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
