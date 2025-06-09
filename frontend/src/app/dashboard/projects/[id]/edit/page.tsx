'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { projectsApi } from '@/lib/api'; // Assuming API path from previous tasks
import type { Project } from '@/types'; // Assuming type path

// Helper function for class names (if needed, similar to ProjectsPage)
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true); // Start true for initial data fetch
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false); // For form submission loading state

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(null);
      projectsApi.getProject(id)
        .then(response => {
          const project = response.data.data; // Assuming API response structure
          if (project) {
            setFormData({ name: project.name, description: project.description || '' });
          } else {
            setError('Project not found.');
          }
        })
        .catch(err => {
          console.error('Error fetching project:', err);
          setError('Failed to load project details. Please try again.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError('Project ID is missing.');
      setLoading(false);
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) {
      setError('Project ID is missing. Cannot update.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await projectsApi.updateProject(id, formData);
      // Optionally: show success toast/message here
      router.push(`/dashboard/projects/${id}`); // Navigate to project detail page
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again.');
      // Optionally: show error toast/message here
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !loading && !formData.name) { // Show full page error if project couldn't be loaded
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Edit Project</h1>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
        </div>

        {error && ( // Display non-critical errors (e.g., update error) here
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-md rounded-lg p-8">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Project Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push(id ? `/dashboard/projects/${id}` : '/dashboard/projects')}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={submitting || loading} // Disable if initial load is somehow still happening
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
