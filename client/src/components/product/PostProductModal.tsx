import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "NGN", label: "NGN (₦)" },
  { value: "GHS", label: "GHS (₵)" },
  { value: "KES", label: "KES (KSh)" },
  { value: "ZAR", label: "ZAR (R)" },
  { value: "EGP", label: "EGP (£)" },
  { value: "XOF", label: "XOF (CFA)" },
];

interface PostProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PostProductModal({ isOpen, onClose }: PostProductModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "KES",
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not logged in");

      let finalImageUrl = formData.imageUrl;

      // If user uploaded a file, upload it to Supabase storage
      if (imageFile) {
        setUploading(true);
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData?.publicUrl;
        setUploading(false);
      }

      if (!finalImageUrl) {
        throw new Error("Please provide an image (upload or URL)");
      }

      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            currency: formData.currency,
            image_url: [finalImageUrl],
            user_id: user.id,
          },
        ]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product posted successfully" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setFormData({ name: "", description: "", price: "", currency: "KES", imageUrl: "" });
      setImageFile(null);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post product",
        variant: "destructive",
      });
      setUploading(false);
    },
  });

  const getCurrencySymbol = () => {
    const selected = CURRENCIES.find((c) => c.value === formData.currency);
    if (!selected) return "KSh";
    if (selected.label.includes("(")) return selected.label.split("(")[1].replace(")", "");
    return selected.value;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl && !imageFile) {
      toast({
        title: "Error",
        description: "Please upload an image or provide an image URL.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post a New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Enter product name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              required
              placeholder="Enter product description"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center border rounded-md overflow-hidden">
                <span className="px-3 whitespace-nowrap text-gray-600 bg-gray-100">
                  {getCurrencySymbol()}
                </span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  required
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                />
              </div>

              <div className="w-40">
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Image Upload or URL */}
          <div className="space-y-2">
            <Label>Product Image (Upload or URL) *</Label>

            <div className="space-y-2">
              <Input
                id="imageFile"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImageFile(file);
                  if (file) setFormData((prev) => ({ ...prev, imageUrl: "" }));
                }}
              />

              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, imageUrl: e.target.value }));
                  if (e.target.value) setImageFile(null);
                }}
                placeholder="https://example.com/image.jpg"
              />

              {(imageFile || formData.imageUrl) && (
                <div className="mt-2">
                  <Label>Preview:</Label>
                  <img
                    src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={mutation.isPending || uploading} className="w-full">
            {uploading
              ? "Uploading..."
              : mutation.isPending
              ? "Posting..."
              : "Post Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
