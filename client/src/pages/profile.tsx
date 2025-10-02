import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import ProductCard from "@/components/product/ProductCard";
import VroomCard from "@/components/vroom/VroomCard";
import CreateVroomModal from "@/components/vroom/CreateVroomModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { UploadResult } from "@uppy/core";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "vrooms" | "bookmarks" | "following">("products");

  // --- React Query v5 Queries ---

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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

  const bookmarksQuery = useQuery({
    queryKey: ["userBookmarks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("bookmarks")
        .select(`*, product:products(*)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && activeTab === "bookmarks",
  });

  const followingQuery = useQuery({
    queryKey: ["userFollowing", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("follows")
        .select(`following:profiles(*)`)
        .eq("follower_id", user.id);
      if (error) throw error;
      return data?.map(f => f.following) || [];
    },
    enabled: !!user && activeTab === "following",
  });

  // --- React Hook Form ---
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

  // --- Mutation for updating profile ---
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
      setEditModalOpen(false);
      profileQuery.refetch(); // refresh profile
    },
    onError: (error: any) => {
      console.error(error);
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => updateProfileMutation.mutate(data);

  // --- Image Upload ---
  const handleImageUpload = async (result: UploadResult, type: "profile" | "banner") => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const column = type === "profile" ? "profileImageUrl" : "bannerImageUrl";
      const { error } = await supabase
        .from("profiles")
        .update({ [column]: uploadedFile.uploadURL })
        .eq("id", user?.id);
      if (error) {
        toast({ title: "Error", description: `Failed to update ${type} image`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: `${type} image updated` });
        profileQuery.refetch();
      }
    }
  };

  // --- Loading States ---
  if (profileQuery.isLoading) return <Skeleton className="h-80 w-full" />;

  // --- Render Tab Content ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "products":
        if (productsQuery.isLoading) return <Skeleton className="h-80 w-full" />;
        return productsQuery.data?.map(p => <ProductCard key={p.id} product={p} />);
      case "vrooms":
        if (vroomsQuery.isLoading) return <Skeleton className="h-80 w-full" />;
        return vroomsQuery.data?.map(v => <VroomCard key={v.id} vroom={v} />);
      case "bookmarks":
        if (bookmarksQuery.isLoading) return <Skeleton className="h-80 w-full" />;
        return bookmarksQuery.data?.map(b => <ProductCard key={b.id} product={b.product || b} />);
      case "following":
        if (followingQuery.isLoading) return <Skeleton className="h-12 w-full" />;
        return followingQuery.data?.map(f => <div key={f.id}>{f.firstName} {f.lastName}</div>);
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64 mr-80 p-4">
        {/* Tabs */}
        <div className="flex gap-4 mb-4">
          {["products", "vrooms", "bookmarks", "following"].map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 rounded ${activeTab === tab ? "bg-primary text-white" : "bg-gray-200"}`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>{renderTabContent()}</div>
      </div>
      <RightSidebar />
    </div>
  );
}
