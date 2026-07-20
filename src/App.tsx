import { Routes, Route, Navigate } from 'react-router-dom'
import HostLayout from '@host/layouts/HostLayout'
import Dashboard from '@host/pages/Dashboard'
import BatchManagement from '@host/pages/BatchManagement'
import DataDetail from '@host/pages/DataDetail'
import AbnormalScreening from '@host/pages/AbnormalScreening'
import RecheckList from '@host/pages/RecheckList'
import { AssistantWidget } from '@pagepilot/ui/AssistantWidget'
import sitePackConfig from '@sitepack/instances/health-exam-admin/sitepack.json'
import type { SitePackConfig } from '@pagepilot/core/types'

const sitePack = sitePackConfig as unknown as SitePackConfig

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HostLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="batch" element={<BatchManagement />} />
          <Route path="data-detail" element={<DataDetail />} />
          <Route path="abnormal-screening" element={<AbnormalScreening />} />
          <Route path="recheck-list" element={<RecheckList />} />
        </Route>
      </Routes>
      <AssistantWidget sitePack={sitePack} />
    </>
  )
}
