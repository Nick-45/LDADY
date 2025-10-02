import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient"; // ✅ Use your Supabase client
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FaStore, FaCheck } from "react-icons/fa";

interface AddProductToVroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export default function AddProductToVroomModal({
  isOpen,
  onClose,
  productId,
  productName,
}: AddProductToVroomModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's vrooms
  const { data: userVrooms, isLoading } = useQuery({
    queryKey: ["vrooms-user", user?.id],
    enabled: isOpen && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vrooms")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch which vrooms currently include this product
  const { data: productVrooms } = useQuery({
    queryKey: ["product-vrooms", productId],
    enabled: isOpen && !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vroom_products")
        .select("vroom_id")
        .eq("product_id", productId);
      if (error) throw error;
      return data?.map((row) => row.vroom_id) || [];
    },
  });

  const addToVroomMutation = useMutation({
    mutationFn: async (vroomId: string) => {
      const { data, error } = await supabase
        .from("vroom_products")
        .insert([{ vroom_id: vroomId, product_id: productId }]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product added to vroom!" });
      queryClient.invalidateQueries({ queryKey: ["vrooms-user", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["product-vrooms", productId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add product", variant: "destructive" });
    },
  });

  const removeFromVroomMutation = useMutation({
    mutationFn: async (vroomId: string) => {
      const { data, error } = await supabase
        .from("vroom_products")
        .delete()
        .match({ vroom_id: vroomId, product_id: productId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product removed from vroom!" });
      queryClient.invalidateQueries({ queryKey: ["vrooms-user", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["product-vrooms", productId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove product", variant: "destructive" });
    },
  });

  const handleVroomToggle = (vroomId: string) => {
    const isInVroom = productVrooms?.includes(vroomId);
    if (isInVroom) removeFromVroomMutation.mutate(vroomId);
    else addToVroomMutation.mutate(vroomId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaStore className="text-primary" />
            Add "{productName}" to Vroom
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : userVrooms && userVrooms.length > 0 ? (
            <div className="space-y-3">
              {userVrooms.map((vroom: any) => {
                const isInVroom = productVrooms?.includes(vroom.id);
                const isProcessing = addToVroomMutation.isLoading || removeFromVroomMutation.isLoading;

                return (
                  <Card
                    key={vroom.id}
                    className={`cursor-pointer transition-all ${isInVroom ? "ring-2 ring-primary" : "hover:shadow-md"}`}
                    onClick={() => !isProcessing && handleVroomToggle(vroom.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      {vroom.cover_image_url ? (
                        <img
                          src={vroom.cover_image_url}
                          alt={vroom.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <FaStore className="text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1">
                        <h4 className="font-medium">{vroom.name}</h4>
                        {vroom.description && <p className="text-sm text-muted-foreground line-clamp-1">{vroom.description}</p>}
                      </div>

                      <div className="flex items-center">
                        {isInVroom ? (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <FaCheck className="text-primary-foreground text-xs" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FaStore className="mx-auto text-4xl mb-4 opacity-50" />
              <p>You don't have any vrooms yet.</p>
              <p className="text-sm">Create a vroom first to organize your products!</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
