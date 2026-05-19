import { DashboardPreviewMockup } from './DashboardPreviewMockup';
import { Construction, CheckCircle2, Shield, Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const heroKeywords = [
    'RDOs automáticos',
    'checklists digitais',
    'cronogramas claros',
    'equipes alinhadas',
    'relatórios inteligentes',
];

export function HeroSectionNew() {
    const navigate = useNavigate();
    const [obraCode, setObraCode] = useState('');
    const [keywordIndex, setKeywordIndex] = useState(0);
    const [displayedKeyword, setDisplayedKeyword] = useState('');
    const [isDeletingKeyword, setIsDeletingKeyword] = useState(false);

    useEffect(() => {
        const currentKeyword = heroKeywords[keywordIndex];
        const isKeywordComplete = displayedKeyword === currentKeyword;
        const isKeywordEmpty = displayedKeyword.length === 0;
        const typingDelay = isKeywordComplete && !isDeletingKeyword
            ? 1400
            : isDeletingKeyword
                ? 45
                : 75;

        const timeoutId = window.setTimeout(() => {
            if (!isDeletingKeyword) {
                if (isKeywordComplete) {
                    setIsDeletingKeyword(true);
                    return;
                }

                setDisplayedKeyword(currentKeyword.slice(0, displayedKeyword.length + 1));
                return;
            }

            if (!isKeywordEmpty) {
                setDisplayedKeyword(currentKeyword.slice(0, displayedKeyword.length - 1));
                return;
            }

            setIsDeletingKeyword(false);
            setKeywordIndex((currentIndex) => (currentIndex + 1) % heroKeywords.length);
        }, typingDelay);

        return () => window.clearTimeout(timeoutId);
    }, [displayedKeyword, isDeletingKeyword, keywordIndex]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (obraCode) {
            navigate(`/login?code=${obraCode}`);
        } else {
            navigate('/login');
        }
    };

    return (
        <main className="h-svh min-h-0 overflow-hidden bg-[#0B1623] text-gray-100 font-sans selection:bg-primary selection:text-white">
            <style>
                {`
                    @keyframes hero-keyword-enter {
                        0% { transform: translateY(0.35em); }
                        100% { transform: translateY(0); }
                    }
                    @keyframes hero-caret-blink {
                        0%, 45% { opacity: 1; }
                        46%, 100% { opacity: 0; }
                    }
                `}
            </style>
            {/* Navbar Placeholder for visual alignment - In real app, Navigation is outside usually, but provided HTML had it inside body. 
          Assuming LandingNavigation handles the top bar, we just focus on the Hero content padding. */}

            <div className="relative flex h-full min-h-0 items-center justify-center px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28 lg:px-12 lg:pb-8 lg:pt-24">
                {/* Background Blobs */}
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

                <div className="max-w-[1400px] mx-auto grid h-full min-h-0 w-full min-w-0 grid-cols-1 items-center gap-10 lg:grid-cols-5 lg:gap-16">

                    {/* Left Column */}
                    <div className="lg:col-span-2 flex min-w-0 flex-col text-left z-10">
                        <h1
                            className="max-w-full text-3xl font-semibold leading-tight text-white mb-8 [text-shadow:0_0_20px_rgba(255,255,255,0.1)] sm:text-4xl lg:text-[2rem] xl:text-[2.6rem]"
                            aria-label={`Gerencie sua obra com ${heroKeywords[keywordIndex]}`}
                        >
                            Gerencie sua obra com
                            <span
                                className="mt-1 flex h-[1.3em] max-w-full min-w-0 items-start overflow-hidden text-xl font-semibold leading-tight text-[#FF4D24] [text-shadow:0_0_18px_rgba(255,77,36,0.35)] sm:mt-2 sm:h-[1.15em] sm:text-4xl lg:text-[2rem] xl:text-[2.6rem]"
                                aria-hidden="true"
                            >
                                <span className="block min-w-0 max-w-full truncate whitespace-nowrap">
                                    {displayedKeyword || '\u00A0'}
                                </span>
                                <span
                                    className="ml-1 mt-[0.08em] inline-block h-[0.9em] w-[3px] shrink-0 rounded-full bg-[#FF4D24] shadow-[0_0_14px_rgba(255,77,36,0.8)]"
                                    style={{ animation: 'hero-caret-blink 850ms steps(1,end) infinite' }}
                                />
                            </span>
                        </h1>

                        <div className="w-full max-w-[22rem] rounded-2xl bg-white p-5 shadow-2xl shadow-blue-900/20 sm:max-w-md sm:p-6 md:p-8 lg:max-w-none">
                            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                                <div className="relative">
                                    <input
                                    className="w-full min-w-0 text-gray-900 placeholder:text-gray-400 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 pr-12 text-base font-medium leading-none focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all sm:px-5"
                                        placeholder="Nome da obra"
                                        type="text"
                                        value={obraCode}
                                        onChange={(e) => setObraCode(e.target.value)}
                                    />
                                    <Construction className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 sm:h-6 sm:w-6" />
                                </div>
                                <button
                                    className="w-full bg-primary hover:bg-[#FF4500] text-white text-base font-semibold leading-none py-4 px-4 sm:px-8 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5"
                                    type="submit"
                                >
                                    Gerar RDO Agora
                                </button>
                            </form>

                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex -space-x-3">
                                        <img alt="User" className="w-8 h-8 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&auto=format&fit=crop" />
                                        <img alt="User" className="w-8 h-8 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&auto=format&fit=crop" />
                                        <img alt="User" className="w-8 h-8 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&auto=format&fit=crop" />
                                    </div>
                                    <span className="min-w-0 text-sm font-medium leading-relaxed text-gray-500">
                                        <strong className="text-gray-800">+ de 500</strong> construtoras já utilizam
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3 sm:gap-4 items-center">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700/50 bg-[#152336]/50 backdrop-blur-sm">
                                <CheckCircle2 className="text-green-400 w-5 h-5" />
                                <span className="text-xs font-medium leading-none text-gray-300">Empresa Verificada</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700/50 bg-[#152336]/50 backdrop-blur-sm">
                                <Award className="text-yellow-400 w-5 h-5" />
                                <span className="text-xs font-medium leading-none text-gray-300">Selo de Qualidade</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700/50 bg-[#152336]/50 backdrop-blur-sm">
                                <Shield className="text-blue-400 w-5 h-5" />
                                <span className="text-xs font-medium leading-none text-gray-300">Dados Seguros</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Dashboard Preview */}
                    <div className="relative hidden h-full min-w-0 items-center justify-center lg:col-span-3 lg:flex lg:justify-end">
                        <DashboardPreviewMockup />
                    </div>

                </div>
            </div>
        </main>
    );
}
