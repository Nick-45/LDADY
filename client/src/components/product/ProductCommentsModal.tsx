import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Reply, Send, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { User, ProductComment } from "@shared/schema";

interface ProductCommentsModalProps {
  product: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

interface CommentWithUser extends ProductComment {
  user: User;
  replies?: (ProductComment & { user: User })[];
  likedByUser?: boolean;
  likesCount?: number;
}

export default function ProductCommentsModal({ product, isOpen, onClose }: ProductCommentsModalProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { toast } = useToast();

  const user = supabase.auth.user();

  // Fetch comments from Supabase
  const fetchComments = async () => {
    if (!product.id) return;

    const { data, error } = await supabase
      .from("product_comments")
      .select(`
        *,
        user:users(id, first_name, last_name, email, profile_image_url),
        replies:product_comments(*, user:users(id, first_name, last_name, email, profile_image_url))
      `)
      .eq("product_id", product.id)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } else {
      const formatted = data.map((c: any) => ({
        ...c,
        user: c.user,
        replies: c.replies || [],
        likedByUser: false,
        likesCount: 0,
      }));
      setComments(formatted);
    }
  };

  useEffect(() => {
    if (isOpen) fetchComments();
  }, [isOpen]);

  // Add new comment or reply
  const handleAddComment = async (content: string, parentCommentId?: string) => {
    if (!content.trim() || !user) return;

    const { error } = await supabase
      .from("product_comments")
      .insert({
        content: content.trim(),
        product_id: product.id,
        parent_comment_id: parentCommentId || null,
        user_id: user.id,
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setNewComment("");
    setReplyContent("");
    setReplyingTo(null);
    fetchComments();
  };

  // Toggle like
  const handleToggleLike = async (commentId: string) => {
    if (!user) return;

    // Check if already liked
    const { data: existing } = await supabase
      .from("product_comment_likes")
      .select("*")
      .eq("user_id", user.id)
      .eq("comment_id", commentId)
      .single();

    if (existing) {
      // Remove like
      await supabase.from("product_comment_likes").delete().eq("id", existing.id);
    } else {
      // Add like
      await supabase.from("product_comment_likes").insert({ comment_id: commentId, user_id: user.id });
    }

    fetchComments();
  };

  const renderComment = (comment: CommentWithUser) => (
    <div key={comment.id} className="space-y-2">
      <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
        <div className="flex-shrink-0">
          {comment.user?.profile_image_url ? (
            <img src={comment.user.profile_image_url} alt="avatar" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs">
              {comment.user?.first_name?.[0] || "U"}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-foreground">
              {comment.user?.first_name} {comment.user?.last_name}
            </p>
            <p className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</p>
          </div>
          <p className="text-sm text-foreground mt-1">{comment.content}</p>
          <div className="flex space-x-3 mt-2">
            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(comment.id)} className="h-7 px-2 text-xs">
              <Reply className="w-3 h-3 mr-1" /> Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleLike(comment.id)}
              className={`h-7 px-2 text-xs flex items-center ${comment.likedByUser ? "text-primary font-semibold" : ""}`}
            >
              <ThumbsUp className="w-3 h-3 mr-1" /> {comment.likesCount || 0}
            </Button>
          </div>
        </div>
      </div>

      {replyingTo === comment.id && (
        <div className="ml-11 space-y-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex space-x-2">
            <Button size="sm" onClick={() => handleAddComment(replyContent, comment.id)}>
              <Send className="w-3 h-3 mr-1" /> Reply
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setReplyingTo(null); setReplyContent(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex items-start space-x-3 p-2 bg-muted/20 rounded-lg">
              <div className="flex-shrink-0">
                {reply.user?.profile_image_url ? (
                  <img src={reply.user.profile_image_url} alt="avatar" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                    {reply.user?.first_name?.[0] || "U"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-medium text-foreground">{reply.user?.first_name} {reply.user?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-xs text-foreground mt-1">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Comments on {product.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map(renderComment)
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">{newComment.length}/1000 characters</p>
            <Button onClick={() => handleAddComment(newComment)} disabled={!newComment.trim()}>
              <Send className="w-4 h-4 mr-2" /> Post Comment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
