import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/product/ProductCard";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  likes?: number;
  views?: number;
}

interface Vroom {
  id: string;
  name: string;
  description?: string;
  products?: Product[];
}

export default function VroomDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<Vroom>({
    queryKey: ["vroom", id],
    queryFn: async () => {
      // Fetch vroom info
      const { data: vroomData, error: vroomError } = await supabase
        .from<Vroom>("vrooms")
        .select("*")
        .eq("id", id)
        .single();

      if (vroomError) throw vroomError;

      // Fetch products belonging to this vroom
      const { data: productsData, error: productsError } = await supabase
        .from<Product>("products")
        .select("*")
        .eq("vroom_id", id);

      if (productsError) throw productsError;

      return { ...vroomData, products: productsData };
    },
    enabled: !!id,
    retry: false,
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
      {data?.products && data.products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No products in this vroom yet.</p>
      )}
    </div>
  );
}
