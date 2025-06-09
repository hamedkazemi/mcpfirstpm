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
  { name: 'Projects', href: '/dashboard/projects', icon: FolderIcon, badge: 12 },
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
    <div className="min-h-screen bg-gray-50">
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
            <div className="fixed inset-0 bg-gray-900/80" />
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
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>
                
                <div className="flex grow flex-col gap-y-6 overflow-y-auto bg-gray-900 px-6 pb-4 shadow-2xl">
                  {/* Mobile Logo */}
                  <div className="flex h-16 shrink-0 items-center gap-3 mt-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg font-bold">M</span>
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">MCP Manager</h1>
                  </div>

                  {/* Mobile User Info */}
                  <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full w-10 shadow-lg">
                          <span className="text-sm font-semibold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-white">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-400">{user?.role || 'Developer'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="space-y-2">
                          {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                              <li key={item.name}>
                                <Link
                                  href={item.href}
                                  className={classNames(
                                    isActive
                                      ? 'bg-indigo-600 text-white shadow-lg'
                                      : 'text-gray-300 hover:text-white hover:bg-gray-800',
                                    'group flex items-center gap-x-3 rounded-xl p-3.5 text-sm leading-6 font-medium transition-all duration-200'
                                  )}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  <item.icon
                                    className={classNames(
                                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                                      'h-5 w-5 shrink-0 transition-colors duration-200'
                                    )}
                                  />
                                  <span className="flex-1">{item.name}</span>
                                  {item.badge && (
                                    <span className={classNames(
                                      isActive ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300 group-hover:bg-indigo-500 group-hover:text-white',
                                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200'
                                    )}>
                                      {item.badge}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                      
                      {/* Mobile Bottom Navigation */}
                      <li className="mt-auto">
                        <ul role="list" className="space-y-2">
                          {bottomNavigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                              <li key={item.name}>
                                <Link
                                  href={item.href}
                                  className={classNames(
                                    isActive
                                      ? 'bg-indigo-600 text-white shadow-lg'
                                      : 'text-gray-300 hover:text-white hover:bg-gray-800',
                                    'group flex items-center gap-x-3 rounded-xl p-3.5 text-sm leading-6 font-medium transition-all duration-200'
                                  )}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  <item.icon
                                    className={classNames(
                                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                                      'h-5 w-5 shrink-0 transition-colors duration-200'
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
        <div className="flex grow flex-col gap-y-6 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4 shadow-xl">
          {/* Desktop Logo */}
          <div className="flex h-16 shrink-0 items-center gap-3 mt-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center hover:scale-105 transition-transform duration-200 shadow-lg">
              <span className="text-white text-lg font-bold">M</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">MCP Manager</h1>
          </div>
          
          {/* Desktop User Info */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full w-10 shadow-lg">
                  <span className="text-sm font-semibold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role || 'Developer'}</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-8">
              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400 mb-2 px-2 uppercase tracking-wider">
                  Main Menu
                </div>
                <ul role="list" className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            isActive
                              ? 'bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700 font-semibold pl-3'
                              : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50 border-l-4 border-transparent hover:border-indigo-200 pl-3',
                            'group flex items-center gap-x-3 rounded-r-xl py-3 pr-3 text-sm leading-6 transition-all duration-200'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500',
                              'h-5 w-5 shrink-0 transition-colors duration-200'
                            )}
                          />
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <span className={classNames(
                              isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-700',
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200'
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              
              {/* Desktop Bottom Navigation */}
              <li className="mt-auto">
                <div className="text-xs font-semibold leading-6 text-gray-400 mb-2 px-2 uppercase tracking-wider">
                  Account
                </div>
                <ul role="list" className="space-y-1">
                  {bottomNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            isActive
                              ? 'bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700 font-semibold pl-3'
                              : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50 border-l-4 border-transparent hover:border-indigo-200 pl-3',
                            'group flex items-center gap-x-3 rounded-r-xl py-3 pr-3 text-sm leading-6 transition-all duration-200'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500',
                              'h-5 w-5 shrink-0 transition-colors duration-200'
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

          {/* Premium Pro Banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-5 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="w-5 h-5 text-yellow-400" />
                <span className="text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent px-2 py-1 rounded-full border border-yellow-400/30">
                  PRO
                </span>
              </div>
              <h3 className="font-bold text-base mb-1">Upgrade to Pro</h3>
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                Unlock advanced features, unlimited projects, and priority support
              </p>
              <button className="btn btn-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 hover:scale-105 transition-all duration-200 shadow-lg w-full font-medium">
                <SparklesIcon className="w-4 h-4 mr-1" />
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:pl-72">
        {/* Premium Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 max-w-lg mx-8 hidden lg:block">
              {/* Premium Search Bar */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search projects, tasks, and more..."
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Premium Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 tooltip tooltip-bottom"
                data-tip={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>

              {/* Premium Notifications */}
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 tooltip tooltip-bottom" data-tip="Notifications">
                  <div className="relative">
                    <BellIcon className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">3</span>
                    </span>
                  </div>
                </label>
                <div tabIndex={0} className="dropdown-content z-[1] mt-3 w-80 rounded-xl bg-white shadow-2xl border border-gray-200 animate-slide-down">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">3 new</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">New task assigned</p>
                          <p className="text-xs text-gray-500">UI Design for Project Alpha</p>
                          <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Project deadline approaching</p>
                          <p className="text-xs text-gray-500">Mobile App due in 2 days</p>
                          <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Team member joined</p>
                          <p className="text-xs text-gray-500">Sarah joined Project Beta</p>
                          <p className="text-xs text-gray-400 mt-1">3 hours ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors duration-200">
                        View All Notifications
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Profile dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 hover:bg-indigo-50 transition-all duration-200 tooltip tooltip-bottom" data-tip="Account Menu">
                  <div className="avatar placeholder">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full w-8 shadow-lg">
                      <span className="text-xs font-semibold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
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
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-gray-200 focus:outline-none animate-slide-down border border-gray-200">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full w-10 shadow-lg">
                            <span className="text-sm font-semibold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/dashboard/profile"
                            className={classNames(
                              active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700',
                              'flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 hover:bg-indigo-50'
                            )}
                          >
                            <UserCircleIcon className="w-5 h-5" />
                            <div>
                              <div className="font-medium">Your Profile</div>
                              <div className="text-xs text-gray-500">Manage your account</div>
                            </div>
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/dashboard/settings"
                            className={classNames(
                              active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700',
                              'flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 hover:bg-indigo-50'
                            )}
                          >
                            <Cog6ToothIcon className="w-5 h-5" />
                            <div>
                              <div className="font-medium">Settings</div>
                              <div className="text-xs text-gray-500">Preferences & privacy</div>
                            </div>
                          </Link>
                        )}
                      </Menu.Item>
                    </div>
                    <div className="py-1 border-t border-gray-100">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={classNames(
                              active ? 'bg-red-50 text-red-700' : 'text-red-600',
                              'flex items-center gap-3 w-full text-left px-4 py-3 text-sm transition-all duration-200 hover:bg-red-50'
                            )}
                          >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            <div>
                              <div className="font-medium">Sign out</div>
                              <div className="text-xs text-red-400">Log out of your account</div>
                            </div>
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
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
