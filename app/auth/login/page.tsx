'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupInput, InputGroupAddon } from '@/components/ui/input-group'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">SafeWalk</h1>
          <p className="text-sm text-muted-foreground">Your personal safety companion</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to access your safety features</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <FieldGroup>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <Mail className="w-4 h-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </InputGroup>
                </Field>

                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <Lock className="w-4 h-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <InputGroupAddon 
                      className="cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
