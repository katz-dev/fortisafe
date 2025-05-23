'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import NavBar from '@/components/NavBar';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaLock, FaUserShield, FaGithub, FaTwitter } from 'react-icons/fa';
import { MdSecurity, MdPassword } from 'react-icons/md';

export default function LandingPage() {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariant = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };
  
  // Stats for the page
  const stats = [
    { value: '10M+', label: 'Passwords Protected' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' },
  ];
  
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Cybersecurity Analyst',
      text: 'FortiSafe has completely transformed how I manage my credentials. The password health analysis feature helped me identify and fix several vulnerable passwords I didn\'t even realize were at risk.',
    },
    {
      name: 'Michael Chen',
      role: 'Software Developer',
      text: 'As someone who deals with dozens of accounts daily, FortiSafe has been a game-changer. The autofill feature works flawlessly, and the security checks give me peace of mind.',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Digital Marketing Manager',
      text: 'I was constantly reusing passwords until FortiSafe alerted me to the risks. Now I have unique, strong passwords for every account, and I don\'t have to remember any of them!',
    }
  ];

  return (
    <main className="bg-[#040510] min-h-screen">
      <NavBar />

      {/* Hero Section */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="container mx-auto px-4 py-16 lg:py-20 bg-[#0a0f1a] rounded-3xl my-6 border border-slate-800/60 shadow-lg"
      >
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 
              variants={itemVariant}
              className="text-4xl lg:text-6xl font-bold mb-6 text-white leading-tight"
            >
              <span className="text-[#7e5efc]">FortiSafe</span>: Your Password <br/> Guardian in the Digital Age
            </motion.h1>
            <motion.ul 
              variants={staggerContainer}
              className="space-y-4 mb-8"
            >
              <motion.li variants={itemVariant} className="flex items-center gap-3">
                <div className="bg-[#7e5efc]/20 p-2 rounded-full">
                  <FaShieldAlt className="text-[#7e5efc]" size={20} />
                </div>
                <span className="text-lg text-gray-300">Detects compromised & reused passwords</span>
              </motion.li>
              <motion.li variants={itemVariant} className="flex items-center gap-3">
                <div className="bg-[#7e5efc]/20 p-2 rounded-full">
                  <MdPassword className="text-[#7e5efc]" size={20} />
                </div>
                <span className="text-lg text-gray-300">Securely stores & autofills credentials</span>
              </motion.li>
              <motion.li variants={itemVariant} className="flex items-center gap-3">
                <div className="bg-[#7e5efc]/20 p-2 rounded-full">
                  <MdSecurity className="text-[#7e5efc]" size={20} />
                </div>
                <span className="text-lg text-gray-300">Warns about unsafe websites & phishing</span>
              </motion.li>
            </motion.ul>
            <motion.div variants={itemVariant}>
              <Button variant="default" className="bg-[#7e5efc] hover:bg-[#6a4de0] px-8 py-6 text-lg relative overflow-hidden group">
                <Link href="/login" className="flex items-center gap-2 relative z-10">
                  Get Started Now
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
                <span className="absolute inset-0 bg-gradient-to-r from-[#9277fc] to-[#6a4de0] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Button>
            </motion.div>
          </motion.div>
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Image
              src="/app-preview.svg"
              alt="Application Preview"
              width={600}
              height={400}
              className="rounded-xl shadow-lg mx-auto"
            />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#7e5efc]/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#7e5efc]/10 rounded-full blur-3xl"></div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="container mx-auto px-4 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
      >
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerContainer}
        >
          <motion.div 
            className="flex flex-col items-center text-center p-6 bg-[#0a0f1a] rounded-xl border border-slate-800/60 shadow-lg hover:border-[#7e5efc]/30 transition-all duration-300"
            variants={itemVariant}
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
          >
            <div className="mb-4 p-4 bg-[#1a1f2e] rounded-full relative overflow-hidden group">
              <FaLock className="text-[#7e5efc] text-3xl relative z-10" />
              <motion.div 
                className="absolute inset-0 bg-[#7e5efc]/20"
                initial={{ scale: 0 }}
                whileHover={{ scale: 1, transition: { duration: 0.3 } }}
              />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Password Vault with Autofill</h3>
            <p className="text-gray-400">Store unlimited passwords with military-grade encryption and auto-fill them with a single click.</p>
          </motion.div>

          <motion.div 
            className="flex flex-col items-center text-center p-6 bg-[#0a0f1a] rounded-xl border border-slate-800/60 shadow-lg hover:border-[#7e5efc]/30 transition-all duration-300"
            variants={itemVariant}
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
          >
            <div className="mb-4 p-4 bg-[#1a1f2e] rounded-full relative overflow-hidden">
              <FaShieldAlt className="text-[#7e5efc] text-3xl relative z-10" />
              <motion.div 
                className="absolute inset-0 bg-[#7e5efc]/20"
                initial={{ scale: 0 }}
                whileHover={{ scale: 1, transition: { duration: 0.3 } }}
              />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Phishing & Malware Protection</h3>
            <p className="text-gray-400">Get real-time alerts about malicious websites and prevent your data from being stolen.</p>
          </motion.div>

          <motion.div 
            className="flex flex-col items-center text-center p-6 bg-[#0a0f1a] rounded-xl border border-slate-800/60 shadow-lg hover:border-[#7e5efc]/30 transition-all duration-300"
            variants={itemVariant}
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
          >
            <div className="mb-4 p-4 bg-[#1a1f2e] rounded-full relative overflow-hidden">
              <FaUserShield className="text-[#7e5efc] text-3xl relative z-10" />
              <motion.div 
                className="absolute inset-0 bg-[#7e5efc]/20"
                initial={{ scale: 0 }}
                whileHover={{ scale: 1, transition: { duration: 0.3 } }}
              />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Password Health Analysis</h3>
            <p className="text-gray-400">Identifies weak, reused, and compromised passwords to enhance your security posture.</p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section 
        className="container mx-auto px-4 py-16 bg-[#0a0f1a] rounded-xl border border-slate-800/60 shadow-lg my-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
      >
        <motion.h2 
          className="text-3xl font-bold text-center mb-12 text-white"
          variants={itemVariant}
        >
          What people say about <span className="font-bold text-[#7e5efc]">FortiSafe</span>
        </motion.h2>

        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          variants={staggerContainer}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={itemVariant}>
              <Card className="bg-[#1a1f2e] border-slate-800/60 shadow-lg hover:border-[#7e5efc]/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar alt={testimonial.name} className="border-2 border-[#7e5efc]/30" />
                      <div>
                        <h4 className="font-medium text-white">{testimonial.name}</h4>
                        <p className="text-xs text-[#7e5efc]">{testimonial.role}</p>
                      </div>
                    </div>
                    <p className="text-gray-400">{testimonial.text}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="container mx-auto px-4 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              className="bg-[#0a0f1a] rounded-xl border border-slate-800/60 p-8 text-center"
              variants={itemVariant}
              whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(126, 94, 252, 0.2)' }}
            >
              <h3 className="text-4xl font-bold text-[#7e5efc] mb-2">{stat.value}</h3>
              <p className="text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Footer Section */}
      <motion.footer 
        className="bg-[#0a0f1a] py-12 border-t border-slate-800/60 mt-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
      >
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">FortiSafe</h3>
              <p className="text-gray-400 mb-4">Secure password management solution that protects your digital identity with advanced encryption and security features.</p>
              <div className="flex gap-3 mt-4">
                <motion.a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-[#0a0f1a] border border-slate-800 text-[#7e5efc] rounded-full hover:bg-[#7e5efc]/10 transition-colors duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaTwitter size={20} />
                </motion.a>
                <motion.a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-[#0a0f1a] border border-slate-800 text-[#7e5efc] rounded-full hover:bg-[#7e5efc]/10 transition-colors duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaGithub size={20} />
                </motion.a>
              </div>
            </div>

            <div>
              <h4 className="text-sm uppercase text-gray-400 font-medium mb-4">RESOURCES</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Terms of Service</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Security Practices</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">FAQ</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Blog</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Contact Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm uppercase text-gray-400 font-medium mb-4">FEATURES</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Password Vault</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Security Dashboard</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Password Generator</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Browser Extension</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#7e5efc]">Mobile App</a></li>
              </ul>

              <div className="mt-6">
                <Button variant="default" className="bg-[#7e5efc] hover:bg-[#6a4de0] w-full mb-3 relative overflow-hidden group">
                  <span className="relative z-10">Get Started</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[#9277fc] to-[#6a4de0] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
                <p className="text-sm text-gray-400 text-center mt-4">support@fortisafe.live</p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800/60 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} FortiSafe. All rights reserved.</p>
          </div>
        </div>
      </motion.footer>
    </main>
  );
}
