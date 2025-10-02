import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseclient";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/product/ProductCard";

interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  created_at: string;
  category?: string;
  tags?: string[]; // optional array of tags
}

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();

  const fetchHashtagProducts = async (tag: string) => {
    const { data, error } = await supabase
      .from<Product>("products")
      .select("*")
      .ilike("tags", `%${tag}%`) // assuming `tags` is a string array stored as text or JSON
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const { data: products, isLoading, error } = useQuery({
    queryKey: ["hashtag", tag],
    queryFn: () => fetchHashtagProducts(tag!),
    enabled: !!tag,
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
    return <p className="p-4 text-red-500">Failed to load hashtag products.</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">#{tag}</h1>
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          No products found for this hashtag.
        </p>
      )}
    </div>
  );
}

