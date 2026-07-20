export class VisualFeedback {
  private highlightEl: HTMLElement | null = null
  private cursorEl: HTMLElement | null = null
  private haloEl: HTMLElement | null = null
  private styleInjected = false

  private injectStyles(): void {
    if (this.styleInjected) return
    const style = document.createElement('style')
    style.id = 'pagepilot-feedback-styles'
    style.textContent = `
      .pp-highlight {
        outline: 3px solid #2563EB !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
        transition: outline 0.2s ease !important;
        z-index: 9998 !important;
      }
      .pp-cursor {
        position: fixed;
        width: 20px;
        height: 20px;
        pointer-events: none;
        z-index: 99999;
        transition: left 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), top 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
      }
      .pp-cursor::before {
        content: '';
        display: block;
        width: 0;
        height: 0;
        border-left: 7px solid #1D4ED8;
        border-right: 7px solid transparent;
        border-bottom: 12px solid transparent;
        border-top: 7px solid #1D4ED8;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
      }
      .pp-cursor::after {
        content: '';
        position: absolute;
        top: 12px;
        left: 4px;
        width: 8px;
        height: 8px;
        background: rgba(37, 99, 235, 0.3);
        border-radius: 50%;
        animation: pp-pulse 0.6s ease-out;
      }
      @keyframes pp-pulse {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(2.5); opacity: 0; }
      }
      .pp-halo {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 99990;
        border: 3px solid rgba(37, 99, 235, 0.4);
        border-radius: 8px;
        animation: pp-halo-pulse 1s ease-in-out;
        opacity: 0;
      }
      @keyframes pp-halo-pulse {
        0% { opacity: 0; }
        30% { opacity: 1; }
        100% { opacity: 0; }
      }
      .pp-step-badge {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        background: #1E293B;
        color: #F8FAFC;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-family: 'Noto Sans SC', sans-serif;
        z-index: 99999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 8px;
        animation: pp-badge-in 0.3s ease;
      }
      .pp-step-badge .pp-step-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #3B82F6;
        animation: pp-dot-pulse 1s infinite;
      }
      @keyframes pp-badge-in {
        from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes pp-dot-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `
    document.head.appendChild(style)
    this.styleInjected = true
  }

  highlightElement(el: HTMLElement): void {
    this.injectStyles()
    this.clearHighlight()
    el.classList.add('pp-highlight')
    this.highlightEl = el
  }

  clearHighlight(): void {
    if (this.highlightEl) {
      this.highlightEl.classList.remove('pp-highlight')
      this.highlightEl = null
    }
  }

  async animateCursorTo(el: HTMLElement): Promise<void> {
    this.injectStyles()
    const rect = el.getBoundingClientRect()
    const targetX = rect.left + rect.width / 2
    const targetY = rect.top + rect.height / 2

    if (!this.cursorEl) {
      this.cursorEl = document.createElement('div')
      this.cursorEl.className = 'pp-cursor'
      this.cursorEl.style.left = `${targetX}px`
      this.cursorEl.style.top = `${targetY}px`
      document.body.appendChild(this.cursorEl)
    } else {
      this.cursorEl.style.left = `${targetX}px`
      this.cursorEl.style.top = `${targetY}px`
    }
    await new Promise((r) => setTimeout(r, 450))
  }

  hideCursor(): void {
    if (this.cursorEl) {
      this.cursorEl.remove()
      this.cursorEl = null
    }
  }

  showHalo(): void {
    this.injectStyles()
    this.hideHalo()
    this.haloEl = document.createElement('div')
    this.haloEl.className = 'pp-halo'
    document.body.appendChild(this.haloEl)
    setTimeout(() => this.hideHalo(), 1000)
  }

  hideHalo(): void {
    if (this.haloEl) {
      this.haloEl.remove()
      this.haloEl = null
    }
  }

  showStepBadge(text: string, step: number, total: number): void {
    this.injectStyles()
    this.hideStepBadge()
    const badge = document.createElement('div')
    badge.className = 'pp-step-badge'
    badge.id = 'pp-step-badge'
    badge.innerHTML = `<span class="pp-step-dot"></span><span>[${step}/${total}] ${text}</span>`
    document.body.appendChild(badge)
  }

  hideStepBadge(): void {
    const existing = document.getElementById('pp-step-badge')
    if (existing) existing.remove()
  }

  destroy(): void {
    this.clearHighlight()
    this.hideCursor()
    this.hideHalo()
    this.hideStepBadge()
    const style = document.getElementById('pagepilot-feedback-styles')
    if (style) style.remove()
    this.styleInjected = false
  }
}
