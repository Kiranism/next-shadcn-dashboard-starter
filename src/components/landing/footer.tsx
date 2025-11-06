"use client"

import { Send } from "lucide-react"

export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12 pb-12 border-b border-gray-800">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full"></div>
              <span className="text-xl font-bold">SehatYarr</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">Revolutionizing healthcare delivery with innovative solutions.</p>
            <div className="flex gap-3">
              <button className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-sm">
                f
              </button>
              <button className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-sm">
                𝕏
              </button>
            </div>
          </div>

          {/* Links Columns */}
          {["Company", "Features", "Solutions", "Resources"].map((title, idx) => (
            <div key={idx}>
              <h3 className="font-semibold text-white mb-4 text-sm">{title}</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition">
                    Link One
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition">
                    Link Two
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition">
                    Link Three
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition">
                    Link Four
                  </a>
                </li>
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Subscribe */}
          <div>
            <p className="text-gray-400 text-sm">Subscribe our newsletter for new updates</p>
            <div className="flex gap-2 mt-3 bg-gray-800 rounded-lg p-1">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-transparent text-white text-sm px-3 py-2 outline-none flex-1"
              />
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* App Links */}
          <div className="flex gap-3 justify-end">
            <button className="border border-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition flex items-center gap-2">
              <span>🍎</span> App Store
            </button>
            <button className="border border-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition flex items-center gap-2">
              <span>▶</span> Play Store
            </button>
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex gap-2 justify-end mt-8 pt-8 border-t border-gray-800">
          <div className="w-6 h-6 bg-indigo-600 rounded-full"></div>
          <div className="w-6 h-6 bg-indigo-600 rounded-full"></div>
          <div className="w-6 h-6 bg-gray-700 rounded-full"></div>
        </div>
      </div>
    </footer>
  )
}
