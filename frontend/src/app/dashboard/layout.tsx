'use client';

import React, { useState, Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, Transition, Menu } from '@headlessui/react';
import {
  HomeIcon,
  FolderIcon,
  UserGroupIcon,
  TagIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
  BellIcon,
  SparklesIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderIcon },
  { name: 'Tasks', href: '/dashboard/tasks', icon: ClipboardDocumentCheckIcon },
  { name: 'Calendar', href: '/dashboard/calendar', icon: CalendarDaysIcon },
  { name: 'Team', href: '/dashboard/team', icon: UserGroupIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon },
  { name: 'Tags', href: '/dashboard/tags', icon: TagIcon },
];

const bottomNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.setAttribute('data-theme', 'modernDark');
    } else {
      document.documentElement.setAttribute('data-theme', 'modern');
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="btn btn-ghost btn-circle"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </Transition.Child>
                
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-base-100 px-6 pb-2">
                  <div className="flex h-16 shrink-0 items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                      <span className="text-white text-lg font-bold">M</span>
                    </div>
                    <h1 className="text-xl font-bold text-gradient">MCP Manager</h1>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                              <li key={item.name}>
                                <Link
                                  href={item.href}
                                  className={classNames(
                                    isActive
                                      ? 'bg-primary/10 text-primary'
                                      : 'text-base-content hover:text-primary hover:bg-base-200',
                                    'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-medium transition-all'
                                  )}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  <item.icon
                                    className={classNames(
                                      isActive ? 'text-primary' : 'text-base-content/60 group-hover:text-primary',
                                      'h-6 w-6 shrink-0 transition-colors'
                                    )}
                                  />
                                  {item.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-base-100 border-r border-base-300 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center gap-3 mt-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center hover-grow">
              <span className="text-white text-lg font-bold">M</span>
            </div>
            <h1 className="text-xl font-bold text-gradient">MCP Manager</h1>
          </div>
          
          {/* User Info */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-primary text-white rounded-full w-10">
                  <span className="text-sm">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-base-content/60">{user?.role || 'Developer'}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-base-content hover:text-primary hover:bg-base-200',
                            'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-medium transition-all'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              isActive ? 'text-primary' : 'text-base-content/60 group-hover:text-primary',
                              'h-6 w-6 shrink-0 transition-colors'
                            )}
                          />
                          {item.name}
                          {item.name === 'Projects' && (
                            <span className="ml-auto badge badge-primary badge-sm">12</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              
              {/* Bottom Navigation */}
              <li className="mt-auto">
                <ul role="list" className="-mx-2 space-y-1">
                  {bottomNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-base-content hover:text-primary hover:bg-base-200',
                            'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-medium transition-all'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              isActive ? 'text-primary' : 'text-base-content/60 group-hover:text-primary',
                              'h-6 w-6 shrink-0 transition-colors'
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>

          {/* Pro Banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary p-4 text-white">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <SparklesIcon className="w-6 h-6 mb-2" />
            <h3 className="font-semibold text-sm mb-1">Upgrade to Pro</h3>
            <p className="text-xs text-white/80 mb-3">Unlock advanced features and unlimited projects</p>
            <button className="btn btn-sm btn-white">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>

      <div className="lg:pl-72">
        {/* Header */}
        <header className="navbar-glass border-b border-base-300">
          <div className="navbar-start">
            <button
              type="button"
              className="btn btn-ghost btn-circle lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          <div className="navbar-center hidden lg:flex">
            {/* Search Bar */}
            <div className="form-control">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search projects, tasks..."
                  className="input input-bordered input-sm w-96 focus:w-[28rem] transition-all glass"
                />
                <button className="btn btn-square btn-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="navbar-end gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="btn btn-ghost btn-circle"
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Notifications */}
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle">
                <div className="indicator">
                  <BellIcon className="h-5 w-5" />
                  <span className="badge badge-xs badge-primary indicator-item">3</span>
                </div>
              </label>
              <div tabIndex={0} className="card compact dropdown-content z-[1] mt-3 w-64 shadow-2xl bg-base-100 animate-slide-down">
                <div className="card-body">
                  <h3 className="card-title text-sm">Notifications</h3>
                  <div className="space-y-2">
                    <p className="text-xs">New task assigned to you</p>
                    <p className="text-xs">Project deadline approaching</p>
                    <p className="text-xs">Team member joined project</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="btn btn-ghost btn-circle">
                <div className="avatar placeholder">
                  <div className="bg-primary text-white rounded-full w-8">
                    <span className="text-xs">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                  </div>
                </div>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-base-200 rounded-xl bg-base-100 shadow-2xl ring-1 ring-base-300 focus:outline-none animate-slide-down">
                  <div className="px-4 py-3">
                    <p className="text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-base-content/60 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/dashboard/profile"
                          className={classNames(
                            active ? 'bg-base-200' : '',
                            'flex items-center gap-2 px-4 py-2 text-sm transition-colors'
                          )}
                        >
                          <UserCircleIcon className="w-4 h-4" />
                          Your Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/dashboard/settings"
                          className={classNames(
                            active ? 'bg-base-200' : '',
                            'flex items-center gap-2 px-4 py-2 text-sm transition-colors'
                          )}
                        >
                          <Cog6ToothIcon className="w-4 h-4" />
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                  </div>
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={classNames(
                            active ? 'bg-base-200' : '',
                            'flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-error transition-colors'
                          )}
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </header>

        {/* Main content */}
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
