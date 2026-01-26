'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setError('Verifique seu email para confirmar o cadastro.');
                setIsSignUp(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex flex-col items-center gap-2 mb-8">
                        <div className="p-3 bg-[var(--primary)]/10 rounded-full mb-2">
                            <span className="material-symbols-outlined text-[var(--primary)] text-3xl">analytics</span>
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Fluxo Mídia</h1>
                        <p className="text-[var(--text-secondary)] text-sm">Dashboard Analytics</p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] p-8 shadow-lg">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
                        {isSignUp ? 'Criar Conta' : 'Entrar'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            icon="mail"
                            required
                        />

                        <Input
                            label="Senha"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            icon="lock"
                            required
                        />

                        {error && (
                            <p className={`text-sm ${error.includes('Verifique') ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                                {error}
                            </p>
                        )}

                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            {isSignUp ? 'Criar Conta' : 'Entrar'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm text-[var(--primary)] hover:underline"
                        >
                            {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem uma conta? Cadastre-se'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
