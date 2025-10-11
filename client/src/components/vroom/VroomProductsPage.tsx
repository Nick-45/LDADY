// components/vroom/VroomProductsPage.tsx
import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { FaArrowLeft, FaStore } from "react-icons/fa";

export default function VroomProductsPage() {
  const [match, params] = useRoute("/vroom/:id");
  const [vroom, setVroom] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (params?.id) {
      fetchVroomAndProducts(params.id);
    }
  }, [params?.id]);

  // ✅ Fetch vroom info + creator + its products (each with seller info)
  const fetchVroomAndProducts = async (vroomId: string) => {
    try {
      setLoading(true);

      // 1️⃣ Fetch vroom info with creator details
      const { data: vroomData, error: vroomError } = await supabase
        .from("vrooms")
        .select(`
          id,
          name,
          description,
          coverImage_url,
          created_at,
          user_id,
          profiles (
            id,
            first_name,
            second_name,
            email,
            profile_image_url
          )
        `)
        .eq("id", vroomId)
        .single();

      if (vroomError || !vroomData) {
        throw new Error("Vroom not found");
      }

      setVroom(vroomData);

      // 2️⃣ Fetch products linked to this vroom (with seller profile)
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          price,
          currency,
          image_urls,
          created_at,
          user_id,
          profiles (
            id,
            first_name,
            second_name,
            profile_image_url
          )
        `)
        .eq("vroom_id", vroomId)
        .order("created_at", { ascending: false });

      if (productsError) {
        throw new Error("Failed to load products");
      }

      setProducts(productsData || []);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to load vroom data",
        variant: "destructive",
      });
      setVroom(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!vroom) {
    return (
      <div className="container mx-auto p-4 text-center text-muted-foreground">
        Vroom not found
      </div>
    );
  }

  const creator = vroom.profiles;

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
        >
          <FaArrowLeft className="mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          {vroom.coverImage_url ? (
            <img
              src={vroom.coverImage_url}
              alt={vroom.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
              <FaStore className="text-2xl text-muted-foreground/50" />
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold">{vroom.name}</h1>
            {vroom.description && (
              <p className="text-muted-foreground">{vroom.description}</p>
            )}

            {creator && (
              <p className="text-sm text-muted-foreground mt-1">
                Created by{" "}
                <span className="font-semibold">
                  {creator.first_name} {creator.second_name}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <FaStore className="text-4xl text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No products yet</h3>
          <p className="text-muted-foreground">
            This vroom doesn't have any products added yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showAddToVroom={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
