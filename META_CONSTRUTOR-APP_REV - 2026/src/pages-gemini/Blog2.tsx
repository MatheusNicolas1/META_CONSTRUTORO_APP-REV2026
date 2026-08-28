import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Clock, ArrowRight } from 'lucide-react';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';
import { loadBlogArticles } from '@/content/blogArticles';
import type { BlogArticle } from '@/content/blogArticles';

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

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
};

// ─── Helpers ─────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getThumb(article: BlogArticle): string | undefined {
  return article.sections?.find((s) => s.image?.src)?.image?.src;
}

// ─── Blog Card ───────────────────────────────────────────────
function BlogCard({ post, index }: { post: BlogArticle; index: number }) {
  const thumb = getThumb(post);
  return (
    <motion.article variants={scaleIn}
      className="group bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm hover:shadow-xl transition-all duration-500"
    >
      <a href={post.path} className="block">
        <div className="relative overflow-hidden aspect-[16/9] bg-brand-blue">
          {thumb ? (
            <img src={thumb} alt={post.title} loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-85"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-blue to-[#162d4e]">
              <span className="text-brand-orange/80 text-sm font-semibold uppercase tracking-wider px-4 text-center">{post.category}</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="inline-block px-2.5 py-1 bg-[#dc4415] text-white text-xs font-bold rounded-md">
              {post.category}
            </span>
          </div>
        </div>
        <div className="p-5 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-brand-blue mb-2 font-heading group-hover:text-brand-blue transition-colors duration-200">
            {post.title}
          </h3>
          <p className="text-sm text-neutral-500 mb-4 line-clamp-2 leading-relaxed">{post.description}</p>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.publishedAt)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readingTime}</span>
            </div>
            <span className="flex items-center gap-1 text-brand-blue font-semibold group-hover:gap-2 transition-all duration-200">
              Ler <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </a>
    </motion.article>
  );
}

// ─── Featured ────────────────────────────────────────────────
function FeaturedPost({ post }: { post: BlogArticle }) {
  const thumb = getThumb(post);
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="mb-12"
    >
      <a href={post.path} className="group block">
        <div className="grid lg:grid-cols-5 bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-lg hover:shadow-2xl transition-all duration-500">
          <div className="lg:col-span-3 relative overflow-hidden aspect-[16/10] lg:aspect-auto bg-brand-blue">
            {thumb ? (
              <img src={thumb} alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
              />
            ) : (
              <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-gradient-to-br from-brand-blue to-[#162d4e]">
                <span className="text-brand-orange/80 text-sm font-semibold uppercase tracking-wider">{post.category}</span>
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span className="inline-block px-3 py-1.5 bg-[#dc4415] text-white text-xs font-bold rounded-md">Destaque</span>
            </div>
          </div>
          <div className="lg:col-span-2 p-8 md:p-10 flex flex-col justify-center">
            <span className="text-xs text-brand-blue font-bold uppercase tracking-wider mb-2">{post.category}</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-brand-blue mb-3 font-heading group-hover:text-brand-blue transition-colors">
              {post.title}
            </h2>
            <p className="text-neutral-500 mb-6 leading-relaxed">{post.description}</p>
            <div className="flex items-center gap-4 text-xs text-neutral-400 mb-6">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(post.publishedAt)}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{post.readingTime}</span>
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
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    let mounted = true;
    (async () => {
      try {
        const { 'pt-BR': loaded } = await loadBlogArticles('pt-BR');
        const sorted = [...(loaded ?? [])].sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
        if (mounted) setArticles(sorted);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(articles.map((a) => a.category)))], [articles]);

  const filtered = useMemo(() => {
    return articles.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'Todos' || post.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [articles, search, activeCategory]);

  return (
    <div className="min-h-screen bg-white text-brand-blue overflow-x-hidden">
      <SEO {...seoPages.blog2} />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-gradient-to-b from-brand-blue via-[#162d4e] to-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.15)_0%,_transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...cinematic}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/20 text-brand-blue text-sm font-semibold mb-4 border border-brand-orange/30">Blog</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 font-heading">
              Conteúdo para{' '}
              <span className="text-orange-400">sua obra</span>
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
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                  activeCategory === cat
                    ? 'bg-[#dc4415] text-white border-[#dc4415] shadow-md shadow-[#dc4415]/30'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand-blue hover:text-brand-blue'
                }`}
              >{cat}</button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 animate-pulse">
                  <div className="mb-4 h-40 rounded-xl bg-neutral-100" />
                  <div className="mb-2 h-5 w-3/4 rounded bg-neutral-100" />
                  <div className="h-4 w-full rounded bg-neutral-100" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-brand-blue mb-2">
                {articles.length === 0 ? 'Nenhum artigo publicado ainda' : 'Nenhum artigo encontrado'}
              </h3>
              <p className="text-neutral-400">
                {articles.length === 0 ? 'Em breve teremos conteúdo novo por aqui.' : 'Tente outros termos de busca ou categoria'}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key="grid" variants={staggerContainer} className="space-y-0">
                <FeaturedPost post={filtered[0]} />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.slice(1).map((post, i) => (
                    <BlogCard key={post.slug} post={post} index={i} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
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
              Dicas de gestão de obras e novidades do Meta Construtor direto no seu e-mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input type="email" placeholder="Seu melhor e-mail"
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-blue-300 py-6 rounded-xl text-base"
              />
              <Button className="bg-[#dc4415] hover:bg-[#c43a10] text-white px-8 py-6 rounded-xl font-semibold whitespace-nowrap">
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
