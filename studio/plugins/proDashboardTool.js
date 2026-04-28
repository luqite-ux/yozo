import { definePlugin } from 'sanity';
import { HomeIcon } from '@sanity/icons';
import { ProDashboardTool } from '../components/proDashboard/ProDashboardTool.jsx';

export const proDashboardTool = definePlugin({
  name: 'yozo-pro-dashboard-tool',
  tools: (prev) => [
    {
      name: 'proDashboard',
      title: '概览中心',
      icon: HomeIcon,
      component: ProDashboardTool,
    },
    ...prev,
  ],
});
