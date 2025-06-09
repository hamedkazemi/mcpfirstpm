'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectsApi } from '@/lib/api'; // Assuming API path
import type { Project, User, ProjectMember } from '@/types'; // Assuming type path, Added User, ProjectMember
import ConfirmationModal from '@/components/shared/ConfirmationModal'; // Assuming path
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ProjectItemsList from './components/ProjectItemsList';
import ProjectMembersManagement from './components/ProjectMembersManagement'; // Import ProjectMembersManagement

// Helper function for class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type TabName = 'tasks' | 'members' | 'settings';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true); // Covers both project and initial members load
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('tasks');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  // loadingMembers can be true if there's a separate call, or false if derived directly from project load.
  // For simplicity, we'll tie it to the main `loading` state here, assuming members come with project.
  // If members were fetched separately, a distinct loadingMembers state would be better.

  const fetchProjectDetails = useCallback(async () => {
    if (!id) {
      setError('Project ID is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setProjectMembers([]); // Reset extracted user objects for assignee list

    try {
      const response = await projectsApi.getProject(id);
      const fetchedProject = response.data.data as Project;
      setProject(fetchedProject);

      if (fetchedProject && fetchedProject.members) {
        const membersArray = fetchedProject.members
          .map((pm: ProjectMember) => (typeof pm.user === 'object' && pm.user !== null ? pm.user as User : null))
          .filter((user): user is User => user !== null);
        setProjectMembers(membersArray);
      }
    } catch (err: any) {
      console.error('Error fetching project details:', err);
      if (err.response && err.response.status === 404) {
        setError('Project not found.');
      } else {
        setError('Failed to load project details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const handleConfirmDelete = async () => {
    if (!id) return;
    // Consider adding a submitting state for delete if desired
    try {
      setError(null); // Clear previous errors
      await projectsApi.deleteProject(id);
      // Optionally: show success toast/message here
      router.push('/dashboard/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
      // Optionally: show error toast/message here
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const tabs: { name: TabName; label: string }[] = [
    { name: 'tasks', label: 'Tasks' },
    { name: 'members', label: 'Members' },
    // { name: 'settings', label: 'Settings' }, // Settings can be inline for now
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-theme(spacing.16))]"> {/* Adjust height based on layout */}
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !project) { // Critical error: project not loaded
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600 text-lg">{error}</p>
        <Link href="/dashboard/projects" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <ArrowLeftIcon className="mr-2 h-5 w-5" />
          Back to Projects
        </Link>
      </div>
    );
  }

  if (!project) { // Should be caught by error state, but as a fallback
    return (
       <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 text-lg">Project data is unavailable.</p>
         <Link href="/dashboard/projects" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
           <ArrowLeftIcon className="mr-2 h-5 w-5" />
           Back to Projects
         </Link>
       </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back to Projects Link */}
      <div className="mb-6">
        <Link href="/dashboard/projects" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
          <ArrowLeftIcon className="mr-2 h-5 w-5" />
          Back to Projects
        </Link>
      </div>

      {/* Header: Project Name, Description, Actions */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">{project.name}</h1>
              {project.description && <p className="mt-1 max-w-2xl text-sm text-gray-500">{project.description}</p>}
            </div>
            <div className="flex-shrink-0 flex space-x-3">
              <Link
                href={`/dashboard/projects/${id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
                Edit
              </Link>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error display for non-critical errors like failed delete */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}


      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">Select a tab</label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabName)}
          >
            {tabs.map((tab) => (
              <option key={tab.name} value={tab.name}>{tab.label}</option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={classNames(
                    tab.name === activeTab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                  )}
                  aria-current={tab.name === activeTab ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'tasks' && id && ( // Ensure id is available
          <ProjectItemsList
            projectId={id}
            projectMembers={projectMembers}
            loadingMembers={loading} // Use main loading state for members derived from project
          />
        )}
        {activeTab === 'members' && id && project && (
           <ProjectMembersManagement
             projectId={id}
             initialMembers={project.members || []}
             onMembersUpdate={fetchProjectDetails}
           />
        )}
        {/*
        {activeTab === 'settings' && (
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Settings</h2>
            <p className="text-gray-600">Advanced project settings, including edit and delete actions if not placed in the header.</p>
          </div>
        )}
        */}
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`}
        confirmButtonText="Delete"
      />
    </div>
  );
}
