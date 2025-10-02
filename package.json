import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import ProductCard from "@/components/product/ProductCard";
import VroomCard from "@/components/vroom/VroomCard";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";

// --- Profile component ---
export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"products" | "vrooms" | "bookmarks" | "following">("products");

  // --- Fetch profile data ---
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // --- Fetch user's products ---
  const productsQuery = useQuery({
    queryKey: ["userProducts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // --- Fetch user's vrooms ---
  const vroomsQuery = useQuery({
    queryKey: ["userVrooms", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("vrooms")
        .select(`
          *,
          products:products(id),
          followers:vroom_follows(id)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return data.map(vroom => ({
        ...vroom,
        _count: {
          products: vroom.products?.length || 0,
          followers: vroom.followers?.length || 0,
          views: vroom._count?.views || 0,
        },
      }));
    },
    enabled: !!user,
  });

  // --- Fetch bookmarks ---
  const bookmarksQuery = useQuery({
    queryKey: ["userBookmarks", user?.id],
    queryFn: async () => {
      if (!user || activeTab !== "bookmarks") return [];
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*, product:products(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && activeTab === "bookmarks",
  });

  // --- Fetch following ---
  const followingQuery = useQuery({
    queryKey: ["userFollowing", user?.id],
    queryFn: async () => {
      if (!user || activeTab !== "following") return [];
      const { data, error } = await supabase
        .from("follows")
        .select("following:profiles(*)")
        .eq("follower_id", user.id);
      if (error) throw error;
      return data?.map(f => f.following) || [];
    },
    enabled: !!user && activeTab === "following",
  });

  // --- Profile form ---
  const form = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: profileQuery.data?.bio || "",
      location: profileQuery.data?.location || "",
      website: profileQuery.data?.website || "",
      twitter: profileQuery.data?.twitter || "",
      instagram: profileQuery.data?.instagram || "",
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        bio: profileQuery.data.bio || "",
        location: profileQuery.data.location || "",
        website: profileQuery.data.website || "",
        twitter: profileQuery.data.twitter || "",
        instagram: profileQuery.data.instagram || "",
      });
    }
  }, [profileQuery.data, user, form]);

  // --- Update profile ---
  const updateProfileMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(values)
        .eq("id", user?.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Profile updated", description: "Your profile has been successfully updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => updateProfileMutation.mutate(data);

  // --- Loading states ---
  if (profileQuery.isLoading || productsQuery.isLoading) return <Skeleton className="h-80 w-full" />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64 mr-80">
        {/* Render products */}
        {activeTab === "products" &&
          (productsQuery.data?.length
            ? productsQuery.data.map((p: any) => <ProductCard key={p.id} product={p} />)
            : <p>No products yet</p>
          )}

        {/* Render vrooms */}
        {activeTab === "vrooms" &&
          (vroomsQuery.data?.length
            ? vroomsQuery.data.map((v: any) => <VroomCard key={v.id} vroom={v} />)
            : <p>No vrooms yet</p>
          )}

        {/* Render bookmarks */}
        {activeTab === "bookmarks" && (
          bookmarksQuery.isLoading ? <Skeleton className="h-80 w-full" /> :
          bookmarksQuery.data?.length
            ? bookmarksQuery.data.map((b: any) => <ProductCard key={b.id} product={b.product || b} />)
            : <p>No bookmarks yet</p>
        )}

        {/* Render following */}
        {activeTab === "following" && (
          followingQuery.isLoading ? <Skeleton className="h-12 w-full rounded-md" /> :
          followingQuery.data?.length
            ? followingQuery.data.map((f: any) => <div key={f.id}>{f.firstName} {f.lastName}</div>)
            : <p>Not following anyone yet</p>
        )}
      </div>
      <RightSidebar />
    </div>
  );
}
