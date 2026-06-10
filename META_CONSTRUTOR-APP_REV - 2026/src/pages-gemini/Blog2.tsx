import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Clock, ArrowRight, MessageCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';

// ─── Variants ────────────────────────────────────────────────
const cinematic = {
  initial: { opacity: 0, y: 30, filter: 'blur(4px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  whileInView: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
  viewport: { once: true },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: 'easeOut' },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
};

// ─── Data ────────────────────────────────────────────────────
const POSTS = [
  {
    slug: 'rdo-digital-obra',
    title: 'RDO Digital: Como fazer o Diário de Obras de forma eficiente',
    excerpt: 'O RDO digital substitui o papel e transforma a gestão da sua obra. Veja como implementar na prática.',
    image: '/marketing/prd-prints-2026-06-04-15-rdo-visualizacao-desktop.webp',
    date: '10 Jun 2026', readTime: '5 min', category: 'Gestão de Obras',
  },
  {
    slug: 'checklist-obra-ideal',
    title: 'Checklist de Obra: O guia completo para não esquecer nada',
    excerpt: 'Como criar checklists inteligentes que evitam retrabalho e aumentam a produtividade da equipe.',
    image: '/marketing/prd-prints-2026-06-04-16-checklist-detalhe-desktop.webp',
    date: '8 Jun 2026', readTime: '7 min', category: 'Produtividade',
  },
  {
    slug: 'relatorios-automaticos-obra',
    title: 'Relatórios Automáticos: Como economizar 10h por semana',
    excerpt: 'Chega de planilhas manuais. Veja como gerar relatórios automáticos de obra em segundos.',
    image: '/marketing/prd-prints-2026-06-04-12-relatorios-resumo-desktop.webp',
    date: '5 Jun 2026', readTime: '6 min', category: 'Relatórios',
  },
  {
    slug: 'gestao-financeira-obra',
    title: 'Gestão Financeira de Obras: Controle de custos em tempo real',
    excerpt: 'Descubra como acompanhar o fluxo de caixa da obra e evitar estouros de orçamento.',
    image: '/marketing/prd-prints-2026-06-04-11-despesas-lista-desktop.webp',
    date: '3 Jun 2026', readTime: '8 min', category: 'Financeiro',
  },
  {
    slug: 'lgpd-construcao-civil',
    title: 'LGPD na Construção Civil: O que sua construtora precisa saber',
    excerpt: 'A LGPD também vale para obras. Saiba como adequar sua construtora à lei de proteção de dados.',
    image: '/marketing/prd-prints-2026-06-04-18-configuracoes-desktop.webp',
    date: '1 Jun 2026', readTime: '10 min', category: 'Jurídico',
  },
  {
    slug: 'equipe-obra-conectada',
    title: 'Equipe de Obra Conectada: Como melhorar a comunicação',
    excerpt: 'Comunique-se melhor com sua equipe. Veja como o Meta Construtor resolve o caos do WhatsApp.',
    image: '/marketing/obras-reais/equipe-cobertura-metalica.webp',
    date: '29 Mai 2026', readTime: '6 min', category: 'Equipe',
  },
];

const CATEGORIES = ['Todos', 'Gestão de Obras', 'Produtividade', 'Relatórios', 'Financeiro', 'Jurídico', 'Equipe'];

