import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SocialShareButton } from "@/components/social/SocialShareButton";

// FALSO-054: onShareSuccess removido — nunca invocado em runtime. Ver SocialShareButton.tsx.
interface SocialShareProps {
  title: string;
  text: string;
  url?: string;
  imageUrl?: string;
  obraId?: string;
  rdoId?: string;
  compact?: boolean;
}

export const SocialShare = ({
  title,
  text,
  url,
  imageUrl,
  obraId,
  rdoId,
  compact
}: SocialShareProps) => {
  return (
    <SocialShareButton
      title={title}
      description={text}
      imageUrl={imageUrl}
      obraId={obraId}
      rdoId={rdoId}
      compact={compact}
    />
  );
};
