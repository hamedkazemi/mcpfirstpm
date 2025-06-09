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
      color: 'primary',
      bgGradient: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Completed Tasks',
      value: '248',
      change: '+23%',
      changeType: 'increase',
      icon: CheckCircleIcon,
      color: 'success',
      bgGradient: 'from-green-500 to-emerald-600',
    },
    {
      name: 'In Progress',
      value: '36',
      change: '-5%',
      changeType: 'decrease',
      icon: ClockIcon,
      color: 'warning',
      bgGradient: 'from-yellow-500 to-orange-600',
    },
    {
      name: 'Overdue',
      value: '4',
      change: '-50%',
      changeType: 'decrease',
      icon: ExclamationCircleIcon,
      color: 'error',
      bgGradient: 'from-red-500 to-rose-600',
    },
  ];

  const recentProjects = [
    { id: 1, name: 'Website Redesign', status: 'In Progress', progress: 65, team: 5, dueDate: '2025-02-15' },
    { id: 2, name: 'Mobile App Development', status: 'Planning', progress: 20, team: 8, dueDate: '2025-03-30' },
    { id: 3, name: 'Marketing Campaign', status: 'Completed', progress: 100, team: 4, dueDate: '2025-01-10' },
    { id: 4, name: 'Database Migration', status: 'In Progress', progress: 45, team: 3, dueDate: '2025-02-28' },
  ];

  const upcomingDeadlines = [
    { id: 1, task: 'Finalize UI mockups', project: 'Website Redesign', dueIn: '2 days' },
    { id: 2, task: 'Submit project proposal', project: 'Mobile App Development', dueIn: '5 days' },
    { id: 3, task: 'Deploy to staging', project: 'Database Migration', dueIn: '1 week' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary p-8 text-white">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.firstName || 'User'}! 👋
          </h1>
          <p className="mt-2 text-lg text-white/80">
            Here&apos;s what&apos;s happening with your projects today.
          </p>
          <div className="mt-6">
            <Link href="/dashboard/projects/new" className="btn btn-white btn-sm">
              <PlusIcon className="w-4 h-4" />
              Create New Project
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.name}
            className="card-modern card-hover-lift animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-base-content/60">{stat.name}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2 gap-1">
                    {stat.changeType === 'increase' ? (
                      <ArrowTrendingUpIcon className="w-4 h-4 text-success" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4 text-success" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-success' : 'text-success'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-base-content/60">vs last month</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.bgGradient} p-3 text-white hover-grow`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 card-modern">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <h2 className="card-title">Recent Projects</h2>
              <Link href="/dashboard/projects" className="btn btn-ghost btn-sm">
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="p-4 rounded-xl border border-base-300 hover:bg-base-200/50 transition-all cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-base-content/60">
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
                    <div className={`badge ${
                      project.status === 'Completed' ? 'badge-success' :
                      project.status === 'In Progress' ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {project.status}
                    </div>
                  </div>
                  
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-base-content/60">{project.progress}%</span>
                    </div>
                    <progress 
                      className={`progress ${
                        project.progress === 100 ? 'progress-success' :
                        project.progress >= 50 ? 'progress-warning' :
                        'progress-info'
                      }`} 
                      value={project.progress} 
                      max="100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card-modern">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <h2 className="card-title">Upcoming Deadlines</h2>
              <button className="btn btn-ghost btn-xs btn-circle">
                <CalendarIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline, index) => (
                <div
                  key={deadline.id}
                  className="p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-all cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <h4 className="font-medium text-sm">{deadline.task}</h4>
                  <p className="text-xs text-base-content/60 mt-1">{deadline.project}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <ClockIcon className="w-3 h-3 text-warning" />
                    <span className="text-xs font-medium text-warning">Due in {deadline.dueIn}</span>
                  </div>
                </div>
              ))}
              
              <button className="btn btn-block btn-ghost btn-sm mt-4">
                View All Tasks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart Placeholder */}
      <div className="card-modern">
        <div className="card-body">
          <div className="flex items-center justify-between mb-6">
            <h2 className="card-title">Project Activity</h2>
            <select className="select select-bordered select-sm">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          
          <div className="h-64 flex items-center justify-center bg-base-200/30 rounded-xl">
            <div className="text-center">
              <ChartBarIcon className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
              <p className="text-base-content/60">Activity chart will be displayed here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/projects/new" className="btn btn-outline hover:btn-primary group">
          <FolderIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          New Project
        </Link>
        <Link href="/dashboard/tasks/new" className="btn btn-outline hover:btn-secondary group">
          <CheckCircleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          New Task
        </Link>
        <Link href="/dashboard/team" className="btn btn-outline hover:btn-accent group">
          <UserGroupIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Invite Team
        </Link>
        <Link href="/dashboard/reports" className="btn btn-outline hover:btn-info group">
          <ChartBarIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          View Reports
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
