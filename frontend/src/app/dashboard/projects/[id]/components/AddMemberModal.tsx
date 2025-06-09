'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { projectsApi } from '@/lib/api'; // Assuming projectsApi path
import { PROJECT_ROLES } from '@/config/constants';
import type { ProjectMember } from '@/types'; // For role type

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onMemberAdded: () => void;
}

// Filter out 'owner' role for selection, as it's usually special
const selectableRoles = PROJECT_ROLES.filter(role => role !== 'owner');
const defaultRole = selectableRoles.length > 0 ? selectableRoles[0] : '';


interface AddMemberFormData {
  email: string;
  role: typeof selectableRoles[number] | ''; // Ensure role can be initially empty or one of the selectable roles
}

export default function AddMemberModal({ isOpen, onClose, projectId, onMemberAdded }: AddMemberModalProps) {
  const initialFormData: AddMemberFormData = {
    email: '',
    role: defaultRole,
  };

  const [formData, setFormData] = useState<AddMemberFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal becomes visible, if it wasn't already reset by closing
      setFormData(initialFormData);
      setError(null);
    } else {
      // Delay reset to allow modal close animation
      const timer = setTimeout(() => {
        setFormData(initialFormData);
        setError(null);
      }, 300); // Adjust to match modal transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialFormData]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!formData.role) {
      setError('Role is required.');
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError('Please enter a valid email address.');
        return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await projectsApi.addMember(projectId, {
        email: formData.email,
        role: formData.role as ProjectMember['role'], // Cast to ensure type correctness for API
      });
      onMemberAdded();
      onClose();
    } catch (err: any) {
      console.error('Error adding member:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to add member. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Add New Member
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">User Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
                    <select
                      name="role"
                      id="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      {selectableRoles.map(role => (
                        <option key={role} value={role}>{capitalize(role)}</option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3"> {/* Adjusted for better alignment if an icon was here */}
                                <p className="text-sm font-medium text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={onClose}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                      disabled={submitting}
                    >
                      {submitting ? 'Adding...' : 'Add Member'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
