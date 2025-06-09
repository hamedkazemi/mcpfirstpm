'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { itemsApi } from '@/lib/api'; // Assuming itemsApi path
import type { Item } from '@/types'; // Assuming type path
import { ITEM_TYPES, ITEM_PRIORITIES, DEFAULT_ITEM_TYPE, DEFAULT_ITEM_PRIORITY } from '@/config/constants';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onItemCreated: () => void;
}

interface ItemFormData {
  title: string;
  description: string;
  type: typeof ITEM_TYPES[number];
  priority: typeof ITEM_PRIORITIES[number];
}

export default function NewItemModal({ isOpen, onClose, projectId, onItemCreated }: NewItemModalProps) {
  const initialFormData: ItemFormData = {
    title: '',
    description: '',
    type: DEFAULT_ITEM_TYPE,
    priority: DEFAULT_ITEM_PRIORITY,
  };

  const [formData, setFormData] = useState<ItemFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow modal close animation
      setTimeout(() => {
        setFormData(initialFormData);
        setError(null);
      }, 300); // Adjust delay to match modal transition duration
    }
  }, [isOpen, initialFormData]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Assuming itemsApi.createItem takes projectId and then the item data
      // The actual API might expect { ...formData, projectId }
      // Adjust the payload according to your itemsApi.createItem signature
      await itemsApi.createItem(projectId, {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        // project: projectId, // This might be needed in the payload depending on API
      });
      onItemCreated(); // This should trigger a re-fetch in the parent
      onClose(); // Close modal on success
    } catch (err: any) {
      console.error('Error creating item:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create item. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Function to capitalize first letter for display
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
                  Create New Item
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      id="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      name="type"
                      id="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      {ITEM_TYPES.map(type => (
                        <option key={type} value={type}>{capitalize(type.replace('_', ' '))}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      name="priority"
                      id="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      {ITEM_PRIORITIES.map(priority => (
                        <option key={priority} value={priority}>{capitalize(priority)}</option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
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
                      {submitting ? 'Creating...' : 'Create Item'}
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
