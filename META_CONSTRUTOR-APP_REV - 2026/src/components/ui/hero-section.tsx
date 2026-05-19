import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronRight, Menu, X, Building2, Users, FileCheck, BarChart3, Calendar, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { cn } from '@/lib/utils'
import Logo from '@/components/Logo'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring' as const,
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export function HeroSection() {
    const navigate = useNavigate()

    const handleAccessSystem = () => {
        navigate("/login")
    }

    const handleTestLogin = async () => {

        // Simular login direto sem precisar ir para a pÃ¡gina de login
        const testUser = {
            id: "test_user_" + Date.now(),
            name: "UsuÃ¡rio Teste",
            email: "teste@metaconstrutor.com",
            role: "Administrador" as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        localStorage.setItem("auth_user", JSON.stringify(testUser));
        localStorage.setItem("auth_token", "test_token_" + Math.random().toString(36));
        localStorage.setItem("auth_refresh_token", "test_refresh_" + Math.random().toString(36));

        window.location.replace("/app/dashboard");
    }

    return (
        <>
            <HeroHeader />
            <main className="overflow-hidden">
                <div
                    aria-hidden
                    className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
                    <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsl(var(--primary)/0.08)_0,hsl(var(--primary)/0.02)_50%,hsl(var(--primary)/0)_80%)]" />
                    <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsl(var(--primary)/0.06)_0,hsl(var(--primary)/0.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsl(var(--primary)/0.04)_0,hsl(var(--primary)/0.02)_80%,transparent_100%)]" />
                </div>
                <section>
                    <div className="relative pt-24 md:pt-36">
                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            delayChildren: 1,
                                        },
                                    },
                                },
                                item: {
                                    hidden: {
                                        opacity: 0,
                                        y: 20,
                                    },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            type: 'spring' as const,
                                            bounce: 0.3,
                                            duration: 2,
                                        },
                                    },
                                },
                            }}
                            className="absolute inset-0 -z-20">
                            <div className="absolute inset-x-0 top-56 -z-20 hidden lg:top-32 dark:block w-full h-full bg-gradient-to-b from-background via-background/50 to-background opacity-90" />
                        </AnimatedGroup>
                        <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,hsl(var(--background))_75%)]" />
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                                <AnimatedGroup variants={transitionVariants}>
                                    <div className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950">
                                        <span className="text-foreground text-sm">ðŸŽ¯ GestÃ£o de Obras Inteligente</span>
                                        <span className="dark:border-background block h-4 w-0.5 border-l bg-muted-foreground dark:bg-zinc-700"></span>

                                        <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                                            <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3" />
                                                </span>
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <h1
                                        className="mt-8 max-w-4xl mx-auto text-balance text-6xl md:text-7xl lg:mt-16 xl:text-[5.25rem] font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                                        Meta Construtor
                                    </h1>
                                    <p
                                        className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
                                        Sistema completo para gestÃ£o de obras, RDO, checklists e relatÃ³rios.
                                        Controle total dos seus projetos de construÃ§Ã£o em uma plataforma moderna e eficiente.
                                    </p>
                                </AnimatedGroup>

                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.75,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                    className="mt-12 flex flex-col items-center justify-center gap-4 md:flex-row">
                                    <div
                                        key={1}
                                        className="bg-primary/10 rounded-[14px] border border-primary/20 p-0.5">
                                        <Button
                                            size="lg"
                                            onClick={handleAccessSystem}
                                            className="rounded-xl px-8 text-base font-semibold bg-primary hover:bg-primary/90">
                                            <span className="text-nowrap">Acessar Sistema</span>
                                        </Button>
                                    </div>
                                    <Button
                                        key={2}
                                        size="lg"
                                        variant="ghost"
                                        onClick={handleTestLogin}
                                        className="h-12 rounded-xl px-8 text-base font-medium hover:bg-muted border border-border">
                                        <span className="text-nowrap">ðŸ§ª Login Direto (Teste)</span>
                                    </Button>
                                </AnimatedGroup>
                            </div>
                        </div>

                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.75,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}>
                            <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                                <div
                                    aria-hidden
                                    className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                                />
                                <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-border/50 bg-background/95 backdrop-blur-sm p-4 shadow-2xl shadow-primary/10 ring-1 ring-border/20">
                                    <div className="aspect-[16/10] relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                                        {/* SimulaÃ§Ã£o da interface do Meta Construtor */}
                                        <div className="absolute inset-0 p-6">
                                            {/* Header simulado */}
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                                                        <Building2 className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="font-semibold text-foreground">Dashboard - Meta Construtor</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                                                    <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                                                </div>
                                            </div>

                                            {/* Grid de cards simulado */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                <div className="bg-card/80 border border-border/50 rounded-lg p-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Building2 className="w-5 h-5 text-primary" />
                                                        <span className="font-medium text-card-foreground">Obras Ativas</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-primary">24</div>
                                                </div>

                                                <div className="bg-card/80 border border-border/50 rounded-lg p-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Users className="w-5 h-5 text-green-600" />
                                                        <span className="font-medium text-card-foreground">Equipes</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-green-600">12</div>
                                                </div>

                                                <div className="bg-card/80 border border-border/50 rounded-lg p-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <FileCheck className="w-5 h-5 text-blue-600" />
                                                        <span className="font-medium text-card-foreground">RDOs</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-blue-600">156</div>
                                                </div>
                                            </div>

                                            {/* Ãrea de grÃ¡fico simulado */}
                                            <div className="bg-card/60 border border-border/30 rounded-lg p-4 h-32">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium text-muted-foreground">Progresso das Obras</span>
                                                </div>
                                                <div className="flex items-end gap-2 h-16">
                                                    {[...Array(8)].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className="bg-primary/40 rounded-t w-6"
                                                            style={{ height: `${Math.random() * 60 + 10}%` }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AnimatedGroup>
                    </div>
                </section>
                <section className="bg-background pb-16 pt-16 md:pb-32">
                    <div className="group relative m-auto max-w-5xl px-6">
                        <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
                            <button
                                onClick={handleAccessSystem}
                                className="block text-sm duration-150 hover:opacity-75 text-primary font-medium">
                                <span>Acesse Todas as Funcionalidades</span>
                                <ChevronRight className="ml-1 inline-block size-3" />
                            </button>
                        </div>
                        <div className="group-hover:blur-xs mx-auto mt-12 grid max-w-4xl grid-cols-2 md:grid-cols-3 gap-8 transition-all duration-500 group-hover:opacity-50">
                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-primary" />
                                </div>
                                <span className="text-sm font-medium text-foreground">GestÃ£o de Obras</span>
                            </div>

                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-foreground">Controle de Equipes</span>
                            </div>

                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                    <FileCheck className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-foreground">RDO Digital</span>
                            </div>

                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-purple-600" />
                                </div>
                                <span className="text-sm font-medium text-foreground">RelatÃ³rios</span>
                            </div>

                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-orange-600" />
                                </div>
                                <span className="text-sm font-medium text-foreground">Cronogramas</span>
                            </div>

                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-red-600" />
                                </div>
                                <span className="text-sm font-medium text-foreground">SeguranÃ§a</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

const menuItems = [
    { name: 'Funcionalidades', href: '/app/dashboard' },
    { name: 'Obras', href: '/app/obras' },
    { name: 'RDO', href: '/app/rdo' },
    { name: 'RelatÃ³rios', href: '/app/relatorios' },
]

const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)
    const navigate = useNavigate()

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleLogin = () => {
        navigate('/login')
    }

    const handleSignUp = () => {
        navigate('/criar-conta')
    }

    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2 group">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/80 max-w-4xl rounded-2xl border border-border/50 backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <div className="flex items-center space-x-2">
                                <Logo size="sm" />
                            </div>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Fechar Menu' : 'Abrir Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <button
                                            onClick={() => navigate(item.href)}
                                            className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                            <span>{item.name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <button
                                                onClick={() => navigate(item.href)}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLogin}
                                    className={cn(isScrolled && 'lg:hidden')}>
                                    <span>Entrar</span>
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSignUp}
                                    className={cn(isScrolled && 'lg:hidden')}>
                                    <span>Criar Conta</span>
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleLogin}
                                    className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}>
                                    <span>Acessar Sistema</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
