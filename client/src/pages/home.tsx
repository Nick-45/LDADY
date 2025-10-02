import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient"; // Vite-compatible Supabase client
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import ProductPost from "@/components/product/ProductPost";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Define TypeScript interface for Product
interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  created_at: string;
}

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Fetch products from Supabase
  const { data: products, isLoading: productsLoading, error, refetch } = useQuery<Product[]>({
    queryKey: ["products"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data, error } = await supabase
        .from<Product>("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    retry: false,
  });

  // Handle auth & errors
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "You need to log in to view this content",
        variant: "destructive",
      });
      setShouldRedirect(true);
    } else if (error) {
      toast({
        title: "Error loading products",
        description: error.message,
        variant: "destructive",
      });
      setShouldRedirect(true);
    }

    if (shouldRedirect) {
      const timer = setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading, error, toast, shouldRedirect]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Redirecting to login...</h2>
          <p>Please wait while we redirect you to the login page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 ml-20 mr-64">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl border-x border-gray-200 min-h-screen bg-white">
            {/* Header */}
            <div className="sticky top-0 bg-card/80 backdrop-blur-sm border-b border-border p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Home</h2>
                {error && (
                  <button
                    onClick={() => refetch()}
                    className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>

            {/* Product Feed */}
            <div className="divide-y divide-border">
              {productsLoading ? (
                <div className="space-y-6 p-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-6">
                      <CardContent className="space-y-4">
                        <div className="flex space-x-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                        </div>
                        <Skeleton className="h-48 w-full rounded-xl" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : products && products.length > 0 ? (
                products.map((product) => <ProductPost key={product.id} product={product} />)
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <p className="mb-4">No products found.</p>
                  <p>Start following users or explore trending products!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <RightSidebar />
    </div>
  );
}
