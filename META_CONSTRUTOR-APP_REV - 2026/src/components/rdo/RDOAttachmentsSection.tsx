import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Paperclip } from "lucide-react";
import { RDOFormData } from "@/schemas/rdoSchema";
import { FileUpload } from "@/components/FileUpload";

interface RDOAttachmentsSectionProps {
  form: UseFormReturn<RDOFormData>;
}

export function RDOAttachmentsSection({ form }: RDOAttachmentsSectionProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-construction-orange" />
          Anexos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <FileUpload
            onFilesUploaded={(uploadedFiles) => {
              // Extract raw files that are valid
              const rawFiles = uploadedFiles
                .map(f => f.file)
                .filter((f): f is File => f !== undefined);

              form.setValue('files', rawFiles);
            }}
            uploadType="all"
            maxSize={20}
          />

          <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded">
            💡 Você pode anexar fotos da obra, relatórios técnicos, notas fiscais ou qualquer outro documento relevante.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}