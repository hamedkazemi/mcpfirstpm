'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import type { Project } from '@/types';
import { PlusIcon, FolderIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.getProjects();
      setProjects(response.data.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600">{error}</div>
          <button
            onClick={fetchProjects}
            className="mt-4 text-blue-600 hover:text-blue-500"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new project.
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project._id}
              className="relative bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FolderIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <Link
                        href={`/dashboard/projects/${project._id}`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600"
                      >
                        {project.name}
                      </Link>
                    </div>
                  </div>
                  <Menu as="div" className="relative">
                    <Menu.Button className="p-1 rounded-full text-gray-400 hover:text-gray-600">
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href={`/dashboard/projects/${project._id}/edit`}
                            className={classNames(
                              active ? 'bg-gray-50' : '',
                              'block px-3 py-1 text-sm leading-6 text-gray-900'
                            )}
                          >
                            Edit
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={classNames(
                              active ? 'bg-gray-50' : '',
                              'block w-full text-left px-3 py-1 text-sm leading-6 text-red-600'
                            )}
                          >
                            Delete
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                </div>
                
                {project.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {project.description.length > 100
                      ? `${project.description.substring(0, 100)}...`
                      : project.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <span>{project.members?.length || 0} members</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Project members avatars */}
                {project.members && project.members.length > 0 && (
                  <div className="mt-4 flex -space-x-1">
                    {project.members.slice(0, 4).map((member, index) => {
                      const user = typeof member.user === 'object' ? member.user : null;
                      return (
                        <div
                          key={index}
                          className="relative h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700 ring-2 ring-white"
                          title={user ? `${user.firstName} ${user.lastName}` : 'Unknown'}
                        >
                          {user ? `${user.firstName?.[0]}${user.lastName?.[0]}` : '?'}
                        </div>
                      );
                    })}
                    {project.members.length > 4 && (
                      <div className="relative h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 ring-2 ring-white">
                        +{project.members.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-3">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/dashboard/projects/${project._id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View project →
                  </Link>
                  <span
                    className={classNames(
                      project.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
                    )}
                  >
                    {project.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
