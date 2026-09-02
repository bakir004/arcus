import * as React from 'react';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getMeRequest } from '@/features/auth/api/get-me';
import { signInWithEmail, useSignInWithGoogle, type AuthError } from '@/features/auth/api/sign-in';
import { queryClient } from '@/lib/query-client';

const FACULTY_DOMAIN = 'etf.unsa.ba';
const meQueryKey = ['auth', 'me'];

type LoginValues = {
    emailLocalPart: string;
    password: string;
};

function validateEmailLocalPart(value: string): string | undefined {
    const emailLocalPart = value.trim();
    if (!emailLocalPart) return 'Email username is required.';
    if (!/^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/.test(emailLocalPart)) {
        return 'Use lowercase letters, numbers, dot, underscore, or hyphen.';
    }
    return undefined;
}

function validatePassword(value: string): string | undefined {
    if (value.length < 8) return 'Password must be at least 8 characters.';
    return undefined;
}

export function LoginForm() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = React.useState(false);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const signInWithGoogle = useSignInWithGoogle();

    const form = useForm({
        defaultValues: {
            emailLocalPart: '',
            password: '',
        } satisfies LoginValues,
        onSubmit: async ({ value }) => {
            setSubmitError(null);
            try {
                await signInWithEmail({
                    email: `${value.emailLocalPart.trim()}@${FACULTY_DOMAIN}`,
                    password: value.password,
                });
                const session = await getMeRequest();
                if (!session?.user) throw new Error('Login succeeded, but the session could not be loaded.');
                queryClient.setQueryData(meQueryKey, session);
                await navigate({ to: '/' });
            } catch (error) {
                setSubmitError(error instanceof Error ? error.message : (error as AuthError).message);
            }
        },
    });

    async function onGoogleSignIn() {
        setSubmitError(null);
        try {
            const response = await signInWithGoogle.mutateAsync(window.location.origin);
            if (response.url) window.location.href = response.url;
            else setSubmitError('Google sign-in failed. Please try again.');
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : (error as AuthError).message);
        }
    }

    return (
        <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void form.handleSubmit();
            }}
        >
            <FieldGroup className="gap-4">
                <div className="space-y-1 text-center">
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">Login to your account</h1>
                    <p className="text-sm text-muted-foreground">Enter your email below to login to your account</p>
                </div>
                <form.Field
                    name="emailLocalPart"
                    validators={{ onChange: ({ value }) => validateEmailLocalPart(value) }}
                >
                    {(field) => (
                        <Field className="gap-2">
                            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5">
                                <input
                                    id={field.name}
                                    className="h-8 w-full bg-transparent text-sm outline-none"
                                    value={field.state.value}
                                    onChange={(event) => field.handleChange(event.target.value.toLowerCase())}
                                    onBlur={field.handleBlur}
                                    placeholder="ime.prezime"
                                    autoComplete="username"
                                    required
                                />
                                <span className="text-sm text-muted-foreground">@{FACULTY_DOMAIN}</span>
                            </div>
                            {field.state.meta.isTouched && field.state.meta.errors[0] ? (
                                <FieldDescription className="text-destructive">
                                    {field.state.meta.errors[0]}
                                </FieldDescription>
                            ) : null}
                        </Field>
                    )}
                </form.Field>
                <form.Field name="password" validators={{ onChange: ({ value }) => validatePassword(value) }}>
                    {(field) => (
                        <Field className="gap-2">
                            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                            <div className="relative">
                                <Input
                                    id={field.name}
                                    type={showPassword ? 'text' : 'password'}
                                    value={field.state.value}
                                    onChange={(event) => field.handleChange(event.target.value)}
                                    onBlur={field.handleBlur}
                                    className="pr-10"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((current) => !current)}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {field.state.meta.isTouched && field.state.meta.errors[0] ? (
                                <FieldDescription className="text-destructive">
                                    {field.state.meta.errors[0]}
                                </FieldDescription>
                            ) : null}
                        </Field>
                    )}
                </form.Field>
                {submitError ? <FieldDescription className="text-destructive">{submitError}</FieldDescription> : null}
                <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Logging in...' : 'Login'}
                        </Button>
                    )}
                </form.Subscribe>
                <FieldSeparator className="my-0">Or continue with</FieldSeparator>
                <Button variant="outline" type="button" onClick={onGoogleSignIn} disabled={signInWithGoogle.isPending}>
                    <GoogleIcon />
                    {signInWithGoogle.isPending ? 'Redirecting...' : 'Continue with Google'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">Need an account? Contact an administrator.</p>
            </FieldGroup>
        </form>
    );
}

function GoogleIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
            <path
                fill="#4285F4"
                d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.8-1.6 2.8-4 2.8-6.9 0-.6-.1-1.2-.2-1.8H12z"
            />
            <path
                fill="#34A853"
                d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-1.9 1-3.4 1-2.6 0-4.8-1.8-5.5-4.2H3.4v2.4C5 18.8 8.2 21 12 21z"
            />
            <path
                fill="#FBBC05"
                d="M6.5 13c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V6.8H3.4C2.8 8.1 2.5 9.5 2.5 11s.3 2.9.9 4.2L6.5 13z"
            />
            <path
                fill="#EA4335"
                d="M12 4.8c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 1.8 14.6 1 12 1 8.2 1 5 3.2 3.4 6.8l3.1 2.4c.7-2.4 2.9-4.2 5.5-4.2z"
            />
        </svg>
    );
}
