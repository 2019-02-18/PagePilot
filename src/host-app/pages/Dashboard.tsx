import { PageHeader, Card, StatCard } from '@host/components'

export default function Dashboard() {
  return (
    <>
      <PageHeader title="首页" desc="全局概览" />
      <div className="stat-grid cols-4">
        <StatCard label="接入学校" value={128} foot="较上月 ↑ 4" />
        <StatCard label="在校学生" value="86,412" foot="较上月 ↑ 3.2%" />
        <StatCard label="进行中批次" value={14} color="var(--review)" foot="今日新增 2" />
        <StatCard label="异常指标学生" value="2,340" color="var(--danger)" foot="待处理" />
      </div>
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>待办事项</h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="tag warning">待处理</span> 3 批次数据待审核
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="tag info">提醒</span> 阳光小学三年级视力体检进行中
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="tag danger">异常</span> 12 名学生视力重度异常待复查
          </li>
        </ul>
      </Card>
    </>
  )
}
