import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FileText, Calendar, Building2, Clock, Sun, Cloud, CloudRain, CloudSnow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/DatePicker";
import { RDOFormData } from "@/schemas/rdoSchema";

interface RDOFormHeaderProps {
  form: UseFormReturn<RDOFormData>;
}

const climaOptions = [
  { value: "Ensolarado", label: "Ensolarado", icon: Sun, color: "text-yellow-500" },
  { value: "Parcialmente Nublado", label: "Parcialmente Nublado", icon: Cloud, color: "text-gray-500" },
  { value: "Nublado", label: "Nublado", icon: Cloud, color: "text-gray-600" },
  { value: "Chuvoso", label: "Chuvoso", icon: CloudRain, color: "text-blue-500" },
  { value: "Tempestade", label: "Tempestade", icon: CloudSnow, color: "text-blue-700" },
];

import { useObras } from "@/hooks/useObras";
import { Skeleton } from "@/components/ui/skeleton";

// Mock removed


export function RDOFormHeader({ form }: RDOFormHeaderProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [equipeOciosa, setEquipeOciosa] = useState(false);
  const { obras, isLoading: isLoadingObras } = useObras();

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-construction-orange" />
          Informações Básicas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data */}
          <FormField
            control={form.control}
            name="data"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data do Relatório *
                </FormLabel>
                <FormControl>
                  <DatePicker
                    date={selectedDate}
                    onDateChange={(date) => {
                      setSelectedDate(date);
                      field.onChange(date?.toISOString().split('T')[0] || '');
                    }}
                    placeholder="Selecione a data"
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Obra */}
          <FormField
            control={form.control}
            name="obraId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Obra *
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a obra" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingObras ? (
                      <div className="p-2 text-sm text-muted-foreground">Carregando obras...</div>
                    ) : (
                      obras.map((obra) => (
                        <SelectItem key={obra.id} value={obra.id.toString()}>
                          {obra.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Clima */}
          <FormField
            control={form.control}
            name="clima"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condições Climáticas *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o clima" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {climaOptions.map((clima) => {
                      const Icon = clima.icon;
                      return (
                        <SelectItem key={clima.value} value={clima.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${clima.color}`} />
                            {clima.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Equipe Ociosa */}
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="equipeOciosa"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setEquipeOciosa(checked === true);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Equipe ficou ociosa?</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Marque se houve tempo de inatividade da equipe
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {equipeOciosa && (
              <FormField
                control={form.control}
                name="tempoOcioso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Tempo ocioso (horas)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}