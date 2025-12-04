'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Plus, Film, Edit, Trash2, Play, Download, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  thumbnail_url: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  useEffect(() => {
    checkUser();
    fetchProjects();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (!user) {
      router.push('/auth/signin');
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectTitle.trim()) {
      toast.error('Please enter a project title');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            title: newProjectTitle,
            user_id: user.id,
            description: 'New cartoon project',
            status: 'draft',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Project created!');
      setNewProjectTitle('');
      router.push(`/editor/${data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Project deleted');
      fetchProjects();
    } catch (error: any) {
      toast.error('Failed to delete project');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Film className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold">My Projects</h1>
                <p className="text-gray-600 text-sm">
                  Welcome back, {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Create New Project */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Create New Cartoon</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Enter project title..."
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={createProject}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Plus className="h-5 w-5" />
              <span>Create</span>
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <Film className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first cartoon animation!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition"
              >
                <div className="h-48 bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                  {project.thumbnail_url ? (
                    <img
                      src={project.thumbnail_url}
                      alt={project.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Film className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold truncate">{project.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {project.description || 'No description'}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/editor/${project.id}`)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => router.push(`/play/${project.id}`)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <Play className="h-4 w-4" />
                      <span>Play</span>
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}