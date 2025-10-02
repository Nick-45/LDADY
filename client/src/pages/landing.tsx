import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaShoppingBag, FaUsers, FaComments, FaArrowRight } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient"; // make sure you create this
import { Input } from "@/components/ui/input";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("Check your email for confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1
            className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            data-testid="app-title"
          >
            Welcome to Eldady
          </h1>
          <p
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            data-testid="app-subtitle"
          >
            The social commerce platform where you can discover, share, and sell amazing products 
            while connecting with a vibrant community of creators and shoppers.
          </p>
        </div>

        {/* Auth Form */}
        <Card className="max-w-md mx-auto mb-16">
          <CardHeader>
            <CardTitle>{isSignup ? "Sign Up" : "Log In"}</CardTitle>
            <CardDescription>
              {isSignup
                ? "Create your Eldady account to get started."
                : "Log in to your Eldady account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                onClick={handleAuth}
                disabled={loading}
                className="w-full text-lg py-3"
              >
                {loading ? "Please wait..." : isSignup ? "Sign Up" : "Log In"}
                <FaArrowRight className="ml-2" />
              </Button>
              <p className="text-sm text-center mt-2">
                {isSignup ? (
                  <>
                    Already have an account?{" "}
                    <button
                      className="text-primary underline"
                      onClick={() => setIsSignup(false)}
                    >
                      Log In
                    </button>
                  </>
                ) : (
                  <>
                    Don’t have an account?{" "}
                    <button
                      className="text-primary underline"
                      onClick={() => setIsSignup(true)}
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <FaShoppingBag className="text-2xl text-primary" />
              </div>
              <CardTitle>Shop & Sell</CardTitle>
              <CardDescription>
                Discover unique products and showcase your own creations to a global audience.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <FaUsers className="text-2xl text-primary" />
              </div>
              <CardTitle>Connect</CardTitle>
              <CardDescription>
                Build meaningful connections with other creators, sellers, and shoppers in our community.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <FaComments className="text-2xl text-primary" />
              </div>
              <CardTitle>Engage</CardTitle>
              <CardDescription>
                Share your thoughts, ask questions, and get recommendations from the community.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
