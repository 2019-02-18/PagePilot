import { useState } from 'react'
import { PageHeader, Card, Btn, Tag } from '@host/components'
import { examDataRecords, grades, type ExamDataRecord } from '@host/data/mock'

export default function DataDetail() {
  const [filterGrade, setFilterGrade] = useState('全部')
  const [filterAbnormal, setFilterAbnormal] = useState('全部')
  const [data, setData] = useState<ExamDataRecord[]>(examDataRecords)

  const handleQuery = () => {
    let result = examDataRecords
    if (filterGrade !== '全部') result = result.filter((r) => r.grade === filterGrade)
    if (filterAbnormal !== '全部') {
      if (filterAbnormal === '视力') result = result.filter((r) => r.abnormalItems.includes('视力'))
      else result = result.filter((r) => r.abnormalLevel !== 'normal')
    }
    setData(result)
  }

  const levelMap: Record<string, { label: string; type: 'success' | 'warning' | 'danger' }> = {
    normal: { label: '正常', type: 'success' },
    mild: { label: '轻度异常', type: 'warning' },
    moderate: { label: '中度异常', type: 'warning' },
    severe: { label: '重度异常', type: 'danger' },
  }

  return (
    <>
      <PageHeader title="体检数据明细" desc="查看学生体检数据详情，支持按年级、异常指标筛选" />

      <Card>
        <div className="filter-bar">
          <div className="filter-item">
            <label>年级</label>
            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} data-pagepilot-field="grade-filter">
              <option>全部</option>
              {grades.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>异常指标</label>
            <select value={filterAbnormal} onChange={(e) => setFilterAbnormal(e.target.value)} data-pagepilot-field="abnormal-filter">
              <option>全部</option>
              <option>视力</option>
              <option>身高体重</option>
              <option>血压</option>
            </select>
          </div>
          <div className="filter-actions">
            <Btn>重置</Btn>
            <Btn variant="primary" onClick={handleQuery} data-pagepilot-action="query">查询</Btn>
          </div>
        </div>
      </Card>

      <Card>
        <div className="table-toolbar">
          <span className="total">共 <b>{data.length}</b> 条数据</span>
          <Btn variant="primary" data-pagepilot-action="generate-recheck">生成复查名单</Btn>
        </div>
        <table className="data-table" data-pagepilot-table="exam-data">
          <thead>
            <tr>
              <th>姓名</th>
              <th>学籍号</th>
              <th>学校</th>
              <th>年级</th>
              <th>班级</th>
              <th>身高(cm)</th>
              <th>体重(kg)</th>
              <th>BMI</th>
              <th>视力L</th>
              <th>视力R</th>
              <th>异常等级</th>
              <th>异常项目</th>
              <th>审核状态</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id}>
                <td>{r.studentName}</td>
                <td style={{ fontFamily: 'monospace' }}>{r.xuejiHao}</td>
                <td>{r.school}</td>
                <td>{r.grade}</td>
                <td>{r.className}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.heightCm}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.weightKg}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.bmi.toFixed(1)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.visionL < 4.5 ? 'var(--danger)' : undefined }}>{r.visionL.toFixed(1)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.visionR < 4.5 ? 'var(--danger)' : undefined }}>{r.visionR.toFixed(1)}</td>
                <td><Tag type={levelMap[r.abnormalLevel]?.type}>{levelMap[r.abnormalLevel]?.label}</Tag></td>
                <td>{r.abnormalItems.join('、') || '-'}</td>
                <td><Tag type={r.auditStatus === 'passed' ? 'success' : 'warning'}>{r.auditStatus === 'passed' ? '已通过' : '待审核'}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>共 {data.length} 条</span>
          <button className="active">1</button>
        </div>
      </Card>
    </>
  )
}
