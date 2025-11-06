"use client"

import { Menu, X } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm">
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 via-pink-50/30 to-purple-50/50 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg"></div>
            <span className="text-xl font-bold text-gray-900">SehatYarr</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex gap-8">
            <a href="#home" className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors">
              Home
            </a>
            <a href="#about" className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors">
              About
            </a>
            <a href="#services" className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors">
              Services
            </a>
            <a href="#blog" className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors">
              Blog
            </a>
          </nav>

          {/* Right side - CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors">
              Contact Us
            </button>
            <Link 
              href="/auth/sign-up"
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 backdrop-blur-lg bg-white/90 border-b border-white/20 shadow-lg">
            <nav className="flex flex-col p-4 space-y-3">
              <a href="#home" className="text-sm font-medium text-gray-700 hover:text-purple-600 py-2 transition-colors">
                Home
              </a>
              <a href="#about" className="text-sm font-medium text-gray-700 hover:text-purple-600 py-2 transition-colors">
                About
              </a>
              <a href="#services" className="text-sm font-medium text-gray-700 hover:text-purple-600 py-2 transition-colors">
                Services
              </a>
              <a href="#blog" className="text-sm font-medium text-gray-700 hover:text-purple-600 py-2 transition-colors">
                Blog
              </a>
              <div className="pt-3 space-y-2 border-t border-gray-200">
                <button className="w-full px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Contact Us
                </button>
                <Link 
                  href="/auth/sign-up"
                  className="block w-full px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg text-center"
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
