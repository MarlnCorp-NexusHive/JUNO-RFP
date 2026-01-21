import React from 'react';
import Sidebar from '../../../components/Sidebar';
import { adminHeadFeatures } from './adminHeadFeatures';

export default function AdminHeadSidebar() {
  return <Sidebar features={adminHeadFeatures} userLabel="Admin Head" />;
} 