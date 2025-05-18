'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import NavBar from '@/components/NavBar';

export default function LandingPage() {
  const testimonials = [
    {
      name: 'John Doe',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
    },
    {
      name: 'John Doe',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
    },
    {
      name: 'John Doe',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
    }
  ];

  return (
    <main className="bg-[#040510] min-h-screen">
      <NavBar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-20 bg-[#0a0f1a] rounded-3xl my-6 border border-slate-800/60 shadow-lg">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-white">Browse Smarter. Stay Safer.</h1>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <Image src="/shield-icon.svg" alt="Shield" width={24} height={24} />
                <span className="text-lg text-gray-300">Blocks phishing & malware</span>
              </li>
              <li className="flex items-center gap-3">
                <Image src="/password-icon.svg" alt="Password" width={24} height={24} />
                <span className="text-lg text-gray-300">Manages passwords securely</span>
              </li>
              <li className="flex items-center gap-3">
                <Image src="/browser-icon.svg" alt="Browser" width={24} height={24} />
                <span className="text-lg text-gray-300">Works right in your browser</span>
              </li>
            </ul>
            <Button variant="default" className="bg-[#7e5efc] hover:bg-[#6a4de0] px-8 py-6 text-lg">
              <Link href="/login" className="flex items-center gap-2">
                Download extension
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </Button>
          </div>
          <div className="relative">
            <Image
              src="/dashboard-preview.svg"
              alt="Dashboard Preview"
              width={600}
              height={400}
              className="rounded-xl shadow-lg mx-auto"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center p-6">
            <div className="mb-4 p-4 bg-[#1a1f2e] rounded-full">
              <Image src="/lock-icon.svg" alt="Lock" width={40} height={40} />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Password Vault with Autofill</h3>
            <p className="text-gray-400">Save and auto-fill passwords securely, right in your browser.</p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="mb-4 p-4 bg-[#1a1f2e] rounded-full">
              <Image src="/phishing-icon.svg" alt="Phishing" width={40} height={40} />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Phishing Site Blocker</h3>
            <p className="text-gray-400">Blocks fake websites before they steal your data.</p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="mb-4 p-4 bg-[#1a1f2e] rounded-full">
              <Image src="/scanning-icon.svg" alt="Scanning" width={40} height={40} />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Real-Time Site Scanning</h3>
            <p className="text-gray-400">Instantly checks websites for threats as you browse.</p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="mb-4 p-4 bg-[#1a1f2e] rounded-full">
              <Image src="/encryption-icon.svg" alt="Encryption" width={40} height={40} />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">End-to-End Encryption</h3>
            <p className="text-gray-400">Only you can see your data — not even us.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-16 bg-[#0a0f1a] rounded-xl border border-slate-800/60 shadow-lg my-6">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">What people say about <span className="font-bold text-indigo-400">Fortisafe</span></h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-[#1a1f2e] border-slate-800/60 shadow-lg hover:border-slate-700/60 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar alt={testimonial.name} />
                    <h4 className="font-medium">{testimonial.name}</h4>
                  </div>
                  <p className="text-gray-400">{testimonial.text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-[#0a0f1a] py-12 border-t border-slate-800/60">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">Fortisafe</h3>
              <div className="flex gap-3 mt-4">
                <a href="#" className="p-2 bg-[#7e5efc] text-white rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
                <a href="#" className="p-2 bg-[#7e5efc] text-white rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm uppercase text-gray-400 font-medium mb-4">INFORMATION</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Privacy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">FAQ</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Shipping and payment</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Partners</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Blog</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Contacts</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm uppercase text-gray-400 font-medium mb-4">MENU</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">For a couple</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">For him</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">For her</a></li>
              </ul>

              <div className="mt-6">
                <Button variant="default" className="bg-[#7e5efc] hover:bg-[#6a4de0] w-full mb-3">Request a call</Button>
                <p className="text-sm text-gray-400 text-center">+1 (999) 999-99-99</p>
                <p className="text-sm text-gray-400 text-center">info@logipsum.com</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-sm text-gray-400">
            <p>1901 Thornridge Cir. Shiloh, Hawaii 81063</p>
          </div>
        </div>
      </footer>
    </main>
  );
}