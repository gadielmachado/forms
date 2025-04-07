
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
  currentImageUrl?: string | null;
}

const ImageUpload = ({ onImageUpload, currentImageUrl }: ImageUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("form-images")
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("form-images")
        .getPublicUrl(data.path);

      onImageUpload(publicUrl);

      toast({
        title: "Sucesso",
        description: "Imagem carregada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar imagem",
        variant: "destructive",
      });
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className="flex h-[500px] w-[500px] flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer relative"
      onClick={() => fileInputRef.current?.click()}
    >
      {currentImageUrl ? (
        <img
          src={currentImageUrl}
          alt="Form"
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <Button variant="link" className="text-primary" disabled={uploading}>
              {uploading ? "Carregando..." : "Upload"}
            </Button>
            <span className="text-sm text-gray-500"> ou Procurar</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Faça um upload de uma imagem
          </p>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={uploading}
      />
    </div>
  );
};

export default ImageUpload;
