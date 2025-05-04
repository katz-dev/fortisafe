'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { LogIn, Mail, Lock, User, Apple } from "lucide-react";
import { useEffect } from "react";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function LoginPage() {

  useEffect(() => {
    // Redirect to the backend login endpoint which will handle Auth0 redirect
    window.location.href = `${backendUrl}/auth/login`;
  }, []);
  // return (
  //   <div className="flex min-h-screen items-center justify-center bg-[#080b15] bg-[url('/bg-network.svg')] bg-cover bg-center bg-blend-overlay">
  //     <div className="w-full max-w-md rounded-xl bg-[#0c1222]/90 p-8 shadow-2xl backdrop-blur-sm">
  //       <h1 className="mb-10 text-center text-3xl font-bold text-white">Fortisafe</h1>

  //       <div className="space-y-3">
  //         {/* Social login buttons */}
  //         <Button
  //           variant="outline"
  //           className="flex w-full items-center justify-center gap-3 rounded-md bg-white py-6 text-black hover:bg-gray-100"
  //         >
  //           <Mail size={18} />
  //           <span>Continue with Google</span>
  //         </Button>

  //       </div>

  //       <div className="my-6 flex items-center">
  //         <div className="flex-grow border-t border-gray-800"></div>
  //       </div>

  //       <form className="space-y-4">
  //         <div className="space-y-2">
  //           <Label htmlFor="username" className="text-gray-300">
  //             Username
  //           </Label>
  //           <div className="relative">
  //             <Input
  //               id="username"
  //               type="text"
  //               placeholder="Enter username"
  //               className="bg-[#1e293b]/60 text-white placeholder:text-slate-500 border-none pl-10"
  //             />
  //             <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
  //           </div>
  //         </div>

  //         <div className="space-y-2">
  //           <Label htmlFor="password" className="text-gray-300">
  //             Password
  //           </Label>
  //           <div className="relative">
  //             <Input
  //               id="password"
  //               type="password"
  //               placeholder="Enter password"
  //               className="bg-[#1e293b]/60 text-white placeholder:text-slate-500 border-none pl-10"
  //             />
  //             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
  //           </div>
  //         </div>

  //         <div className="mt-1 text-right">
  //           <Link
  //             href="/forgot-password"
  //             className="text-sm text-blue-400 hover:text-blue-300"
  //           >
  //             Forgot password?
  //           </Link>
  //         </div>

  //         <Button
  //           type="submit"
  //           className="mt-2 w-full rounded-md bg-[#4f46e5] py-6 hover:bg-[#4338ca]"
  //         >
  //           <LogIn className="mr-2" size={18} />
  //           Login
  //         </Button>
  //       </form>

  //       <div className="mt-4 text-center text-sm text-gray-400">
  //         Don't have an account?{" "}
  //         <Link href="/register" className="text-blue-400 hover:text-blue-300">
  //           Sign up
  //         </Link>
  //       </div>
  //     </div>
  //   </div>
  // );
}