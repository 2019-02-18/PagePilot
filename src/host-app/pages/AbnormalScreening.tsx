import { useState } from 'react'
import { PageHeader, Card, Btn, Tag, StatCard } from '@host/components'
import { examDataRecords, grades } from '@host/data/mock'

export default function AbnormalScreening() {
  const [filterGrade, setFilterGrade] = useState('全部')
  const [filterType, setFilterType] = useState('全部')
  const [results, setResults] = useState(examDataRecords.filter((r) => r.abnormalLevel !== 'normal'))

  const handleQuery = () => {
    let data = examDataRecords.filter((r) => r.abnormalLevel !== 'normal')
    if (filterGrade !== '全部') data = data.filter((r) => r.grade === filterGrade)
    if (filterType !== '全部') data = data.filter((r) => r.abnormalItems.includes(filterType))
    setResults(data)
  }

  const severeCount = results.filter((r) => r.abnormalLevel === 'severe').length
  const moderateCount = results.filter((r) => r.abnormalLevel === 'moderate').length
  const mildCount = results.filter((r) => r.abnormalLevel === 'mild').length

  return (
    <>
      <PageHeader title="异常筛查" desc="按年级和异常指标筛选体检异常学生" />

      <div className="stat-grid cols-4">
        <StatCard label="异常学生总数" value={results.length} color="var(--danger)" />
        <StatCard label="重度异常" value={severeCount} color="var(--danger)" />
        <StatCard label="中度异常" value={moderateCount} color="var(--warning)" />
        <StatCard label="轻度异常" value={mildCount} color="var(--warning)" />
      </div>

      <Card>
        <div className="filter-bar">
          <div className="filter-item">
            <label>年级</label>
            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} data-pagepilot-field="screening-grade">
              <option>全部</option>
              {grades.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>异常类型</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} data-pagepilot-field="screening-type">
              <option>全部</option>
              <option>视力</option>
              <option>身高体重</option>
              <option>血压</option>
              <option>龋齿</option>
            </select>
          </div>
          <div className="filter-actions">
            <Btn>重置</Btn>
            <Btn variant="primary" onClick={handleQuery} data-pagepilot-action="screening-query">查询</Btn>
          </div>
        </div>
      </Card>

      <Card>
        <div className="table-toolbar">
          <span className="total">共 <b>{results.length}</b> 名异常学生</span>
        </div>
        <table className="data-table" data-pagepilot-table="abnormal-list">
          <thead>
            <tr>
              <th>姓名</th>
              <th>学籍号</th>
              <th>学校</th>
              <th>年级</th>
              <th>班级</th>
              <th>异常项目</th>
              <th>异常等级</th>
              <th>视力L/R</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id}>
                <td>{r.studentName}</td>
                <td style={{ fontFamily: 'monospace' }}>{r.xuejiHao}</td>
                <td>{r.school}</td>
                <td>{r.grade}</td>
                <td>{r.className}</td>
                <td>{r.abnormalItems.join('、')}</td>
                <td>
                  <Tag type={r.abnormalLevel === 'severe' ? 'danger' : 'warning'}>
                    {r.abnormalLevel === 'severe' ? '重度' : r.abnormalLevel === 'moderate' ? '中度' : '轻度'}
                  </Tag>
                </td>
                <td style={{ fontFamily: 'monospace' }}>{r.visionL.toFixed(1)} / {r.visionR.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
