import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient"; // your Supabase client
import ProductPostActions from "@/components/product/ProductPostActions";

interface ProductPostProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency?: string;
    imageUrls?: string[];
    createdAt: string;
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImageUrl?: string;
    };
  };
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  NGN: "₦",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
  EGP: "£",
  XOF: "CFA",
};

export default function ProductPost({ product }: ProductPostProps) {
  const [, setLocation] = useLocation();

  const [likes, setLikes] = useState<number>(0);
  const [comments, setComments] = useState<number>(0);
  const [shares, setShares] = useState<number>(0);

  const currencySymbol = product.currency
    ? CURRENCY_SYMBOLS[product.currency] || product.currency
    : "KSh";

  useEffect(() => {
    // Fetch product interactions from Supabase
    const fetchInteractions = async () => {
      const { data: likesData } = await supabase
        .from("product_likes")
        .select("id", { count: "exact" })
        .eq("product_id", product.id);
      setLikes(likesData?.length || 0);

      const { data: commentsData } = await supabase
        .from("product_comments")
        .select("id", { count: "exact" })
        .eq("product_id", product.id);
      setComments(commentsData?.length || 0);

      const { data: sharesData } = await supabase
        .from("product_shares")
        .select("id", { count: "exact" })
        .eq("product_id", product.id);
      setShares(sharesData?.length || 0);
    };

    fetchInteractions();
  }, [product.id]);

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "now";
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  const mainImage =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls[0]
      : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400";

  return (
    <div
      className="p-6 hover:bg-muted/30 transition-colors cursor-pointer rounded-lg"
      data-testid={`product-post-${product.id}`}
      onClick={() => setLocation(`/products/${product.id}`)}
    >
      <div className="flex space-x-3">
        {/* Profile Picture */}
        {product.user?.profileImageUrl ? (
          <img
            src={product.user.profileImageUrl}
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover"
            data-testid={`user-avatar-${product.user.id}`}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">
              {product.user?.firstName?.[0] || "?"}
            </span>
          </div>
        )}

        <div className="flex-1 space-y-3">
          {/* User Info */}
          <div className="flex items-center space-x-2">
            <span
              className="font-semibold"
              data-testid={`user-name-${product.id}`}
            >
              {product.user?.firstName} {product.user?.lastName}
            </span>
            <span
              className="text-muted-foreground text-sm"
              data-testid={`user-handle-${product.id}`}
            >
              @{product.user?.username || "user"}
            </span>
            <span className="text-muted-foreground text-sm">·</span>
            <span
              className="text-muted-foreground text-sm"
              data-testid={`post-timestamp-${product.id}`}
            >
              {getTimeAgo(product.createdAt)}
            </span>
          </div>

          {/* Product Content */}
          <div className="space-y-3">
            <p data-testid={`product-description-${product.id}`}>
              {product.description}
            </p>

            {/* Product Image */}
            <img
              src={mainImage}
              alt={product.name}
              className="rounded-xl w-full object-cover"
              data-testid={`product-image-${product.id}`}
            />

            {/* Product Details */}
            <div className="bg-secondary/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4
                  className="font-semibold text-lg"
                  data-testid={`product-name-${product.id}`}
                >
                  {product.name}
                </h4>
                <span
                  className="text-xl font-bold text-primary"
                  data-testid={`product-price-${product.id}`}
                >
                  {currencySymbol} {product.price}
                </span>
              </div>
              {product.currency && (
                <p className="text-sm text-muted-foreground">
                  Currency: {product.currency}
                </p>
              )}
            </div>
          </div>

          {/* Social Actions */}
          <ProductPostActions
            product={{ ...product, likes, comments, shares }}
          />
        </div>
      </div>
    </div>
  );
}
