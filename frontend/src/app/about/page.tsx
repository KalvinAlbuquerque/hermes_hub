// Arquivo: frontend/src/app/about/page.tsx
"use client";

import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, Code, GitBranch } from 'lucide-react';

function AboutPage() {
    return (
        <DashboardLayout>
            <div className="card max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-foreground">Sobre o Hermes Hub</h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                        Uma solução completa para notificação e gestão de incidentes.
                    </p>
                </header>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-primary border-b-2 border-border pb-2 mb-4">
                        Nossa Missão
                    </h2>
                    <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">
                        <p>
                            O Hermes Hub foi criado para otimizar e dar segurança ao processo de comunicação de incidentes, garantindo que as informações certas cheguem às pessoas certas de forma rápida, padronizada e com total rastreabilidade através de um fluxo de aprovação integrado.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-primary border-b-2 border-border pb-2 mb-4">
                        A Equipe de Desenvolvimento
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
                        <div className="text-center">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                            <h3 className="font-semibold text-foreground">Kalvin Albuquerque</h3>
                            <p className="text-sm text-muted-foreground">Desenvolvedor Full-Stack</p>
                        </div>
                        <div className="text-center">
                            <Code className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                            <h3 className="font-semibold text-foreground">Natan Santos</h3>
                            <p className="text-sm text-muted-foreground">Engenheiro de Software</p>
                        </div>
                        <div className="text-center">
                            <GitBranch className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                            <h3 className="font-semibold text-foreground">Tainá Sacramento</h3>
                            <p className="text-sm text-muted-foreground">Arquiteta de Soluções</p>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

export default withAuth(AboutPage);