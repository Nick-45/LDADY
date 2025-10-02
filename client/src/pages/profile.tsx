import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import ProductCard from "@/components/product/ProductCard";
import VroomCard from "@/components/vroom/VroomCard";
import CreateVroomModal from "@/components/vroom/CreateVroomModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { FaEdit, FaMapMarkerAlt, FaCalendarAlt, FaStore, FaHeart, FaCamera, FaPlus, FaGlobe, FaTwitter, FaInstagram, FaUser, FaSignature, FaBookmark, FaUserPlus } from "react-icons/fa";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  // --- Supabase Queries ---

  // Fetch profile data
  const { data: profileData, isLoading: profileLoading } = useQuery(["profile", user?.id], async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    return data;
  });

  // Fetch user's products
  const { data: userProducts, isLoading: productsLoading } = useQuery(["userProducts", user?.id], async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });

  // Fetch user's vrooms
  const { data: userVrooms, isLoading: vroomsLoading } = useQuery(["userVrooms", user?.id], async () => {
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
  });

  // Fetch bookmarks
  const { data: userBookmarks, isLoading: bookmarksLoading } = useQuery(["userBookmarks", user?.id], async () => {
    if (!user || activeTab !== "bookmarks") return [];
    const { data, error } = await supabase
      .from("bookmarks")
      .select(`
        *,
        product:products(*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });

  // Fetch following
  const { data: userFollowing, isLoading: followingLoading } = useQuery(["userFollowing", user?.id], async () => {
    if (!user || activeTab !== "following") return [];
    const { data, error } = await supabase
      .from("follows")
      .select(`
        following:profiles(*)
      `)
      .eq("follower_id", user.id);
    if (error) throw error;
    return data?.map(f => f.following) || [];
  });

  // --- Profile form ---
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

  // Update profile mutation
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
    },
    onError: (error: any) => {
      console.error(error);
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => updateProfileMutation.mutate(data);

  // --- Image upload ---
  const handleGetUploadParameters = async () => {
    const { data } = await supabase.functions.invoke("get-upload-url"); // adjust to your Supabase function
    return { method: "PUT", url: data.uploadURL };
  };

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
      }
    }
  };

  // --- Profile stats ---
  const profileStats = {
    posts: userProducts?.length || 0,
    vrooms: userVrooms?.length || 0,
    followers: profileData?.followers || 0,
    following: profileData?.following || 0,
    bookmarks: userBookmarks?.length || 0,
  };

  const userInitial = user?.firstName?.[0] || user?.email?.[0] || "?";

  // --- Render Tabs ---
  const renderBookmarks = () => {
    if (bookmarksLoading) return <Skeleton className="h-80 w-full rounded-xl" />;
    if (!userBookmarks || userBookmarks.length === 0) return <p>No bookmarks yet</p>;
    return userBookmarks.map((b: any) => <ProductCard key={b.id} product={b.product || b} />);
  };

  const renderFollowing = () => {
    if (followingLoading) return <Skeleton className="h-12 w-full rounded-md" />;
    if (!userFollowing || userFollowing.length === 0) return <p>Not following anyone yet</p>;
    return userFollowing.map((f: any) => <div key={f.id}>{f.firstName} {f.lastName}</div>);
  };

  // --- Loading state ---
  if (profileLoading) return <Skeleton className="h-80 w-full" />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64 mr-80">
        {/* ... Rest of UI remains the same, using userProducts, userVrooms, userBookmarks, userFollowing */}
      </div>
      <RightSidebar />
    </div>
  );
}
