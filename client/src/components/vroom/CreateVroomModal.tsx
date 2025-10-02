import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient"; // ✅ Use your Supabase client
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaPlus, FaStore, FaCamera, FaLink, FaTimes } from "react-icons/fa";

interface CreateVroomModalProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CreateVroomModal({ trigger, isOpen, onClose }: CreateVroomModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: true,
  });
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createVroomMutation = useMutation({
    mutationFn: async (data: any) => {
      // Insert into Supabase 'vrooms' table
      const { data: vroom, error } = await supabase.from("vrooms").insert([data]).select().single();
      if (error) throw error;
      return vroom;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vroom created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["vrooms"] });
      queryClient.invalidateQueries({ queryKey: ["vrooms-user"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create vroom",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({ title: "Error", description: "File too large (max 5MB)", variant: "destructive" });
      return;
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from("vroom-covers").upload(fileName, file);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    const publicUrl = supabase.storage.from("vroom-covers").getPublicUrl(fileName).data.publicUrl;
    setCoverImageUrl(publicUrl || "");
    toast({ title: "Success", description: "Cover image uploaded successfully!" });
  };

  const handleAddUrlImage = () => {
    if (!imageUrlInput) return toast({ title: "Error", description: "Enter image URL", variant: "destructive" });
    try {
      new URL(imageUrlInput); // validate URL
      setCoverImageUrl(imageUrlInput);
      setImageUrlInput("");
      toast({ title: "Success", description: "Image URL added!" });
    } catch {
      toast({ title: "Error", description: "Invalid URL", variant: "destructive" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast({ title: "Error", description: "Vroom name required", variant: "destructive" });

    createVroomMutation.mutate({
      ...formData,
      cover_image_url: coverImageUrl || null,
    });
  };

  const handleClose = () => {
    setFormData({ name: "", description: "", isPublic: true });
    setCoverImageUrl("");
    setImageUrlInput("");
    setActiveTab("upload");
    if (onClose) onClose();
    else setModalOpen(false);
  };

  const open = isOpen !== undefined ? isOpen : modalOpen;
  const setOpen = isOpen !== undefined ? (onClose || (() => {})) : setModalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <FaPlus /> Create Vroom
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaStore className="text-primary" /> Create New Vroom
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Vroom Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter vroom name..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your vroom..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-3">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <FaCamera className="h-3 w-3" /> Upload
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <FaLink className="h-3 w-3" /> URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-3">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaCamera className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Paste image URL here"
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddUrlImage} disabled={!imageUrlInput}>
                    Add Image
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {coverImageUrl && (
              <div className="mt-3 relative">
                <img src={coverImageUrl} alt="Cover preview" className="w-full h-32 object-cover rounded-lg" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => setCoverImageUrl("")}
                >
                  <FaTimes className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
            />
            <Label htmlFor="public">Make this vroom public</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={createVroomMutation.isPending} className="flex-1">
              {createVroomMutation.isPending ? "Creating..." : "Create Vroom"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
