// components/product/ProductDetailPage.tsx
import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  FaShoppingCart, 
  FaShare, 
  FaHeart, 
  FaArrowLeft, 
  FaStore 
} from "react-icons/fa";
import MessageSellerButton from "@/components/product/MessageSellerButton";
import ProductCommentsModal from "@/components/product/ProductCommentsModal";
import AddProductToVroomModal from "@/components/vroom/AddProductToVroomModal";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";

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

export default function ProductDetailPage() {
  const [match, params] = useRoute("/products/:id");
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showVroomModal, setShowVroomModal] = useState(false);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (params?.id) fetchProduct(params.id);
  }, [params?.id]);

  // ✅ Fetch product + seller profile directly from Supabase
  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          price,
          currency,
          image_urls,
          likes,
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
        .eq("id", productId)
        .single();

      if (error || !data) {
        toast({
          title: "Error",
          description: "Failed to load product details.",
          variant: "destructive",
        });
        setProduct(null);
      } else {
        setProduct(data);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading the product.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product.id);
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      });
    }
  };

  const handleShare = async () => {
    try {
      const productUrl = `${window.location.origin}/products/${product.id}`;
      await navigator.clipboard.writeText(productUrl);
      toast({
        title: "Link Copied!",
        description: "Product link copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link. Try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Product not found
      </div>
    );
  }

  const mainImage =
    product.image_urls?.length > 0
      ? product.image_urls[selectedImage]
      : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&h=600";

  const currencySymbol =
    CURRENCY_SYMBOLS[product.currency] || "KSh";

  const displayPrice =
    typeof product.price === "number"
      ? product.price.toFixed(2)
      : product.price;

  const seller = product.profiles;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="mb-6"
          >
            <FaArrowLeft className="mr-2" /> Back
          </Button>

          {/* Product Image */}
          <div>
            <img
              src={mainImage}
              alt={product.name}
              className="w-full object-cover rounded-lg"
            />
            {product.image_urls?.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {product.image_urls.map((url: string, index: number) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${product.name} ${index + 1}`}
                    className={`w-full h-20 object-cover rounded cursor-pointer border-2 ${
                      selectedImage === index
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-2xl font-bold text-primary mb-4">
                {currencySymbol}
                {displayPrice}
              </p>
              <p className="text-muted-foreground mb-4">
                {product.description}
              </p>
            </div>

            {/* Seller Section */}
            {seller && (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                {seller.profile_image_url ? (
                  <img
                    src={seller.profile_image_url}
                    alt="Seller"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {seller.first_name?.[0]}
                      {seller.second_name?.[0]}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold">
                    {seller.first_name} {seller.second_name}
                  </p>
                  <p className="text-sm text-muted-foreground">Seller</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button onClick={handleAddToCart} className="w-full" size="lg">
                <FaShoppingCart className="mr-2" /> Add to Cart
              </Button>

              <div className="flex gap-2">
                <Button onClick={handleShare} variant="outline" className="flex-1">
                  <FaShare className="mr-2" /> Share
                </Button>

                {isAuthenticated && seller?.id && (
                  <MessageSellerButton
                    sellerId={seller.id}
                    sellerName={`${seller.first_name} ${seller.second_name}`}
                    productName={product.name}
                    variant="outline"
                    className="flex-1"
                  />
                )}
              </div>

              {isAuthenticated && (
                <Button
                  variant="ghost"
                  onClick={() => setShowVroomModal(true)}
                  className="w-full"
                >
                  <FaStore className="mr-2" /> Add to Vroom
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => setShowCommentsModal(true)}
                className="w-full"
              >
                <FaHeart className="mr-2" /> View Comments
              </Button>
            </div>

            {product.likes !== undefined && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FaHeart /> {product.likes} likes
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showVroomModal && (
          <AddProductToVroomModal
            isOpen={showVroomModal}
            onClose={() => setShowVroomModal(false)}
            productId={product.id}
            productName={product.name}
          />
        )}

        {showCommentsModal && (
          <ProductCommentsModal
            isOpen={showCommentsModal}
            onClose={() => setShowCommentsModal(false)}
            product={product}
          />
        )}
      </div>

      <RightSidebar />
    </div>
  );
}
