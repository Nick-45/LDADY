import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import ProductCard from "@/components/product/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FaSearch, 
  FaCompass, 
  FaFire, 
  FaHashtag, 
  FaStore, 
  FaUser, 
  FaShoppingBag,
  FaHeart,
  FaStar,
  FaFilter,
  FaChevronUp,
  FaSort,
  FaList
} from "react-icons/fa";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SearchType = 'all' | 'products' | 'users' | 'vrooms';
type SortBy = 'recent' | 'popular' | 'price_low' | 'price_high' | 'likes' | 'views';

const categories = [
  { id: 'all', name: 'All Categories', icon: FaCompass },
  { id: 'handmade', name: 'Handmade', icon: FaHeart },
  { id: 'vintage', name: 'Vintage', icon: FaStar },
  { id: 'furniture', name: 'Furniture', icon: FaStore },
  { id: 'jewelry', name: 'Jewelry', icon: FaShoppingBag },
  { id: 'art', name: 'Art & Crafts', icon: FaHeart },
  { id: 'clothing', name: 'Clothing', icon: FaUser },
];

const trendingHashtags = [
  { tag: "#handmade", count: "2.4K" },
  { tag: "#vintage", count: "1.8K" },
  { tag: "#furniture", count: "1.2K" },
  { tag: "#jewelry", count: "956" },
  { tag: "#art", count: "743" },
  { tag: "#clothing", count: "634" },
  { tag: "#decor", count: "521" },
  { tag: "#accessories", count: "409" },
];

interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  likes?: number;
  views?: number;
  created_at: string;
  category?: string;
}

export default function Explore() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Header height
  useEffect(() => {
    if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
  }, []);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) setIsHeaderVisible(false);
      else setIsHeaderVisible(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => window.location.href = "/api/login", 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch products from Supabase
  const fetchProducts = async (query?: string) => {
    let supabaseQuery = supabase
      .from<Product>("products")
      .select("*");

    if (query) supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
    if (selectedCategory !== 'all') supabaseQuery = supabaseQuery.eq('category', selectedCategory);

    // Sorting
    switch (sortBy) {
      case 'recent':
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
        break;
      case 'price_low':
        supabaseQuery = supabaseQuery.order('price', { ascending: true });
        break;
      case 'price_high':
        supabaseQuery = supabaseQuery.order('price', { ascending: false });
        break;
      case 'likes':
        supabaseQuery = supabaseQuery.order('likes', { ascending: false });
        break;
      case 'views':
        supabaseQuery = supabaseQuery.order('views', { ascending: false });
        break;
      default:
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
    }

    const { data, error } = await supabaseQuery;
    if (error) throw error;
    return data || [];
  };

  // React Query hooks
  const { data: featuredProducts, isLoading: featuredLoading, error: featuredError, refetch: refetchFeatured } = useQuery({
    queryKey: ['featuredProducts', selectedCategory, sortBy],
    queryFn: () => fetchProducts(),
    enabled: isAuthenticated,
    retry: false
  });

  const { data: trendingProducts, isLoading: trendingLoading, error: trendingError } = useQuery({
    queryKey: ['trendingProducts'],
    queryFn: () => supabase
      .from<Product>('products')
      .select('*')
      .order('likes', { ascending: false })
      .limit(12)
      .then(({ data, error }) => { if (error) throw error; return data || [] }),
    enabled: isAuthenticated,
    retry: false
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['searchProducts', activeSearchQuery, selectedCategory, sortBy],
    queryFn: () => fetchProducts(activeSearchQuery),
    enabled: !!activeSearchQuery && isAuthenticated,
    retry: false
  });

  // Error handling
  useEffect(() => {
    const errors = [featuredError, trendingError].filter(Boolean);
    for (const error of errors) {
      if (error && isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
    }
  }, [featuredError, trendingError, toast]);

  const handleSearch = () => setActiveSearchQuery(searchQuery.trim());
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId !== 'all') {
      setSearchQuery(`#${categoryId}`);
      setActiveSearchQuery(`#${categoryId}`);
    } else {
      setSearchQuery("");
      setActiveSearchQuery("");
    }
  };
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Skeleton className="h-8 w-32" /></div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 ml-16 lg:ml-64 mr-0 lg:mr-80">
        <div className="flex">
          <div className="flex-1 w-full border-x border-border min-h-screen overflow-x-hidden">
            {/* Header */}
            <div 
              ref={headerRef}
              className={`sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 transition-transform duration-300 z-10 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <FaCompass className="text-primary text-xl" />
                <h2 className="text-xl font-bold">Explore</h2>
              </div>

              {/* Search Bar */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products, users, vrooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch}><FaSearch /></Button>
              </div>
            </div>

            {/* Categories */}
            <div className="p-4 border-b border-border flex gap-2 flex-wrap">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <Button
                    key={category.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryClick(category.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{category.name}</span>
                  </Button>
                );
              })}
            </div>

            {/* Tabs and Product Grid */}
            <Tabs defaultValue="discover" className="flex-1">
              <TabsList className="w-full justify-start border-b border-border rounded-none h-12 bg-transparent p-0 sticky z-10 bg-background" style={{ top: isHeaderVisible ? `${headerHeight}px` : '0' }}>
                <TabsTrigger value="discover" className="flex items-center gap-2 px-3 sm:px-6"><FaCompass /> <span className="hidden sm:inline">Discover</span></TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center gap-2 px-3 sm:px-6"><FaFire /> <span className="hidden sm:inline">Trending</span></TabsTrigger>
                <TabsTrigger value="hashtags" className="flex items-center gap-2 px-3 sm:px-6"><FaHashtag /> <span className="hidden sm:inline">Hashtags</span></TabsTrigger>
              </TabsList>

              {/* Discover */}
              <TabsContent value="discover" className="p-4">
                {activeSearchQuery ? (
                  searchLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                    </div>
                  ) : searchResults && searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.map(product => <ProductCard key={product.id} product={product} />)}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FaSearch className="mx-auto text-4xl mb-4 opacity-50" />
                      <p>No results found for "{activeSearchQuery}"</p>
                    </div>
                  )
                ) : featuredLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                  </div>
                ) : featuredProducts && featuredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredProducts.slice(0, 15).map(product => <ProductCard key={product.id} product={product} />)}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">No products available</div>
                )}
              </TabsContent>

              {/* Trending */}
              <TabsContent value="trending" className="p-4">
                {trendingLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                  </div>
                ) : trendingProducts && trendingProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trendingProducts.map(product => <ProductCard key={product.id} product={product} />)}
                  </div>
                ) : <div className="text-center py-12 text-muted-foreground">No trending products</div>}
              </TabsContent>

              {/* Hashtags */}
              <TabsContent value="hashtags" className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendingHashtags.map((hashtag, index) => (
                    <Card key={hashtag.tag} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleCategoryClick(hashtag.tag.replace('#',''))}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><FaHashtag className="text-primary" /></div>
                          <div>
                            <p className="font-semibold text-primary">{hashtag.tag}</p>
                            <p className="text-sm text-muted-foreground">{hashtag.count} products</p>
                          </div>
                        </div>
                        <Badge variant="secondary">#{index + 1}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <RightSidebar />

      {!isHeaderVisible && (
        <Button onClick={scrollToTop} className="fixed bottom-6 right-6 lg:right-80 rounded-full w-12 h-12 p-0 z-40" size="icon">
          <FaChevronUp />
        </Button>
      )}
    </div>
  );
}
