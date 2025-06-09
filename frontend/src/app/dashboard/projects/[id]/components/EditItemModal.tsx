'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { itemsApi } from '@/lib/api';
import type { Item, User } from '@/types';
import { ITEM_TYPES, ITEM_PRIORITIES, ITEM_STATUSES, DEFAULT_ITEM_TYPE, DEFAULT_ITEM_PRIORITY } from '@/config/constants';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  projectMembers: User[];
  onItemUpdated: () => void;
}

interface EditItemFormData {
  title: string;
  description: string;
  type: typeof ITEM_TYPES[number];
  priority: typeof ITEM_PRIORITIES[number];
  status: typeof ITEM_STATUSES[number];
  assigneeId: string; // Store assignee by ID
}

export default function EditItemModal({ isOpen, onClose, item, projectMembers, onItemUpdated }: EditItemModalProps) {
  const initialFormData: EditItemFormData = {
    title: '',
    description: '',
    type: DEFAULT_ITEM_TYPE,
    priority: DEFAULT_ITEM_PRIORITY,
    status: 'todo', // Default status
    assigneeId: '', // Default to unassigned
  };

  const [formData, setFormData] = useState<EditItemFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        type: item.type || DEFAULT_ITEM_TYPE,
        priority: item.priority || DEFAULT_ITEM_PRIORITY,
        status: item.status || 'todo',
        assigneeId: typeof item.assignee === 'object' ? (item.assignee as User).id : (item.assignee as string || ''),
      });
      setError(null); // Clear error when a new item is loaded or modal opens
    } else if (!isOpen) {
        // Delay reset to allow modal close animation
        setTimeout(() => {
            setFormData(initialFormData); // Reset form when modal is closed
            setError(null);
        }, 300);
    }
  }, [item, isOpen, initialFormData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item) {
      setError("No item selected for editing.");
      return;
    }
    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Construct payload, ensure assigneeId is passed as 'assignee' if API expects that field name
      const payload: Partial<Item> & { assignee?: string } = {
        ...formData,
        assignee: formData.assigneeId || undefined, // Send undefined if empty string to potentially unassign
      };
      // delete (payload as any).assigneeId; // remove assigneeId if API doesn't expect it

      await itemsApi.updateItem(item._id, payload);
      onItemUpdated();
      onClose();
    } catch (err: any) {
      console.error('Error updating item:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to update item. Please try again.';
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Edit Item
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"/>
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"/>
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                    <select name="type" id="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                      {ITEM_TYPES.map(type => (<option key={type} value={type}>{capitalize(type.replace('_', ' '))}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                      {ITEM_STATUSES.map(status => (<option key={status} value={status}>{capitalize(status.replace('_', ' '))}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                    <select name="priority" id="priority" value={formData.priority} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                      {ITEM_PRIORITIES.map(priority => (<option key={priority} value={priority}>{capitalize(priority)}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">Assignee</label>
                    <select name="assigneeId" id="assigneeId" value={formData.assigneeId} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                      <option value="">Unassigned</option>
                      {projectMembers.map(member => (
                        <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>
                      ))}
                    </select>
                  </div>

                  {error && (<div className="rounded-md bg-red-50 p-4"><div className="flex"><div className="ml-3"><p className="text-sm font-medium text-red-700">{error}</p></div></div></div>)}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Changes'}
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
