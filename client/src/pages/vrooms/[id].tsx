import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/product/ProductCard";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function VroomDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["vroom", id],
    queryFn: async () => {
      if (!id) return null;

      // Fetch the vroom from Supabase
      const { data: vroom, error } = await supabase
        .from("vrooms")
        .select(`
          *,
          products (*)
        `)
        .eq("id", id)
        .single(); // get a single row

      if (error) throw error;
      return vroom;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="p-4 text-red-500">Failed to load vroom.</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{data?.name}</h1>
      {data?.products?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No products in this vroom yet.</p>
      )}
    </div>
  );
}
