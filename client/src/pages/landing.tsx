import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { FaArrowRight } from "react-icons/fa";

export default function Landing() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup state
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [country, setCountry] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
      });
      if (error) throw error;
      alert("Check your email for confirmation link!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid md:grid-cols-2">
          {/* Left Side - Logo */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 flex flex-col items-center justify-center p-8">
            <div className="text-center">
              <img 
                src="/src/assets/ELDADY-LOGO.png" 
                alt="Eldady Logo" 
                className="w-32 h-32 mx-auto mb-6"
              />
              <h1 className="text-4xl font-bold text-primary mb-4">Ldady</h1>
              <p className="text-xl text-muted-foreground font-medium">Excelio in it</p>
            </div>
          </div>

          {/* Right Side - Auth Forms */}
          <div className="p-8">
            {!isSignup ? (
              /* Login Form */
              <div className="h-full flex flex-col justify-center">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl">Sign In</CardTitle>
                  <CardDescription>
                    Welcome back to your Eldady account
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-4">
                  <Input
                    placeholder="Username or Email"
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="py-2"
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="py-2"
                  />
                  <Button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full text-lg py-2 mt-4"
                  >
                    {loading ? "Please wait..." : "Sign In"}
                    <FaArrowRight className="ml-2" />
                  </Button>
                  
                  <div className="text-sm text-center space-y-2 pt-4">
                    <p>
                      Don't have an account?{" "}
                      <button
                        className="text-primary underline font-medium"
                        onClick={() => setIsSignup(true)}
                      >
                        Sign Up
                      </button>
                    </p>
                    <p>
                      <button className="text-primary underline font-medium">
                        Click here if forgot password
                      </button>
                    </p>
                  </div>
                </CardContent>
              </div>
            ) : (
              /* Signup Form */
              <div className="h-full">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl">Sign Up</CardTitle>
                  <CardDescription>
                    Create your Eldady account
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Input
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="py-2"
                    />
                    <Input
                      placeholder="Second Name"
                      value={secondName}
                      onChange={(e) => setSecondName(e.target.value)}
                      className="py-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    
                    <Input
                      placeholder="Date of Birth"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="py-2"
                    />
                  </div>
                  
                  <Input
                    placeholder="Mobile Number"
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="mb-3 py-2"
                  />
                  
                  <Input
                    placeholder="Email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="mb-3 py-2"
                  />
                  
                  <Input
                    placeholder="Country of Residence"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mb-3 py-2"
                  />
                  
                  <Input
                    placeholder="Password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="mb-4 py-2"
                  />
                  
                  <Button
                    onClick={handleSignup}
                    disabled={loading}
                    className="w-full text-lg py-2"
                  >
                    {loading ? "Please wait..." : "Sign Up"}
                    <FaArrowRight className="ml-2" />
                  </Button>
                  
                  <p className="text-sm text-center mt-4">
                    Already have an account?{" "}
                    <button
                      className="text-primary underline font-medium"
                      onClick={() => setIsSignup(false)}
                    >
                      Sign In
                    </button>
                  </p>
                </CardContent>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
