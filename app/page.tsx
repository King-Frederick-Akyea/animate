import Link from 'next/link';
import { ArrowRight, Sparkles, Film, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Film className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">CartoonCreator</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/auth/signin" 
              className="px-4 py-2 text-gray-700 hover:text-purple-600 transition"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup"
              className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Create Animated Cartoons
          <span className="text-purple-600 block">With AI Magic</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Transform your stories into beautiful animated videos like Dora the Explorer or Peppa Pig. No design skills needed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/dashboard"
            className="inline-flex items-center px-8 py-3 bg-purple-600 text-white rounded-full text-lg hover:bg-purple-700 transition"
          >
            Start Creating
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <button className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-full text-lg hover:bg-purple-50 transition">
            Watch Demo
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI Story Generation</h3>
            <p className="text-gray-600">
              Just describe your idea, and our AI creates complete stories with characters and scenes.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Characters</h3>
            <p className="text-gray-600">
              Auto-generated cartoon characters with different expressions and poses.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Film className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">One-Click Animation</h3>
            <p className="text-gray-600">
              Automatic lip-sync, movements, and scene transitions. Export as MP4.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-6 text-center">
          <p>© 2024 CartoonCreator. Create magical animations effortlessly.</p>
        </div>
      </footer>
    </div>
  );
}