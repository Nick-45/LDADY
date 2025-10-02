// client/src/pages/Profile.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import ProductCard from "@/components/product/ProductCard";
import VroomCard from "@/components/vroom/VroomCard";
import CreateVroomModal from "@/components/vroom/CreateVroomModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "vrooms" | "bookmarks" | "following">("products");

  // ----------------------
  // Fetch Profile Data
  // ----------------------
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery(
    ["profile", user?.id],
    async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    { enabled: !!user }
  );

  // ----------------------
  // Fetch User's Products
  // ----------------------
  const { data: userProducts, isLoading: productsLoading } = useQuery(
    ["userProducts", user?.id],
    async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    { enabled: !!user }
  );

  // ----------------------
  // Fetch User's Vrooms
  // ----------------------
  const { data: userVrooms, isLoading: vroomsLoading } = useQuery(
    ["userVrooms", user?.id],
    async () => {
      const { data, error } = await supabase
        .from("vrooms")
        .select(`*, products:products(id), followers:vroom_follows(id)`)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return data?.map(vroom => ({
        ...vroom,
        _count: {
          products: vroom.products?.length || 0,
          followers: vroom.followers?.length || 0,
          views: vroom._count?.views || 0,
        },
      })) || [];
    },
    { enabled: !!user }
  );

  // ----------------------
  // Fetch Bookmarks (only when tab is active)
  // ----------------------
  const { data: userBookmarks, isLoading: bookmarksLoading } = useQuery(
    ["userBookmarks", user?.id],
    async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select(`*, product:products(*)`)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    { enabled: !!user && activeTab === "bookmarks" }
  );

  // ----------------------
  // Fetch Following (only when tab is active)
  // ----------------------
  const { data: userFollowing, isLoading: followingLoading } = useQuery(
    ["userFollowing", user?.id],
    async () => {
      const { data, error } = await supabase
        .from("follows")
        .select(`following:profiles(*)`)
        .eq("follower_id", user!.id);
      if (error) throw error;
      return data?.map(f => f.following) || [];
    },
    { enabled: !!user && activeTab === "following" }
  );

  // ----------------------
  // Form Setup
  // ----------------------
  const form = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: profileData?.bio || "",
      location: profileData?.location || "",
      website: profileData?.website || "",
      twitter: profileData?.twitter || "",
      instagram: profileData?.instagram || "",
    },
  });

  useEffect(() => {
    if (profileData) {
      form.reset({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        website: profileData.website || "",
        twitter: profileData.twitter || "",
        instagram: profileData.instagram || "",
      });
    }
  }, [profileData, user, form]);

  // ----------------------
  // Update Profile
  // ----------------------
  const updateProfileMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(values)
        .eq("id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: data => {
      toast({ title: "Profile Updated", description: "Your profile has been updated." });
      queryClient.invalidateQueries(["profile", user?.id]);
      setEditModalOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update profile", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => updateProfileMutation.mutate(data);

  // ----------------------
  // Image Upload
  // ----------------------
  const handleImageUpload = async (result: UploadResult, type: "profile" | "banner") => {
    if (result.successful.length === 0) return;
    const uploadedFile = result.successful[0];
    const column = type === "profile" ? "profileImageUrl" : "bannerImageUrl";
    const { error } = await supabase
      .from("profiles")
      .update({ [column]: uploadedFile.uploadURL })
      .eq("id", user!.id);
    if (error) {
      toast({ title: "Error", description: `Failed to update ${type} image`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${type} image updated` });
      queryClient.invalidateQueries(["profile", user?.id]);
    }
  };

  // ----------------------
  // Tabs Rendering
  // ----------------------
  const renderTabContent = () => {
    if (activeTab === "products") {
      if (productsLoading) return <Skeleton className="h-80 w-full rounded-xl" />;
      if (!userProducts || userProducts.length === 0) return <p>No products yet</p>;
      return userProducts.map(p => <ProductCard key={p.id} product={p} />);
    }
    if (activeTab === "vrooms") {
      if (vroomsLoading) return <Skeleton className="h-80 w-full rounded-xl" />;
      if (!userVrooms || userVrooms.length === 0) return <p>No vrooms yet</p>;
      return userVrooms.map(v => <VroomCard key={v.id} vroom={v} />);
    }
    if (activeTab === "bookmarks") {
      if (bookmarksLoading) return <Skeleton className="h-80 w-full rounded-xl" />;
      if (!userBookmarks || userBookmarks.length === 0) return <p>No bookmarks yet</p>;
      return userBookmarks.map(b => <ProductCard key={b.id} product={b.product || b} />);
    }
    if (activeTab === "following") {
      if (followingLoading) return <Skeleton className="h-12 w-full rounded-md" />;
      if (!userFollowing || userFollowing.length === 0) return <p>Not following anyone</p>;
      return userFollowing.map(f => <div key={f.id}>{f.firstName} {f.lastName}</div>);
    }
  };

  if (profileLoading) return <Skeleton className="h-80 w-full" />;
  if (profileError) return <p className="text-destructive">Failed to load profile</p>;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 ml-64 mr-80 p-6 space-y-6">
        {/* Profile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold">
              {user?.firstName?.[0] || "?"}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h2>
              <p className="text-muted-foreground">{profileData?.bio}</p>
            </div>
          </div>
          <Button onClick={() => setEditModalOpen(true)}>Edit Profile</Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-muted pb-2">
          {["products","vrooms","bookmarks","following"].map(tab => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderTabContent()}
        </div>

        {/* Edit Profile Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Save Changes</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <RightSidebar />
    </div>
  );
}
