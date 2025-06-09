'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { projectsApi } from '@/lib/api'; // Assuming projectsApi path
import { PROJECT_ROLES } from '@/config/constants';
import type { ProjectMember, User } from '@/types';

interface UpdateMemberRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: ProjectMember | null;
  projectId: string;
  onRoleUpdated: () => void;
}

// Filter out 'owner' role for selection
const selectableRolesForUpdate = PROJECT_ROLES.filter(role => role !== 'owner');

export default function UpdateMemberRoleModal({ isOpen, onClose, member, projectId, onRoleUpdated }: UpdateMemberRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<ProjectMember['role'] | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && member) {
      setSelectedRole(member.role);
      setError(null); // Clear error when modal opens or member changes
    } else if (!isOpen) {
      // Delay reset for animation
      const timer = setTimeout(() => {
        setSelectedRole('');
        setError(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, member]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value as ProjectMember['role']);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!member || typeof member.user === 'string') {
      setError("Invalid member data.");
      return;
    }
    if (!selectedRole) {
      setError("Please select a role.");
      return;
    }
    if (selectedRole === member.role) {
      setError("The new role must be different from the current role.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await projectsApi.updateMemberRole(projectId, member.user.id, { role: selectedRole });
      onRoleUpdated();
      onClose();
    } catch (err: any) {
      console.error('Error updating member role:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to update role.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const memberName = member && typeof member.user === 'object' ? `${member.user.firstName} ${member.user.lastName}` : 'Member';

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
                  Update Role for {memberName}
                </Dialog.Title>
                {member && typeof member.user === 'object' && (
                    <p className="mt-1 text-sm text-gray-500">Current role: {capitalize(member.role)}</p>
                )}
                <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">New Role <span className="text-red-500">*</span></label>
                    <select
                      name="role"
                      id="role"
                      value={selectedRole}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="" disabled>Select a role</option>
                      {selectableRolesForUpdate.map(role => (
                        <option key={role} value={role} disabled={role === member?.role}>
                          {capitalize(role)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex"><div className="ml-3"><p className="text-sm font-medium text-red-700">{error}</p></div></div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onClick={onClose} disabled={submitting}>
                      Cancel
                    </button>
                    <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50" disabled={submitting || !selectedRole || selectedRole === member?.role}>
                      {submitting ? 'Updating...' : 'Update Role'}
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
