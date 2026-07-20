import { useState } from 'react'
import { PageHeader, Card, Btn, Tag, StatCard } from '@host/components'
import { recheckRecords, type RecheckRecord } from '@host/data/mock'

export default function RecheckList() {
  const [records] = useState<RecheckRecord[]>(recheckRecords)
  const [confirmModal, setConfirmModal] = useState(false)

  const levelMap: Record<string, { label: string; type: 'warning' | 'danger' }> = {
    mild: { label: '轻度', type: 'warning' },
    moderate: { label: '中度', type: 'warning' },
    severe: { label: '重度', type: 'danger' },
  }

  return (
    <>
      <PageHeader
        title="复查名单"
        desc="管理体检异常学生复查名单，支持生成和通知"
        actions={
          <>
            <Btn variant="danger" data-pagepilot-action="notify" onClick={() => setConfirmModal(true)}>
              发送复查通知
            </Btn>
            <Btn variant="primary" data-pagepilot-action="export-list">导出名单</Btn>
          </>
        }
      />

      <div className="stat-grid cols-4">
        <StatCard label="复查总人数" value={records.length} color="var(--danger)" />
        <StatCard label="重度异常" value={records.filter((r) => r.abnormalLevel === 'severe').length} color="var(--danger)" />
        <StatCard label="已通知" value={records.filter((r) => r.notified).length} color="var(--success)" />
        <StatCard label="未通知" value={records.filter((r) => !r.notified).length} color="var(--warning)" />
      </div>

      <Card>
        <div className="table-toolbar">
          <span className="total">共 <b>{records.length}</b> 名学生待复查</span>
        </div>
        <table className="data-table" data-pagepilot-table="recheck-list">
          <thead>
            <tr>
              <th>姓名</th>
              <th>学籍号</th>
              <th>学校</th>
              <th>年级</th>
              <th>班级</th>
              <th>异常项目</th>
              <th>异常等级</th>
              <th>生成日期</th>
              <th>通知状态</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.studentName}</td>
                <td style={{ fontFamily: 'monospace' }}>{r.xuejiHao}</td>
                <td>{r.school}</td>
                <td>{r.grade}</td>
                <td>{r.className}</td>
                <td>{r.abnormalItems.join('、')}</td>
                <td><Tag type={levelMap[r.abnormalLevel]?.type}>{levelMap[r.abnormalLevel]?.label}</Tag></td>
                <td>{r.generatedAt}</td>
                <td><Tag type={r.notified ? 'success' : 'default'}>{r.notified ? '已通知' : '未通知'}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认发送通知</h3>
              <button className="drawer-close" onClick={() => setConfirmModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>即将向 <b>{records.filter((r) => !r.notified).length}</b> 名学生家长发送复查通知，确认继续？</p>
              <p style={{ marginTop: 8, color: 'var(--danger)', fontSize: 12 }}>此操作为高风险操作，发送后不可撤回。</p>
            </div>
            <div className="modal-footer">
              <Btn onClick={() => setConfirmModal(false)}>取消</Btn>
              <Btn variant="primary" onClick={() => setConfirmModal(false)}>确认发送</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
