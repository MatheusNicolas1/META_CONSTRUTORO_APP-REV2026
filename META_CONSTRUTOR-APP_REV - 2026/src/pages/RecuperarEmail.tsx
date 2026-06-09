import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { NavigationSafety } from "@/utils/navigationSafety";
import { User, Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

function CustomInput({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

const RecuperarEmail = () => {
  const navigate = useNavigate();
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [tipoPessoa, setTipoPessoa] = useState("fisica");
  const [sent, setSent] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // For 3D card effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen w-screen bg-black relative overflow-hidden flex items-center justify-center">
      <SEO title="Recuperar email | Meta Construtor" description="Recupere seu email de acesso usando seu CPF ou CNPJ." canonical={window.location.href} />
      
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-construction-blue/40 via-construction-blue/50 to-black" />
      
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-soft-light" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      {/* Top radial glow */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-construction-blue/20 blur-[80px]" />
      <motion.div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[100vh] h-[60vh] rounded-b-full bg-construction-blue/20 blur-[60px]"
        animate={{ 
          opacity: [0.15, 0.3, 0.15],
          scale: [0.98, 1.02, 0.98]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          repeatType: "mirror"
        }}
      />

      {/* Animated glow spots */}
      <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse opacity-40" />
      <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse delay-1000 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm relative z-10"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 10 }}
        >
          <div className="relative group">
            {/* Card glow effect */}
            <motion.div 
              className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
              animate={{
                boxShadow: [
                  "0 0 10px 2px rgba(255,255,255,0.03)",
                  "0 0 15px 5px rgba(255,255,255,0.05)",
                  "0 0 10px 2px rgba(255,255,255,0.03)"
                ],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut", 
                repeatType: "mirror" 
              }}
            />

            {/* Traveling light beam effect */}
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
              {/* Top light beam */}
              <motion.div 
                className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  left: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  left: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror" },
                  filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror" }
                }}
              />
              
              {/* Right light beam */}
              <motion.div 
                className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  top: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  top: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 0.6 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 0.6 },
                  filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror", delay: 0.6 }
                }}
              />
              
              {/* Bottom light beam */}
              <motion.div 
                className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  right: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  right: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.2 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.2 },
                  filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror", delay: 1.2 }
                }}
              />
              
              {/* Left light beam */}
              <motion.div 
                className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  bottom: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  bottom: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.8 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.8 },
                  filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror", delay: 1.8 }
                }}
              />
              
              {/* Corner glow spots */}
              <motion.div 
                className="absolute top-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
                animate={{ 
                  opacity: [0.2, 0.4, 0.2] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              <motion.div 
                className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
                animate={{ 
                  opacity: [0.2, 0.4, 0.2] 
                }}
                transition={{ 
                  duration: 2.4, 
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 0.5
                }}
              />
              <motion.div 
                className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
                animate={{ 
                  opacity: [0.2, 0.4, 0.2] 
                }}
                transition={{ 
                  duration: 2.2, 
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 1
                }}
              />
              <motion.div 
                className="absolute bottom-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
                animate={{ 
                  opacity: [0.2, 0.4, 0.2] 
                }}
                transition={{ 
                  duration: 2.3, 
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 1.5
                }}
              />
            </div>

            {/* Card border glow */}
            <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-white/3 via-white/7 to-white/3 opacity-0 group-hover:opacity-70 transition-opacity duration-500" />
            
            {/* Glass card background */}
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.05] shadow-2xl overflow-hidden">
              {/* Subtle card inner patterns */}
              <div className="absolute inset-0 opacity-[0.03]" 
                style={{
                  backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                  backgroundSize: '30px 30px'
                }}
              />

            {/* Header */}
            <div className="text-center space-y-1 mb-6">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="mx-auto w-12 h-12 rounded-full border border-white/10 flex items-center justify-center relative overflow-hidden"
              >
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">M</span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
              >
                Recuperar email
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/60 text-xs"
              >
                Informe seu CPF ou CNPJ para recuperar o email
              </motion.p>
            </div>

            {/* Content */}
            {sent ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 text-center"
              >
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-white/80 text-sm">
                    Se existir uma conta associada ao {tipoPessoa === "fisica" ? "CPF" : "CNPJ"} <strong className="text-white">{cpfCnpj}</strong>, 
                    enviaremos um e-mail com suas informações de acesso.
                  </p>
                </div>

                <button
                  onClick={() => NavigationSafety.safeNavigate(navigate, '/login')}
                  className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm group px-4 py-2 -mx-4 -my-2 touch-manipulation cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Voltar ao login
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de pessoa */}
                <motion.div className="space-y-3">
                  <div className="flex gap-4">
                    <motion.label 
                      className={`flex items-center gap-2 cursor-pointer transition-colors ${
                        tipoPessoa === "fisica" ? 'text-white' : 'text-white/60'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <input
                        type="radio"
                        name="tipoPessoa"
                        value="fisica"
                        checked={tipoPessoa === "fisica"}
                        onChange={(e) => setTipoPessoa(e.target.value)}
                        className="w-4 h-4 text-construction-blue bg-construction-blue/10 border-construction-blue/30 focus:ring-construction-blue"
                      />
                      <span className="text-sm">Pessoa Física</span>
                    </motion.label>
                    
                    <motion.label 
                      className={`flex items-center gap-2 cursor-pointer transition-colors ${
                        tipoPessoa === "juridica" ? 'text-white' : 'text-white/60'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <input
                        type="radio"
                        name="tipoPessoa"
                        value="juridica"
                        checked={tipoPessoa === "juridica"}
                        onChange={(e) => setTipoPessoa(e.target.value)}
                        className="w-4 h-4 text-construction-blue bg-construction-blue/10 border-construction-blue/30 focus:ring-construction-blue"
                      />
                      <span className="text-sm">Pessoa Jurídica</span>
                    </motion.label>
                  </div>
                </motion.div>

                {/* CPF/CNPJ input */}
                <motion.div 
                  className={`relative ${focusedInput === "cpfCnpj" ? 'z-10' : ''}`}
                  whileFocus={{ scale: 1.02 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    {tipoPessoa === "fisica" ? (
                      <User className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                        focusedInput === "cpfCnpj" ? 'text-white' : 'text-white/40'
                      }`} />
                    ) : (
                      <Building2 className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                        focusedInput === "cpfCnpj" ? 'text-white' : 'text-white/40'
                      }`} />
                    )}
                    
                    <CustomInput
                      type="text"
                      placeholder={tipoPessoa === "fisica" ? "CPF" : "CNPJ"}
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                      onFocus={() => setFocusedInput("cpfCnpj" as any)}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full bg-construction-blue/10 border-construction-blue/20 focus:border-construction-blue text-white placeholder:text-white/50 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-construction-blue/15"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-construction-blue to-construction-blue/80 hover:from-construction-blue/90 hover:to-construction-blue/70 text-white border-0 h-10 transition-all duration-300"
                  >
                    Recuperar email
                  </Button>
                </motion.div>

                <div className="text-center">
                  <button
                    onClick={() => NavigationSafety.safeNavigate(navigate, '/login')}
                    className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm group px-4 py-2 -mx-4 -my-2 touch-manipulation cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Voltar ao login
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RecuperarEmail;