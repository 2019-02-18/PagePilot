import type { AtomicAction } from '../core/types'
import { PageUnderstandingEngine } from './PageUnderstandingEngine'
import { VisualFeedback } from './VisualFeedback'

export interface ExecutionResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

export class ExecutionEngine {
  private understanding: PageUnderstandingEngine
  private feedback: VisualFeedback

  constructor(understanding: PageUnderstandingEngine, feedback: VisualFeedback) {
    this.understanding = understanding
    this.feedback = feedback
  }

  async executeAction(action: AtomicAction): Promise<ExecutionResult> {
    try {
      switch (action.type) {
        case 'click':
          return await this.executeClick(action.selector)
        case 'fill':
          return await this.executeFill(action.selector, action.value)
        case 'select':
          return await this.executeSelect(action.selector, action.value)
        case 'navigate':
          return await this.executeNavigate(action.url)
        case 'observe':
          return await this.executeObserve(action.timeout)
        default:
          return { success: false, message: `不支持的操作类型` }
      }
    } catch (err) {
      return { success: false, message: `执行失败: ${(err as Error).message}` }
    }
  }

  private async executeClick(selector: string): Promise<ExecutionResult> {
    const el = this.understanding.findElementBySelector(selector)
    if (!el) return { success: false, message: `未找到元素: ${selector}` }

    await this.feedback.animateCursorTo(el as HTMLElement)
    this.feedback.highlightElement(el as HTMLElement)
    await this.delay(300)

    ;(el as HTMLElement).click()
    await this.delay(500)
    this.feedback.clearHighlight()
    return { success: true, message: `已点击「${el.textContent?.trim().slice(0, 20)}」` }
  }

  private async executeFill(selector: string, value: string): Promise<ExecutionResult> {
    const el = this.understanding.findElementBySelector(selector) as HTMLInputElement | null
    if (!el) return { success: false, message: `未找到输入框: ${selector}` }

    await this.feedback.animateCursorTo(el)
    this.feedback.highlightElement(el)
    await this.delay(300)

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, value)
    } else {
      el.value = value
    }
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    await this.delay(400)
    this.feedback.clearHighlight()
    return { success: true, message: `已填写「${value}」` }
  }

  private async executeSelect(selector: string, value: string): Promise<ExecutionResult> {
    const el = this.understanding.findElementBySelector(selector) as HTMLSelectElement | null
    if (!el) return { success: false, message: `未找到选择框: ${selector}` }

    await this.feedback.animateCursorTo(el)
    this.feedback.highlightElement(el)
    await this.delay(300)

    const options = Array.from(el.options)
    const target = options.find((o) => o.text === value || o.value === value)
    if (!target) return { success: false, message: `选项中未找到「${value}」` }

    const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype, 'value'
    )?.set
    if (nativeSelectValueSetter) {
      nativeSelectValueSetter.call(el, target.value)
    } else {
      el.value = target.value
    }
    el.dispatchEvent(new Event('change', { bubbles: true }))
    await this.delay(400)
    this.feedback.clearHighlight()
    return { success: true, message: `已选择「${value}」` }
  }

  private async executeNavigate(url: string): Promise<ExecutionResult> {
    const currentPath = window.location.pathname
    if (currentPath === url) return { success: true, message: '已在目标页面' }

    this.feedback.showHalo()
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
    await this.delay(600)
    this.feedback.hideHalo()
    return { success: true, message: `已导航到 ${url}` }
  }

  private async executeObserve(timeout?: number): Promise<ExecutionResult> {
    const waitTime = timeout || 1000
    await this.delay(waitTime)
    const snapshot = this.understanding.scan()
    return {
      success: true,
      message: `已观察页面状态`,
      data: { tables: snapshot.tables.length, buttons: snapshot.buttons.length },
    }
  }

  async executeCheckboxGroup(selector: string, values: string[]): Promise<ExecutionResult> {
    const container = this.understanding.findElementBySelector(selector)
    if (!container) {
      const checkboxes = document.querySelectorAll('.checkbox-group label')
      for (const label of checkboxes) {
        const text = label.textContent?.trim() || ''
        if (values.includes(text)) {
          const checkbox = label.querySelector('input[type="checkbox"]') as HTMLInputElement
          if (checkbox && !checkbox.checked) {
            checkbox.click()
            await this.delay(200)
          }
        }
      }
      return { success: true, message: `已勾选 ${values.join('、')}` }
    }
    return { success: true, message: `已勾选项目` }
  }

  readTableData(selector: string): Record<string, unknown> {
    const table = this.understanding.findElementBySelector(selector)
    if (!table) return { rows: [], count: 0 }
    const rows: string[][] = []
    table.querySelectorAll('tbody tr').forEach((tr) => {
      const cells: string[] = []
      tr.querySelectorAll('td').forEach((td) => cells.push(td.textContent?.trim() || ''))
      rows.push(cells)
    })
    return { rows, count: rows.length }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
