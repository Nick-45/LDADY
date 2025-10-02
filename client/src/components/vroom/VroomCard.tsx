import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaStore, FaEye, FaHeart, FaUser, FaShoppingBag, FaLock } from "react-icons/fa";
import { Link } from "wouter";
import { supabase } from "@/lib/supabaseClient"; // your Supabase client
import type { SessionUser } from "@/types";

interface VroomCardProps {
  vroom: {
    id: string;
    name: string;
    description?: string;
    coverImageUrl?: string;
    isPublic: boolean;
    userId: string;
    user?: {
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    };
  };
  currentUser?: SessionUser; // from auth context
  showFollowButton?: boolean;
}

export default function VroomCard({
  vroom,
  currentUser,
  showFollowButton = false,
}: VroomCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);

  // Fetch stats from Supabase
  useEffect(() => {
    const fetchVroomStats = async () => {
      try {
        // Count followers
        const { count: followerCount } = await supabase
          .from("vroom_followers")
          .select("*", { count: "exact" })
          .eq("vroom_id", vroom.id);

        setFollowersCount(followerCount || 0);

        // Count products
        const { count: productCount } = await supabase
          .from("products")
          .select("*", { count: "exact" })
          .eq("vroom_id", vroom.id);

        setProductsCount(productCount || 0);

        // Count views
        const { count: viewCount } = await supabase
          .from("vroom_views")
          .select("*", { count: "exact" })
          .eq("vroom_id", vroom.id);

        setViewsCount(viewCount || 0);

        // Check if current user is following
        if (currentUser) {
          const { data } = await supabase
            .from("vroom_followers")
            .select("*")
            .eq("vroom_id", vroom.id)
            .eq("user_id", currentUser.id)
            .single();

          setIsFollowing(!!data);
        }
      } catch (err) {
        console.error("Failed to fetch vroom stats:", err);
      }
    };

    fetchVroomStats();
  }, [vroom.id, currentUser]);

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;

    const prevState = isFollowing;
    setIsFollowing(!isFollowing); // optimistic update
    setFollowersCount(f => f + (prevState ? -1 : 1));

    try {
      if (prevState) {
        await supabase
          .from("vroom_followers")
          .delete()
          .eq("vroom_id", vroom.id)
          .eq("user_id", currentUser.id);
      } else {
        await supabase
          .from("vroom_followers")
          .insert({ vroom_id: vroom.id, user_id: currentUser.id });
      }
    } catch (err) {
      console.error(err);
      // revert on failure
      setIsFollowing(prevState);
      setFollowersCount(f => f + (prevState ? 1 : -1));
    }
  };

  return (
    <Link href={`/vroom/${vroom.id}`}>
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          {/* Cover Image */}
          <div className="relative h-48 overflow-hidden">
            {vroom.coverImageUrl ? (
              <img
                src={vroom.coverImageUrl}
                alt={vroom.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <FaStore className="text-4xl text-muted-foreground/50" />
              </div>
            )}

            <div className="absolute top-3 right-3">
              <Badge variant={vroom.isPublic ? "default" : "secondary"} className="flex items-center gap-1">
                {vroom.isPublic ? (
                  <>
                    <FaEye className="text-xs" />
                    Public
                  </>
                ) : (
                  <>
                    <FaLock className="text-xs" />
                    Private
                  </>
                )}
              </Badge>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content */}
          <div className="p-4 flex-grow flex flex-col">
            <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
              {vroom.name}
            </h3>

            {vroom.description && (
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {vroom.description}
              </p>
            )}

            {/* Owner Info */}
            {vroom.user && (
              <div className="flex items-center gap-2 mb-3">
                {vroom.user.profileImageUrl ? (
                  <img
                    src={vroom.user.profileImageUrl}
                    alt="Owner"
                    className="w-6 h-6 rounded-full object-cover border"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <FaUser className="text-xs" />
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  {vroom.user.firstName} {vroom.user.lastName}
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1" title="Products">
                  <FaShoppingBag className="text-xs" />
                  {productsCount}
                </span>
                <span className="flex items-center gap-1" title="Followers">
                  <FaHeart className="text-xs" />
                  {followersCount}
                </span>
                <span className="flex items-center gap-1" title="Views">
                  <FaEye className="text-xs" />
                  {viewsCount}
                </span>
              </div>

              {showFollowButton && currentUser && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className="text-xs h-7 px-3"
                  onClick={handleFollowClick}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
