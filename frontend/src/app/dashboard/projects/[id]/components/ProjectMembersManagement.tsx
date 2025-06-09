'use client';

import React, { useState, useEffect } from 'react';
import type { ProjectMember, User } from '@/types';
import { projectsApi } from '@/lib/api'; // Assuming projectsApi for removeMember & updateMemberRole
import { PlusIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import AddMemberModal from './AddMemberModal';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import UpdateMemberRoleModal from './UpdateMemberRoleModal'; // Import UpdateMemberRoleModal

interface ProjectMembersManagementProps {
  projectId: string;
  initialMembers: ProjectMember[];
  onMembersUpdate: () => void; // For future use when add/edit/remove member functionality is added
}

// Helper function for class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Function to capitalize first letter for display
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ProjectMembersManagement({ projectId, initialMembers }: ProjectMembersManagementProps) {
  const [members, setMembers] = useState<ProjectMember[]>(initialMembers);
  const [loading, setLoading] = useState(false); // For actions like remove, update role
  const [error, setError] = useState<string | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // State for Remove Member
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);
  const [isRemoveConfirmModalOpen, setIsRemoveConfirmModalOpen] = useState(false);

  // State for Update Member Role
  const [memberToUpdateRole, setMemberToUpdateRole] = useState<ProjectMember | null>(null);
  const [isUpdateRoleModalOpen, setIsUpdateRoleModalOpen] = useState(false);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const handleAddMemberClick = () => {
    setIsAddMemberModalOpen(true);
  };

  const handleMemberAdded = () => {
    if (props.onMembersUpdate) { // Check if the prop is provided
      props.onMembersUpdate();
    }
    setIsAddMemberModalOpen(false);
  };

  const handleRemoveMemberClick = (member: ProjectMember) => {
    if (typeof member.user === 'string') {
      // Cannot remove if user is just an ID string without more info
      // Or, API must be able to handle removal by ProjectMember._id or similar unique identifier for the membership record itself
      setError("Cannot remove member: user details are incomplete.");
      return;
    }
    setMemberToRemove(member);
    setIsRemoveConfirmModalOpen(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || typeof memberToRemove.user === 'string') {
      setError("Invalid member data for removal.");
      setIsRemoveConfirmModalOpen(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await projectsApi.removeMember(projectId, memberToRemove.user.id); // Assuming removeMember takes projectId and userId
      if (props.onMembersUpdate) {
        props.onMembersUpdate();
      }
    } catch (err: any) {
      console.error('Error removing member:', err);
      setError(err.response?.data?.message || 'Failed to remove member.');
    } finally {
      setLoading(false);
      setIsRemoveConfirmModalOpen(false);
      setMemberToRemove(null);
    }
  };

  const handleChangeRoleClick = (member: ProjectMember) => {
     if (typeof member.user === 'string') {
      setError("Cannot update role: user details are incomplete.");
      return;
    }
    setMemberToUpdateRole(member);
    setIsUpdateRoleModalOpen(true);
  };

  const handleRoleUpdated = () => {
    if (props.onMembersUpdate) {
      props.onMembersUpdate();
    }
    setIsUpdateRoleModalOpen(false);
    setMemberToUpdateRole(null);
  };

  const getUserFullName = (user: string | User): string => {
    if (typeof user === 'string') {
      return 'User ID: ' + user; // Fallback if user is just an ID
    }
    return `${user.firstName} ${user.lastName}`;
  };

  const getUserEmail = (user: string | User): string => {
    if (typeof user === 'string') {
      return 'N/A'; // Fallback if user is just an ID
    }
    return user.email;
  };

  const renderMembersTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined At</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {members.map((member) => (
            <tr key={typeof member.user === 'string' ? member.user : member.user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    {typeof member.user === 'object' && member.user.avatar ? (
                      <img className="h-10 w-10 rounded-full" src={member.user.avatar} alt="" />
                    ) : (
                      <UserCircleIcon className="h-10 w-10 text-gray-300" />
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{getUserFullName(member.user)}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getUserEmail(member.user)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{capitalize(member.role)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(member.joinedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleChangeRoleClick(member)}
                  className="text-indigo-600 hover:text-indigo-900 mr-2 disabled:opacity-50"
                  disabled={member.role === 'owner'}
                >
                  Change Role
                </button>
                <button
                  onClick={() => handleRemoveMemberClick(member)}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  disabled={member.role === 'owner'}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Project Members</h2>
        <button
          type="button"
          onClick={handleAddMemberClick}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Add Member
        </button>
      </div>

      {loading && ( // This loading is for actions within this component, not initial load
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && members.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
           <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No members</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding members to this project.
          </p>
        </div>
      )}

      {!loading && !error && members.length > 0 && renderMembersTable()}

      {isAddMemberModalOpen && (
        <AddMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          projectId={projectId}
          onMemberAdded={handleMemberAdded}
        />
      )}

      {isRemoveConfirmModalOpen && memberToRemove && typeof memberToRemove.user === 'object' && (
        <ConfirmationModal
          isOpen={isRemoveConfirmModalOpen}
          onClose={() => { setIsRemoveConfirmModalOpen(false); setMemberToRemove(null); }}
          onConfirm={handleConfirmRemoveMember}
          title="Remove Member"
          message={`Are you sure you want to remove ${getUserFullName(memberToRemove.user)} (${getUserEmail(memberToRemove.user)}) from this project?`}
          confirmButtonText="Remove"
        />
      )}

      {isUpdateRoleModalOpen && memberToUpdateRole && (
        <UpdateMemberRoleModal
          isOpen={isUpdateRoleModalOpen}
          onClose={() => { setIsUpdateRoleModalOpen(false); setMemberToUpdateRole(null); }}
          member={memberToUpdateRole}
          projectId={projectId}
          onRoleUpdated={handleRoleUpdated}
        />
      )}
    </div>
  );
}