// ─── Blog Card ───────────────────────────────────────────────
function BlogCard({ post, index }: { post: typeof POSTS[0]; index: number }) {
  return (
    <motion.article variants={scaleIn}
      className="group bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm hover:shadow-xl transition-all duration-500"
    >
      <a href={`/blog/${post.slug}`} className="block">
        <div className="relative overflow-hidden aspect-[16/9] bg-brand-blue">
          <img src={post.image} alt={post.title} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-85"
          />
          <div className="absolute top-3 left-3">
            <span className="inline-block px-2.5 py-1 bg-brand-orange text-white text-xs font-bold rounded-md">
              {post.category}
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="p-5 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-brand-blue mb-2 font-heading group-hover:text-brand-orange transition-colors duration-200">
            {post.title}
          </h3>
          <p className="text-sm text-neutral-500 mb-4 line-clamp-2 leading-relaxed">{post.excerpt}</p>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{post.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
            </div>
            <span className="flex items-center gap-1 text-brand-orange font-semibold group-hover:gap-2 transition-all duration-200">
              Ler <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </a>
    </motion.article>
  );
}

// ─── Featured ────────────────────────────────────────────────
function FeaturedPost() {
  const post = POSTS[0];
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="mb-12"
    >
      <a href={`/blog/${post.slug}`} className="group block">
        <div className="grid lg:grid-cols-5 bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-lg hover:shadow-2xl transition-all duration-500">
          <div className="lg:col-span-3 relative overflow-hidden aspect-[16/10] lg:aspect-auto bg-brand-blue">
            <img src={post.image} alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
            />
            <div className="absolute top-4 left-4">
              <span className="inline-block px-3 py-1.5 bg-brand-orange text-white text-xs font-bold rounded-md">Destaque</span>
            </div>
          </div>
          <div className="lg:col-span-2 p-8 md:p-10 flex flex-col justify-center">
            <span className="text-xs text-brand-orange font-bold uppercase tracking-wider mb-2">{post.category}</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-brand-blue mb-3 font-heading group-hover:text-brand-orange transition-colors">
              {post.title}
            </h2>
            <p className="text-neutral-500 mb-6 leading-relaxed">{post.excerpt}</p>
            <div className="flex items-center gap-4 text-xs text-neutral-400 mb-6">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{post.date}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{post.readTime}</span>
            </div>
            <Button className="self-start bg-brand-blue hover:bg-blue-800 text-white px-6 py-5 rounded-xl group/btn">
              Ler Artigo <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </a>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────
export default function Blog2() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const filtered = POSTS.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white text-brand-blue overflow-x-hidden">
      <SEO {...seoPages.blog2} />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-gradient-to-b from-brand-blue via-[#162d4e] to-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.15)_0%,_transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...cinematic}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/20 text-brand-orange text-sm font-semibold mb-4 border border-brand-orange/30">
              Blog
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 font-heading">
              Conteúdo para{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-300">
                sua obra
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100/70 max-w-2xl mx-auto mb-8">
              Dicas, tutoriais e novidades sobre gestão de obras, RDO digital e muito mais
            </p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }} className="max-w-md mx-auto relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input type="text" placeholder="Buscar artigos..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-4 py-6 rounded-xl border-2 border-neutral-200 focus:border-brand-orange text-base shadow-md bg-white"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                  activeCategory === cat
                    ? 'bg-brand-orange text-white border-brand-orange shadow-md shadow-orange-200'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand-orange hover:text-brand-orange'
                }`}
              >{cat}</button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-brand-blue mb-2">Nenhum artigo encontrado</h3>
                <p className="text-neutral-400">Tente outros termos de busca ou categoria</p>
              </motion.div>
            ) : (
              <motion.div key="grid" variants={staggerContainer} className="space-y-0">
                <FeaturedPost />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.slice(1).map((post, i) => (
                    <BlogCard key={post.slug} post={post} index={i} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Gallery — obra images banner */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...cinematic} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-blue font-heading">
              Obras reais, resultados reais
            </h2>
            <p className="text-neutral-500 mt-2">Veja fotos de obras gerenciadas com o Meta Construtor</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['obra-01', 'obra-05', 'cobertura-metalica-canteiro', 'obra-10', 'obra-15', 'obra-20', 'estrutura-metalica-aerea', 'quadra-coberta-finalizada'].map((img, i) => (
              <motion.img key={img} initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                src={`/marketing/obras-reais/${img}.webp`} alt={`Obra ${img}`}
                className="rounded-xl shadow-md border border-neutral-200 aspect-[4/3] object-cover hover:scale-105 transition-transform duration-300"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="relative py-20 bg-gradient-to-br from-brand-blue via-[#162d4e] to-brand-blue text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2LjUgMzUuNWMtNC4xNDEgMC03LjUtMy4zNTktNy41LTcuNSAwLTQuMTQxIDMuMzU5LTcuNSA3LjUtNy41IDQuMTQxIDAgNy41IDMuMzU5IDcuNSA3LjUgMCA0LjE0MS0zLjM1OSA3LjUtNy41IDcuNXoiLz48L2c+PC9nPjwvc3ZnPg==')]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...cinematic}>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 font-heading">Receba conteúdos exclusivos</h2>
            <p className="text-lg text-blue-200/70 mb-8 max-w-lg mx-auto">
              Dicas de gestão de obras, novidades do Meta Construtor e ofertas especiais direto no seu e-mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input type="email" placeholder="Seu melhor e-mail"
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-blue-300 py-6 rounded-xl text-base"
              />
              <Button className="bg-brand-orange hover:bg-orange-600 text-white px-8 py-6 rounded-xl font-semibold whitespace-nowrap">
                Inscrever
              </Button>
            </div>
            <p className="text-xs text-blue-300/70 mt-3">Sem spam. Cancelamento fácil a qualquer momento.</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
