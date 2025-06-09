'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { itemsApi } from '@/lib/api'; // Assuming itemsApi exists and is correctly pathed
import type { Item, User } from '@/types'; // Assuming type path
import { PlusIcon } from '@heroicons/react/24/outline';
import NewItemModal from './NewItemModal'; // Import NewItemModal
// ConfirmationModal will be needed later, importing it now.
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import EditItemModal from './EditItemModal'; // Import EditItemModal


interface ProjectItemsListProps {
  projectId: string;
  projectMembers: User[];
  loadingMembers: boolean; // Added prop
}

// Helper function for class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Helper to format date
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Helper to get assignee name
const getAssigneeName = (assignee?: string | User): string => {
  if (!assignee) return 'Unassigned';
  if (typeof assignee === 'string') {
    // If it's just an ID, we might not have the name without another fetch or if users list is passed.
    // For now, return 'Unassigned' or the ID. Or, ideally, API should populate this.
    return 'Unassigned (ID)'; // Or `assignee` to show the ID
  }
  return `${assignee.firstName} ${assignee.lastName}`;
};

export default function ProjectItemsList({ projectId }: ProjectItemsListProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  // State for Edit Item Modal
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State for Delete Item Confirmation Modal
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!projectId) return;
    setLoadingItems(true);
    setItemsError(null);
    try {
      const response = await itemsApi.getProjectItems(projectId);
      setItems(response.data || []);
    } catch (err) {
      console.error('Error fetching project items:', err);
      setItemsError('Failed to load tasks. Please try again.');
    } finally {
      setLoadingItems(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleNewItemClick = () => {
    setIsNewItemModalOpen(true);
  };

  const handleItemCreated = () => {
    fetchItems();
    setIsNewItemModalOpen(false); // Close modal after creation
  };

  const handleEditItemClick = (item: Item) => {
    setItemToEdit(item);
    setIsEditModalOpen(true);
  };

  const handleItemUpdated = () => {
    fetchItems();
    setIsEditModalOpen(false); // Close modal after update
  };

  const handleDeleteItemClick = (itemId: string) => {
    setItemToDeleteId(itemId);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDeleteItem = async () => {
    if (!itemToDeleteId) return;
    // TODO: Add loading state for delete operation if desired
    try {
      await itemsApi.deleteItem(itemToDeleteId); // Assuming itemsApi.deleteItem(itemId)
      fetchItems();
    } catch (err) {
      console.error("Error deleting item:", err);
      setItemsError("Failed to delete item. Please try again."); // Show error
    } finally {
      setIsDeleteConfirmModalOpen(false);
      setItemToDeleteId(null);
    }
  };

  const renderItemsTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                 <span className={classNames(
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    item.status === 'done' ? 'bg-green-100 text-green-800' :
                    item.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    item.status === 'review' ? 'bg-blue-100 text-blue-800' :
                    item.status === 'blocked' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800' // todo or others
                 )}>
                    {item.status.replace('_', ' ')}
                 </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={classNames(
                    item.priority === 'urgent' ? 'text-red-600 font-semibold' :
                    item.priority === 'high' ? 'text-orange-600 font-medium' :
                    item.priority === 'medium' ? 'text-yellow-600' :
                    'text-gray-500' // low
                )}>
                    {item.priority}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getAssigneeName(item.assignee)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.createdAt)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onClick={() => handleEditItemClick(item)} className="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                <button onClick={() => handleDeleteItemClick(item._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
        <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
        <button
          type="button"
          onClick={handleNewItemClick}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Item
        </button>
      </div>

      {loadingItems && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loadingItems && itemsError && (
        <div className="text-center py-12">
          <p className="text-red-600">{itemsError}</p>
          {/* Optionally, add a retry button here */}
        </div>
      )}

      {!loadingItems && !itemsError && items.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new task.
          </p>
          {/* The "New Item" button is already in the header, but could be repeated here if desired */}
        </div>
      )}

      {!loadingItems && !itemsError && items.length > 0 && renderItemsTable()}

      <NewItemModal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        projectId={projectId}
        onItemCreated={handleItemCreated}
      />

      {itemToEdit && isEditModalOpen && (
        <EditItemModal
          isOpen={isEditModalOpen}
          onClose={() => { setItemToEdit(null); setIsEditModalOpen(false); }}
          item={itemToEdit}
          projectMembers={projectMembers} // Pass projectMembers
          onItemUpdated={handleItemUpdated}
        />
      )}

      {isDeleteConfirmModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteConfirmModalOpen}
          onClose={() => { setIsDeleteConfirmModalOpen(false); setItemToDeleteId(null); }}
          onConfirm={handleConfirmDeleteItem}
          title="Delete Item"
          message="Are you sure you want to delete this item? This action cannot be undone."
          confirmButtonText="Delete"
        />
      )}
    </div>
  );
}
