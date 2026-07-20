import type { PageSnapshot, NavItemInfo, ButtonInfo, FormInfo, FieldInfo, TableInfo, OverlayInfo } from '../core/types'

export class PageUnderstandingEngine {
  scan(): PageSnapshot {
    return {
      url: window.location.pathname,
      title: document.title,
      navItems: this.scanNav(),
      buttons: this.scanButtons(),
      forms: this.scanForms(),
      tables: this.scanTables(),
      overlays: this.scanOverlays(),
    }
  }

  private scanNav(): NavItemInfo[] {
    const items: NavItemInfo[] = []
    document.querySelectorAll('[data-pagepilot-nav], .nav-menu a, nav a').forEach((el) => {
      if (this.isHidden(el)) return
      items.push({
        label: el.textContent?.trim() || '',
        selector: this.buildSelector(el),
        active: el.classList.contains('active') || el.getAttribute('aria-current') === 'page',
      })
    })
    return items
  }

  private scanButtons(): ButtonInfo[] {
    const buttons: ButtonInfo[] = []
    document.querySelectorAll('button, [role="button"], [data-pagepilot-action]').forEach((el) => {
      if (this.isHidden(el)) return
      const label = el.textContent?.trim() || el.getAttribute('aria-label') || ''
      if (!label) return
      buttons.push({
        label,
        selector: this.buildSelector(el),
        variant: el.getAttribute('data-pagepilot-action') || (el as HTMLElement).className || 'default',
      })
    })
    return buttons
  }

  private scanForms(): FormInfo[] {
    const forms: FormInfo[] = []
    const containers = document.querySelectorAll('form, .drawer-body, .modal-body, [data-pagepilot-form]')
    containers.forEach((container) => {
      if (this.isHidden(container)) return
      const fields = this.scanFields(container)
      if (fields.length > 0) {
        forms.push({ selector: this.buildSelector(container), fields })
      }
    })
    return forms
  }

  private scanFields(container: Element): FieldInfo[] {
    const fields: FieldInfo[] = []
    container.querySelectorAll('input, select, textarea, [data-pagepilot-field]').forEach((el) => {
      if (this.isHidden(el)) return
      const group = el.closest('.form-group')
      const labelEl = group?.querySelector('label')
      const label = labelEl?.textContent?.replace('*', '').trim() || el.getAttribute('placeholder') || el.getAttribute('aria-label') || ''
      const required = labelEl?.querySelector('.required') !== null || el.hasAttribute('required')
      const inputEl = el as HTMLInputElement | HTMLSelectElement
      fields.push({
        label,
        selector: this.buildSelector(el),
        type: inputEl.tagName.toLowerCase() === 'select' ? 'select' : (inputEl as HTMLInputElement).type || 'text',
        required,
        value: inputEl.value || '',
      })
    })
    return fields
  }

  private scanTables(): TableInfo[] {
    const tables: TableInfo[] = []
    document.querySelectorAll('table, [data-pagepilot-table]').forEach((el) => {
      if (this.isHidden(el)) return
      const columns: string[] = []
      el.querySelectorAll('thead th').forEach((th) => columns.push(th.textContent?.trim() || ''))
      const rowCount = el.querySelectorAll('tbody tr').length
      tables.push({ selector: this.buildSelector(el), columns, rowCount })
    })
    return tables
  }

  private scanOverlays(): OverlayInfo[] {
    const overlays: OverlayInfo[] = []
    document.querySelectorAll('.drawer, .modal, [role="dialog"]').forEach((el) => {
      const visible = !this.isHidden(el)
      const titleEl = el.querySelector('.drawer-header h3, .modal-header h3, [class*="title"]')
      overlays.push({
        type: el.classList.contains('drawer') ? 'drawer' : 'modal',
        selector: this.buildSelector(el),
        title: titleEl?.textContent?.trim() || '',
        visible,
      })
    })
    return overlays
  }

  findElementByText(text: string, tagFilter?: string): Element | null {
    const selector = tagFilter || 'button, a, [role="button"], [data-pagepilot-action]'
    const candidates = document.querySelectorAll(selector)
    for (const el of candidates) {
      if (el.textContent?.trim().includes(text) && !this.isHidden(el)) return el
    }
    return null
  }

  findElementBySelector(selector: string): Element | null {
    const el = document.querySelector(selector)
    return el && !this.isHidden(el) ? el : null
  }

  getRequiredFields(container?: Element): FieldInfo[] {
    const root = container || document.documentElement
    return this.scanFields(root).filter((f) => f.required)
  }

  buildSelector(el: Element): string {
    if (el.id) return `#${el.id}`
    const ppAction = el.getAttribute('data-pagepilot-action')
    if (ppAction) return `[data-pagepilot-action="${ppAction}"]`
    const ppField = el.getAttribute('data-pagepilot-field')
    if (ppField) return `[data-pagepilot-field="${ppField}"]`
    const ppTable = el.getAttribute('data-pagepilot-table')
    if (ppTable) return `[data-pagepilot-table="${ppTable}"]`
    const ppNav = el.getAttribute('data-pagepilot-nav')
    if (ppNav) return `[data-pagepilot-nav="${ppNav}"]`
    const parent = el.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === el.tagName)
      const index = siblings.indexOf(el) + 1
      const parentSelector = this.buildSelector(parent)
      return `${parentSelector} > ${el.tagName.toLowerCase()}:nth-of-type(${index})`
    }
    return el.tagName.toLowerCase()
  }

  private isHidden(el: Element): boolean {
    const htmlEl = el as HTMLElement
    if (htmlEl.style?.display === 'none' || htmlEl.style?.visibility === 'hidden') return true
    if (htmlEl.offsetParent === null && htmlEl.tagName !== 'BODY' && getComputedStyle(htmlEl).position !== 'fixed') return true
    return false
  }
}
