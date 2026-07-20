export interface BatchRecord {
  id: string
  code: string
  name: string
  school: string
  stage: string
  grade: string
  startDate: string
  endDate: string
  status: 'draft' | 'configured' | 'in_progress' | 'completed' | 'archived'
  studentCount: number
  items: string[]
}

export interface ExamDataRecord {
  id: string
  studentName: string
  xuejiHao: string
  school: string
  grade: string
  className: string
  batch: string
  heightCm: number
  weightKg: number
  bmi: number
  visionL: number
  visionR: number
  abnormalLevel: 'normal' | 'mild' | 'moderate' | 'severe'
  abnormalItems: string[]
  auditStatus: 'pending' | 'passed' | 'rejected'
}

export interface RecheckRecord {
  id: string
  studentName: string
  xuejiHao: string
  school: string
  grade: string
  className: string
  abnormalItems: string[]
  abnormalLevel: 'mild' | 'moderate' | 'severe'
  generatedAt: string
  notified: boolean
}

export const schools = ['阳光小学', '明德小学', '育才中学', '实验中学', '第一中学']
export const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三']
export const examItems = ['视力', '身高体重', '血压', '龋齿', '脊柱', '肺活量', '血常规']

export const batchRecords: BatchRecord[] = [
  { id: '1', code: 'B-202603-014', name: '2026春季视力专项体检', school: '阳光小学', stage: '小学', grade: '三年级', startDate: '2026-03-15', endDate: '2026-03-20', status: 'in_progress', studentCount: 320, items: ['视力'] },
  { id: '2', code: 'B-202603-013', name: '2026春季全面体检', school: '明德小学', stage: '小学', grade: '全年级', startDate: '2026-03-10', endDate: '2026-03-25', status: 'in_progress', studentCount: 860, items: ['视力', '身高体重', '血压', '龋齿'] },
  { id: '3', code: 'B-202602-008', name: '2025秋季体检补检', school: '育才中学', stage: '初中', grade: '初一', startDate: '2026-02-20', endDate: '2026-02-28', status: 'completed', studentCount: 450, items: ['视力', '身高体重', '血压', '脊柱'] },
  { id: '4', code: 'B-202601-003', name: '2025秋季全面体检', school: '实验中学', stage: '初中', grade: '全年级', startDate: '2025-10-08', endDate: '2025-10-30', status: 'archived', studentCount: 1200, items: ['视力', '身高体重', '血压', '龋齿', '脊柱', '肺活量'] },
  { id: '5', code: 'B-202604-001', name: '2026春季一年级体检', school: '阳光小学', stage: '小学', grade: '一年级', startDate: '2026-04-01', endDate: '2026-04-05', status: 'configured', studentCount: 180, items: ['视力', '身高体重', '龋齿'] },
]

const studentNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二', '陈小明', '林小红', '黄大伟', '刘美丽', '杨志强']

export const examDataRecords: ExamDataRecord[] = studentNames.map((name, i) => {
  const isAbnormal = i % 3 !== 0
  const level = isAbnormal ? (['mild', 'moderate', 'severe'] as const)[i % 3] : 'normal'
  return {
    id: String(i + 1),
    studentName: name,
    xuejiHao: `XJ2026${String(1001 + i)}`,
    school: '阳光小学',
    grade: '三年级',
    className: `${(i % 4) + 1}班`,
    batch: 'B-202603-014',
    heightCm: 128 + (i % 15),
    weightKg: 25 + (i % 10),
    bmi: 15.2 + (i % 5) * 0.8,
    visionL: isAbnormal ? 4.2 + (i % 4) * 0.1 : 5.0,
    visionR: isAbnormal ? 4.3 + (i % 3) * 0.1 : 5.1,
    abnormalLevel: level,
    abnormalItems: isAbnormal ? ['视力'] : [],
    auditStatus: i % 5 === 0 ? 'pending' : 'passed',
  }
})

export const recheckRecords: RecheckRecord[] = examDataRecords
  .filter((r) => r.abnormalLevel !== 'normal')
  .map((r, i) => ({
    id: String(i + 1),
    studentName: r.studentName,
    xuejiHao: r.xuejiHao,
    school: r.school,
    grade: r.grade,
    className: r.className,
    abnormalItems: r.abnormalItems,
    abnormalLevel: r.abnormalLevel as 'mild' | 'moderate' | 'severe',
    generatedAt: '2026-03-22',
    notified: false,
  }))
