import { WelcomeWidget } from './WelcomeWidget.jsx';
import { OverviewWidget } from './OverviewWidget.jsx';
import { RecentInquiriesWidget } from './RecentInquiriesWidget.jsx';
import { RecentEditsWidget } from './RecentEditsWidget.jsx';

export function welcomeWidget() {
  return { name: 'yozo-welcome', component: WelcomeWidget, layout: { width: 'full' } };
}
export function overviewWidget() {
  return { name: 'yozo-overview', component: OverviewWidget, layout: { width: 'medium' } };
}
export function recentInquiriesWidget() {
  return { name: 'yozo-inquiries', component: RecentInquiriesWidget, layout: { width: 'medium' } };
}
export function recentEditsWidget() {
  return { name: 'yozo-edits', component: RecentEditsWidget, layout: { width: 'medium' } };
}
