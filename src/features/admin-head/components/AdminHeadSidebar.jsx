import React from 'react';
import Sidebar from '../../../components/Sidebar';
import { adminHeadFeatures } from './adminHeadFeatures';
import { useTranslation } from 'react-i18next';

export default function AdminHeadSidebar() {
  const { t } = useTranslation();
  return <Sidebar features={adminHeadFeatures} userLabel={t('roles.adminHead')} />;
} 