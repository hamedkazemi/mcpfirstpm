'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FolderIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  SparklesIcon,
  FireIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Mock data for demonstration
  const stats = [
    {
      name: 'Total Projects',
      value: '12',
      change: '+10%',
      changeType: 'increase',
      icon: FolderIcon,
      color: 'from-indigo-500 to-indigo-600',
      background: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      name: 'Completed Tasks',
      value: '248',
      change: '+23%',
      changeType: 'increase',
      icon: CheckCircleIcon,
      color: 'from-emerald-500 to-emerald-600',
      background: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      name: 'In Progress',
      value: '36',
      change: '-5%',
      changeType: 'decrease',
      icon: ClockIcon,
      color: 'from-amber-500 to-amber-600',
      background: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      name: 'Overdue',
      value: '4',
      change: '-50%',
      changeType: 'decrease',
      icon: ExclamationCircleIcon,
      color: 'from-red-500 to-red-600',
      background: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  const recentProjects = [
    { 
      id: 1, 
      name: 'Website Redesign', 
      status: 'In Progress', 
      progress: 65, 
      team: 5, 
      dueDate: '2025-02-15',
      priority: 'high',
      avatar: 'WR'
    },
    { 
      id: 2, 
      name: 'Mobile App Development', 
      status: 'Planning', 
      progress: 20, 
      team: 8, 
      dueDate: '2025-03-30',
      priority: 'medium',
      avatar: 'MA'
    },
    { 
      id: 3, 
      name: 'Marketing Campaign', 
      status: 'Completed', 
      progress: 100, 
      team: 4, 
      dueDate: '2025-01-10',
      priority: 'low',
      avatar: 'MC'
    },
    { 
      id: 4, 
      name: 'Database Migration', 
      status: 'In Progress', 
      progress: 45, 
      team: 3, 
      dueDate: '2025-02-28',
      priority: 'high',
      avatar: 'DM'
    },
  ];

  const upcomingDeadlines = [
    { 
      id: 1, 
      task: 'Finalize UI mockups', 
      project: 'Website Redesign', 
      dueIn: '2 days',
      priority: 'high',
      status: 'urgent'
    },
    { 
      id: 2, 
      task: 'Submit project proposal', 
      project: 'Mobile App Development', 
      dueIn: '5 days',
      priority: 'medium',
      status: 'upcoming'
    },
    { 
      id: 3, 
      task: 'Deploy to staging', 
      project: 'Database Migration', 
      dueIn: '1 week',
      priority: 'low',
      status: 'normal'
    },
  ];

  const quickActions = [
    { 
      name: 'New Project', 
      href: '/dashboard/projects/new', 
      icon: FolderIcon, 
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      description: 'Start a new project'
    },
    { 
      name: 'Add Task', 
      href: '/dashboard/tasks/new', 
      icon: CheckCircleIcon, 
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      description: 'Create a new task'
    },
    { 
      name: 'Invite Team', 
      href: '/dashboard/team', 
      icon: UserGroupIcon, 
      color: 'bg-purple-600 hover:bg-purple-700 text-white',
      description: 'Add team members'
    },
    { 
      name: 'View Reports', 
      href: '/dashboard/reports', 
      icon: ChartBarIcon, 
      color: 'bg-amber-600 hover:bg-amber-700 text-white',
      description: 'Analytics & insights'
    },
  ];

  return (
    <div className="space-y-8 animate-premium-fade-in">
      {/* Premium Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 text-white shadow-2xl">
        {/* Premium Background Elements */}
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full blur-xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <SparklesIcon className="w-8 h-8 text-yellow-400" />
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 text-xs font-medium text-slate-900">
                  PRO
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {user?.firstName || 'User'}! 👋
              </h1>
              <p className="text-xl text-gray-300 mb-6 max-w-2xl">
                You have <span className="font-semibold text-white">3 urgent tasks</span> and 
                <span className="font-semibold text-white"> 2 projects</span> approaching deadlines. 
                Let&apos;s get productive! 🚀
              </p>
              <div className="flex flex-wrap gap-3">
                <Link 
                  href="/dashboard/projects/new" 
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-slate-900 shadow-lg hover:bg-gray-50 hover:scale-105 transition-all duration-200"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Project
                </Link>
                <Link 
                  href="/dashboard/tasks" 
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 hover:scale-105 transition-all duration-200"
                >
                  <BoltIcon className="w-5 h-5" />
                  View Tasks
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-white/20">
                <FireIcon className="w-16 h-16 text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 animate-premium-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.background}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <div className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                stat.changeType === 'increase' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {stat.changeType === 'increase' ? (
                  <ArrowTrendingUpIcon className="w-3 h-3" />
                ) : (
                  <ArrowTrendingDownIcon className="w-3 h-3" />
                )}
                {stat.change}
              </div>
            </div>
            
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-xs text-gray-400 mt-1">vs last month</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Projects - Takes up 2 columns */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
                <p className="text-sm text-gray-600">Track your active projects</p>
              </div>
              <Link 
                href="/dashboard/projects" 
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors duration-200"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-300 cursor-pointer animate-premium-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {project.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{project.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <UserGroupIcon className="w-4 h-4" />
                            {project.team} members
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            Due {new Date(project.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        project.priority === 'high' ? 'bg-red-100 text-red-700' :
                        project.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {project.priority}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        project.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-bold text-gray-900">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 rounded-full ${
                          project.progress === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                          project.progress >= 50 ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' :
                          'bg-gradient-to-r from-amber-500 to-amber-600'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Upcoming Deadlines</h2>
                <p className="text-sm text-gray-600">Don&apos;t miss important dates</p>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200">
                <CalendarIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline, index) => (
                <div
                  key={deadline.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer animate-premium-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-gray-900">{deadline.task}</h4>
                    <div className={`w-2 h-2 rounded-full ${
                      deadline.status === 'urgent' ? 'bg-red-500' :
                      deadline.status === 'upcoming' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`} />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{deadline.project}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3 text-amber-500" />
                      <span className={`text-xs font-medium ${
                        deadline.status === 'urgent' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        Due in {deadline.dueIn}
                      </span>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      deadline.priority === 'high' ? 'bg-red-100 text-red-700' :
                      deadline.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {deadline.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
              View All Tasks
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-600">Get things done faster</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action, index) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02] animate-premium-slide-up ${action.color}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <action.icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">{action.name}</div>
                    <div className="text-xs opacity-80">{action.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Project Activity</h2>
            <p className="text-sm text-gray-600">Track your productivity over time</p>
          </div>
          <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
        
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 font-medium">Activity Chart</p>
            <p className="text-sm text-gray-400">Data visualization will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
