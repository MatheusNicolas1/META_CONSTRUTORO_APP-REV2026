
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowRight, User, Mail, Building2, CreditCard, Phone, FileText } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    company: z.string().optional(),
    cpf_cnpj: z.string().min(11, "CPF/CNPJ inválido").optional().or(z.literal("")),
    phone: z.string().min(10, "Telefone inválido").optional().or(z.literal("")),
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").optional(), // Added for sign up flow if needed
    confirmPassword: z.string().optional()
});

export type CheckoutFormData = z.infer<typeof formSchema>;

interface CheckoutFormProps {
    defaultValues: Partial<CheckoutFormData>;
    onSubmit: (data: CheckoutFormData) => void;
    loading?: boolean;
    showPasswordFields?: boolean;
}

export function CheckoutForm({ defaultValues, onSubmit, loading, showPasswordFields = true }: CheckoutFormProps) {
    const form = useForm<CheckoutFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            company: "",
            cpf_cnpj: "",
            phone: "",
            password: "",
            confirmPassword: "",
            ...defaultValues
        },
    });

    useEffect(() => {
        form.reset({
            name: defaultValues.name || "",
            email: defaultValues.email || "",
            company: defaultValues.company || "",
            cpf_cnpj: defaultValues.cpf_cnpj || "",
            phone: defaultValues.phone || "",
            password: "",
            confirmPassword: ""
        });
    }, [defaultValues, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="col-span-1 md:col-span-2">
                                <FormLabel>Nome Completo</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Seu nome completo" {...field} className="pl-9 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all duration-300" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="col-span-1 md:col-span-2">
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="seu@email.com" {...field} disabled={!!defaultValues.email} className={cn("pl-9 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all duration-300", defaultValues.email && "opacity-70 bg-muted/50")} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {showPasswordFields && (
                        <>
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Senha</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="********" {...field} className="bg-background/50 border-muted-foreground/20 focus:border-primary transition-all duration-300" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirmar Senha</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="********" {...field} className="bg-background/50 border-muted-foreground/20 focus:border-primary transition-all duration-300" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}

                    <div className="col-span-1 md:col-span-2 h-px bg-border/50 my-2" />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Celular / WhatsApp</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="(00) 00000-0000" {...field} className="pl-9 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all duration-300" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="cpf_cnpj"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>CPF / CNPJ</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="000.000.000-00" {...field} className="pl-9 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all duration-300" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                            <FormItem className="col-span-1 md:col-span-2">
                                <FormLabel>Nome da Construtora (Opcional)</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Sua empresa" {...field} className="pl-9 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all duration-300" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end pt-6">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto gap-2 h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Continuar para Pagamento
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </Form>
    );
}
