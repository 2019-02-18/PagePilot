import { useState } from 'react'
import { PageHeader, Card, Btn, Tag, StatCard } from '@host/components'
import { batchRecords, schools, grades, examItems, type BatchRecord } from '@host/data/mock'

export default function BatchManagement() {
  const [records, setRecords] = useState<BatchRecord[]>(batchRecords)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('全部')
  const [form, setForm] = useState({ school: '', grade: '', classRange: '', date: '', items: [] as string[] })

  const statusMap: Record<string, { label: string; type: 'default' | 'success' | 'warning' | 'info' | 'review' | 'brand' }> = {
    draft: { label: '草稿', type: 'default' },
    configured: { label: '已配置', type: 'info' },
    in_progress: { label: '进行中', type: 'review' },
    completed: { label: '已完成', type: 'success' },
    archived: { label: '已归档', type: 'default' },
  }

  const filtered = filterStatus === '全部' ? records : records.filter((r) => statusMap[r.status]?.label === filterStatus)

  const handleSubmit = () => {
    const newRecord: BatchRecord = {
      id: String(records.length + 1),
      code: `B-202607-${String(records.length + 15).padStart(3, '0')}`,
      name: `${form.school}${form.grade}${form.items.join('/')}体检`,
      school: form.school,
      stage: '小学',
      grade: form.grade,
      startDate: form.date,
      endDate: form.date,
      status: 'configured',
      studentCount: 0,
      items: form.items,
    }
    setRecords([newRecord, ...records])
    setDrawerOpen(false)
    setForm({ school: '', grade: '', classRange: '', date: '', items: [] })
  }

  const toggleItem = (item: string) => {
    setForm((f) => ({
      ...f,
      items: f.items.includes(item) ? f.items.filter((i) => i !== item) : [...f.items, item],
    }))
  }

  return (
    <>
      <PageHeader
        title="体检任务管理"
        desc="按学年/学期/学段维度组织体检活动，含体检项配置、参检对象与进度跟踪"
        actions={
          <>
            <Btn>导出批次台账</Btn>
            <Btn variant="primary" onClick={() => setDrawerOpen(true)} data-pagepilot-action="new-batch">
              + 新建批次
            </Btn>
          </>
        }
      />

      <div className="stat-grid cols-5">
        <StatCard label="本学年批次总数" value={records.length} foot="较上学年 ↑ 6" />
        <StatCard label="进行中" value={records.filter((r) => r.status === 'in_progress').length} color="var(--review)" />
        <StatCard label="待启动" value={records.filter((r) => r.status === 'configured').length} color="var(--warning)" />
        <StatCard label="已完成" value={records.filter((r) => r.status === 'completed').length} color="var(--success)" />
        <StatCard label="已归档" value={records.filter((r) => r.status === 'archived').length} />
      </div>

      <Card>
        <div className="filter-bar">
          <div className="filter-item">
            <label>学年</label>
            <select><option>2025-2026 学年</option><option>2024-2025 学年</option></select>
          </div>
          <div className="filter-item">
            <label>学段</label>
            <select><option>全部</option><option>小学</option><option>初中</option><option>高中</option></select>
          </div>
          <div className="filter-item">
            <label>批次状态</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option>全部</option><option>草稿</option><option>已配置</option><option>进行中</option><option>已完成</option><option>已归档</option>
            </select>
          </div>
          <div className="filter-actions">
            <Btn>重置</Btn>
            <Btn variant="primary">查询</Btn>
          </div>
        </div>
      </Card>

      <Card className="" >
        <div className="table-toolbar">
          <span className="total">共 <b>{filtered.length}</b> 条数据</span>
        </div>
        <table className="data-table" data-pagepilot-table="batch-list">
          <thead>
            <tr>
              <th>批次编号</th>
              <th>批次名称</th>
              <th>学校</th>
              <th>学段</th>
              <th>年级</th>
              <th>体检日期</th>
              <th>参检人数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td style={{ fontFamily: 'monospace' }}>{r.code}</td>
                <td>{r.name}</td>
                <td>{r.school}</td>
                <td><Tag type="brand">{r.stage}</Tag></td>
                <td>{r.grade}</td>
                <td>{r.startDate} ~ {r.endDate}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.studentCount}</td>
                <td><Tag type={statusMap[r.status]?.type}>{statusMap[r.status]?.label}</Tag></td>
                <td><a href="#" style={{ color: 'var(--brand)', fontSize: 12 }}>查看</a></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>共 {filtered.length} 条</span>
          <button className="active">1</button>
        </div>
      </Card>

      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>新建体检批次</h3>
              <button className="drawer-close" onClick={() => setDrawerOpen(false)}>×</button>
            </div>
            <div className="drawer-body">
              <div className="form-group">
                <label>学校<span className="required">*</span></label>
                <select value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} data-pagepilot-field="school">
                  <option value="">请选择学校</option>
                  {schools.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>年级<span className="required">*</span></label>
                <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} data-pagepilot-field="grade">
                  <option value="">请选择年级</option>
                  {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>班级范围<span className="required">*</span></label>
                <input value={form.classRange} onChange={(e) => setForm({ ...form, classRange: e.target.value })} placeholder="如：全部班级 / 1-3班" data-pagepilot-field="classRange" />
              </div>
              <div className="form-group">
                <label>体检日期<span className="required">*</span></label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} data-pagepilot-field="date" />
              </div>
              <div className="form-group">
                <label>体检项目<span className="required">*</span></label>
                <div className="checkbox-group" data-pagepilot-field="items-checkbox">
                  {examItems.map((item) => (
                    <label key={item}>
                      <input type="checkbox" checked={form.items.includes(item)} onChange={() => toggleItem(item)} />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="drawer-footer">
              <Btn onClick={() => setDrawerOpen(false)}>取消</Btn>
              <Btn variant="primary" onClick={handleSubmit} data-pagepilot-action="save-batch">保存</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
