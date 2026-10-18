import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router';

import { Brand } from '@/components/shared/Brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { type LoginFormValues, loginSchema } from '@/pages/auth/login.schema';
import { getErrorMessage } from '@/services/api';

export function LoginPage() {
  const { login, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (user) {
    return (
      <Navigate
        to={user.role === 'COMPANY' ? '/company/jobs' : '/jobs'}
        replace
      />
    );
  }

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values);
    } catch (error) {
      setError('root', { message: getErrorMessage(error) });
    }
  }

  return (
    <main className="grid min-h-screen bg-card lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r bg-indigo-50/70 p-12 lg:flex xl:p-16">
        <Brand to="/login" />
        <div className="relative z-10 max-w-lg py-12">
          <p className="mb-5 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            <span className="size-2 rounded-full bg-primary" />
            Kesempatan baru, langkah baru
          </p>
          <h1 className="text-5xl leading-[1.16] font-semibold tracking-tight xl:text-6xl">
            Langkah berikutnya
            <br />
            dimulai <span className="text-primary">di sini.</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-muted-foreground">
            Temukan pekerjaan yang sesuai, atau kandidat yang tepat. Semua
            terhubung lewat IndoKerja.
          </p>
          <div className="mt-10 max-w-sm rounded-2xl border border-indigo-100 bg-card p-6 shadow-sm">
            <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
              <BriefcaseBusiness className="size-5" aria-hidden="true" />
            </span>
            <p className="font-semibold">Karier dan tim yang terus tumbuh</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                'Jelajahi lowongan dari perusahaan',
                'Pantau perkembangan lamaran',
                'Kelola rekrutmen dengan mudah',
              ].map((text) => (
                <li key={text} className="flex items-center gap-2.5">
                  <Check
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Temukan peluang. Wujudkan potensi.
        </p>
      </section>
      <section className="flex min-w-0 flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="lg:hidden">
          <Brand to="/login" />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-16 lg:py-10">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            Selamat datang kembali
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Masuk ke IndoKerja
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Lanjutkan perjalanan karier dan rekrutmen Anda.
          </p>
          <form
            className="mt-9 space-y-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="nama@email.com"
                className="h-12"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isSubmitting}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata sandi</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  className="h-12 pr-12"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? 'password-error' : undefined
                  }
                  disabled={isSubmitting}
                  {...register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={
                    showPassword
                      ? 'Sembunyikan kata sandi'
                      : 'Tampilkan kata sandi'
                  }
                  aria-pressed={showPassword}
                  className="absolute top-0.5 right-1 size-11 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {errors.root && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {errors.root.message}
              </p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full text-sm"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                  Sedang masuk…
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            Gunakan akun pencari kerja atau perusahaan Anda.
          </p>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} IndoKerja
        </p>
      </section>
    </main>
  );
}
