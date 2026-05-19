import {
    Menu,
    Search,
    Bell,
    Moon,
    Briefcase,
    LayoutDashboard,
    Calendar,
    FileText,
    BarChart2,
    Settings,
    Download,
    Plus,
    Filter,
    ChevronDown,
    Building2,
    Users,
    Eye,
    ChevronLeft,
    ChevronRight,
    CheckCircle2
} from "lucide-react";

export const DashboardPreviewMockup = () => {
    return (
        <div className="relative w-full max-w-full min-w-0 overflow-hidden perspective-1000 lg:overflow-visible">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-blue-500/10 rounded-full blur-[80px] -z-10"></div>
            <div className="w-full max-w-[850px] min-w-0 transform overflow-hidden rounded-xl border border-[#1f2e42] bg-[#05111D] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] transition-transform duration-700 lg:rotate-x-[2deg] lg:rotate-y-[-5deg] hover:rotate-0">

                {/* Header */}
                <div className="bg-[#081321] px-3 py-3 sm:px-4 border-b border-[#1f2e42] flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <Menu className="text-gray-400 cursor-pointer w-5 h-5" />
                        <div className="flex min-w-0 items-center gap-1">
                            <span className="truncate text-sm font-bold text-white sm:text-base">
                                Meta<span className="text-primary">Construtor</span>
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 max-w-md mx-4 hidden sm:block">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors w-4 h-4" />
                            <input
                                className="w-full bg-[#05111D] border border-[#1f2e42] rounded-full py-1.5 pl-10 pr-4 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                                placeholder="Buscar..."
                                type="text"
                                readOnly
                            />
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <Bell className="text-gray-400 w-5 h-5 cursor-pointer hover:text-white" />
                        <Moon className="text-gray-400 w-5 h-5 cursor-pointer hover:text-white" />
                        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center relative cursor-pointer">
                            <Briefcase className="text-[#05111D] w-4 h-4" />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#081321] rounded-full"></div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row h-auto md:h-[450px]">
                    {/* Sidebar */}
                    <div className="w-16 bg-[#081321] border-r border-[#1f2e42] flex flex-col py-4 items-center gap-4 hidden md:flex z-10">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary cursor-pointer hover:bg-primary/20 transition-colors">
                            <LayoutDashboard className="w-5 h-5" />
                        </div>
                        <div className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-100 cursor-pointer flex items-center justify-center hover:bg-white/5 transition-colors">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-100 cursor-pointer flex items-center justify-center hover:bg-white/5 transition-colors">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-100 cursor-pointer flex items-center justify-center hover:bg-white/5 transition-colors">
                            <BarChart2 className="w-5 h-5" />
                        </div>
                        <div className="mt-auto">
                            <div className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-100 cursor-pointer flex items-center justify-center hover:bg-white/5 transition-colors">
                                <Settings className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 bg-[#05111D] p-4 md:p-6 overflow-hidden flex flex-col">
                        <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold text-white mb-1 break-words">Relatórios Diários de Obra (RDO)</h2>
                                <p className="text-xs text-gray-400">Gerencie todos os relatórios diários das obras</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button className="px-3 py-1.5 border border-[#1f2e42] rounded text-xs font-medium text-white hover:bg-[#1f2e42] transition-colors flex items-center gap-1.5 cursor-default">
                                    <Download className="w-3.5 h-3.5" /> Exportar
                                </button>
                                <button className="px-3 py-1.5 bg-primary hover:bg-[#FF4500] rounded text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-primary/20 cursor-default">
                                    <Plus className="w-3.5 h-3.5" /> Novo RDO
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-5 h-full overflow-hidden">
                            <div className="w-full md:w-1/3 md:min-w-[220px] flex flex-col gap-4">
                                {/* Filters Card */}
                                <div className="bg-[#081321] border border-[#1f2e42] rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-3 text-white font-medium text-sm">
                                        <Filter className="w-4 h-4" /> Filtros
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] text-gray-400 font-medium block mb-1">Buscar</label>
                                            <div className="relative">
                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                                                <input
                                                    className="w-full bg-[#05111D] border border-[#1f2e42] rounded-md py-1.5 pl-7 pr-2 text-[10px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary/40"
                                                    placeholder="Buscar por obra..."
                                                    type="text"
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400 font-medium block mb-1">Obra</label>
                                            <div className="relative">
                                                <select className="w-full bg-[#05111D] border border-[#1f2e42] rounded-md py-1.5 pl-2 pr-6 text-[10px] text-gray-300 focus:outline-none appearance-none" disabled>
                                                    <option>Todas as obras</option>
                                                    <option>Obra Modelo</option>
                                                </select>
                                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5 pointer-events-none" />
                                            </div>
                                        </div>
                                        <button className="w-full border border-[#1f2e42] py-1.5 rounded text-[10px] text-gray-300 hover:bg-[#0f1b2d] transition-colors mt-1 cursor-default">
                                            Limpar Filtros
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Report Card */}
                                <div className="bg-[#081321] border border-[#1f2e42] rounded-lg p-3 flex flex-col gap-2">
                                    <div className="flex items-start gap-2">
                                        <div className="bg-blue-400/10 p-1 rounded">
                                            <Building2 className="text-blue-400 w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-bold text-white leading-tight">Relatório de Progresso</div>
                                            <div className="text-[9px] text-gray-500 mt-0.5">Acompanhe o físico e financeiro</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        <button className="flex-1 py-1 bg-[#05111D] border border-[#1f2e42] rounded text-[9px] text-gray-300 flex items-center justify-center gap-1 hover:border-primary/50 transition-colors cursor-default">
                                            <Eye className="w-3 h-3" /> Gerar
                                        </button>
                                        <button className="w-7 py-1 bg-[#05111D] border border-[#1f2e42] rounded text-gray-300 flex items-center justify-center hover:border-gray-500 cursor-default">
                                            <Download className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>

                                {/* Productivity Card */}
                                <div className="bg-[#081321] border border-[#1f2e42] rounded-lg p-3 flex flex-col gap-2">
                                    <div className="flex items-start gap-2">
                                        <div className="bg-green-400/10 p-1 rounded">
                                            <Users className="text-green-400 w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-bold text-white leading-tight">Produtividade de Equipes</div>
                                            <div className="text-[9px] text-gray-500 mt-0.5">Performance por período</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        <button className="flex-1 py-1 bg-[#05111D] border border-[#1f2e42] rounded text-[9px] text-gray-300 flex items-center justify-center gap-1 hover:border-primary/50 transition-colors cursor-default">
                                            <Eye className="w-3 h-3" /> Gerar
                                        </button>
                                        <button className="w-7 py-1 bg-[#05111D] border border-[#1f2e42] rounded text-gray-300 flex items-center justify-center hover:border-gray-500 cursor-default">
                                            <Download className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Calendar Section */}
                            <div className="flex-1 flex flex-col gap-4">
                                <div className="bg-[#081321] border border-[#1f2e42] rounded-lg p-4 flex-1">
                                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Calendar className="text-primary w-4 h-4" />
                                            <h3 className="min-w-0 text-sm font-semibold text-white break-words">Calendário de Atividades</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/5 text-gray-400 cursor-default">
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="text-xs font-medium text-white">Janeiro 2026</span>
                                            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/5 text-gray-400 cursor-default">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                            <div key={day} className="text-center text-[10px] text-gray-500 font-medium">{day}</div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 text-[11px] text-gray-300">
                                        <div className="aspect-square flex items-center justify-center text-gray-600">28</div>
                                        <div className="aspect-square flex items-center justify-center text-gray-600">29</div>
                                        <div className="aspect-square flex items-center justify-center text-gray-600">30</div>
                                        <div className="aspect-square flex items-center justify-center text-gray-600">31</div>
                                        {Array.from({ length: 27 }).map((_, i) => {
                                            const day = i + 1;
                                            const isToday = day === 8;
                                            const isSelected = day === 22;

                                            if (isToday) {
                                                return (
                                                    <div key={day} className="aspect-square flex items-center justify-center bg-[#1f2e42] rounded-lg relative cursor-default border border-primary/30">
                                                        {day}
                                                        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full"></div>
                                                    </div>
                                                );
                                            }
                                            if (isSelected) {
                                                return (
                                                    <div key={day} className="aspect-square flex items-center justify-center bg-primary text-white rounded-lg shadow-lg shadow-orange-500/20 font-bold cursor-default">
                                                        {day}
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div key={day} className="aspect-square flex items-center justify-center hover:bg-white/5 rounded cursor-default">
                                                    {day}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button className="w-full bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-semibold py-2 rounded border border-primary/20 transition-colors flex items-center justify-center gap-1 mt-auto cursor-default">
                                        <Plus className="w-3.5 h-3.5" /> Nova Atividade
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Status Card */}
            <div className="absolute -right-6 bottom-16 bg-white p-4 rounded-xl shadow-2xl z-20 animate-[bounce_4s_infinite] border border-gray-100 hidden md:block">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2.5 rounded-lg">
                        <CheckCircle2 className="text-green-600 w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Status do Sistema</div>
                        <div className="text-sm font-bold text-gray-900">100% Operacional</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
