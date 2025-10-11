import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/components/ui/use-toast";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Button,
} from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import EditProfileModal from "@/components/profile/EditProfileModal";
import ProductCard from "@/components/products/ProductCard";
import VroomCard from "@/components/vrooms/VroomCard";
import { useAuth } from "@/context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("products");
  const [editModalOpen, setEditModalOpen] = useState(false);

  // ✅ Fetch Profile Data
  const {
    data: profileData,
    isLoading: profileLoading,
  } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // ✅ Fetch User Products
  const {
    data: userProducts,
    isLoading: productsLoading,
  } = useQuery({
    queryKey: ["userProducts", user?.id],
    enabled: !!user && activeTab === "products",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
  });

  // ✅ Fetch User Vrooms
  const {
    data: userVrooms,
    isLoading: vroomsLoading,
  } = useQuery({
    queryKey: ["userVrooms", user?.id],
    enabled: !!user && activeTab === "vrooms",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vrooms")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
  });

  // ✅ Fetch Bookmarks
  const {
    data: userBookmarks,
    isLoading: bookmarksLoading,
  } = useQuery({
    queryKey: ["userBookmarks", user?.id],
    enabled: !!user && activeTab === "bookmarks",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select(`
          *,
          products (*)
        `)
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
  });

  // ✅ Fetch Following
  const {
    data: userFollowing,
    isLoading: followingLoading,
  } = useQuery({
    queryKey: ["userFollowing", user?.id],
    enabled: !!user && activeTab === "following",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select(`
          followed_user:followed_id (
            id,
            first_name,
            second_name,
            profile_image_url
          )
        `)
        .eq("follower_id", user.id);
      if (error) throw error;
      return data?.map((item) => item.followed_user) || [];
    },
  });

  // ✅ Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.firstName,
          second_name: data.lastName,
          bio: data.bio,
          location: data.location,
          website: data.website,
          twitter: data.twitter,
          instagram: data.instagram,
          updated_at: new Date(),
        })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setEditModalOpen(false);
      queryClient.invalidateQueries(["profile", user.id]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // ✅ Handle Image Upload
  const handleImageUpload = async (file: File, type: "profile" | "banner") => {
    try {
      const filePath = `${user.id}/${type}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("user-images")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("user-images")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          [`${type}_image_url`]: publicUrl.publicUrl,
          updated_at: new Date(),
        })
        .eq("id", user.id);
      if (updateError) throw updateError;

      toast({
        title: `${type === "profile" ? "Profile" : "Banner"} image updated`,
        description: "Image updated successfully.",
      });

      queryClient.invalidateQueries(["profile", user.id]);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Image upload failed.",
        variant: "destructive",
      });
    }
  };

  if (profileLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );

  return (
    <div className="flex flex-col items-center mt-6">
      {/* Banner */}
      <div className="w-full relative">
        <img
          src={profileData?.banner_image_url || "/placeholder-banner.jpg"}
          alt="Banner"
          className="w-full h-48 object-cover rounded-lg"
        />
        <div className="absolute bottom-0 left-6 transform translate-y-1/2">
          <Avatar className="w-24 h-24 border-4 border-white">
            <AvatarImage src={profileData?.profile_image_url} />
            <AvatarFallback>
              {profileData?.first_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* User Info */}
      <div className="mt-14 text-center">
        <h2 className="text-2xl font-semibold">
          {profileData?.first_name} {profileData?.second_name}
        </h2>
        <p className="text-gray-600">{profileData?.bio || "No bio yet."}</p>
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => setEditModalOpen(true)}
        >
          Edit Profile
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 mt-6">
        {["products", "vrooms", "bookmarks", "following"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-lg capitalize ${
              activeTab === tab
                ? "font-semibold border-b-2 border-black"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="w-full mt-6 px-6">
        {activeTab === "products" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {productsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              userProducts?.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))
            )}
          </div>
        )}

        {activeTab === "vrooms" && (
          <div className="grid grid-cols-1 gap-4">
            {vroomsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              userVrooms?.map((v) => <VroomCard key={v.id} vroom={v} />)
            )}
          </div>
        )}

        {activeTab === "bookmarks" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {bookmarksLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              userBookmarks?.map((b) => (
                <ProductCard key={b.id} product={b.products} />
              ))
            )}
          </div>
        )}

        {activeTab === "following" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {followingLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              userFollowing?.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col items-center bg-gray-50 p-4 rounded-lg"
                >
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={f.profile_image_url} />
                    <AvatarFallback>
                      {f.first_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="mt-2 font-medium">
                    {f.first_name} {f.second_name}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        profileData={profileData}
        onSave={(data) => updateProfileMutation.mutate(data)}
      />
    </div>
  );
}
