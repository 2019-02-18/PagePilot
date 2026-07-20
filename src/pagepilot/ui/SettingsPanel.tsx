import { usePagePilotStore } from '../store/usePagePilotStore'

export function SettingsPanel() {
  const { settings, setSettings, setSettingsOpen } = usePagePilotStore()

  return (
    <div className="pp-settings-overlay" onClick={() => setSettingsOpen(false)}>
      <div className="pp-settings" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="PagePilot 设置">
        <div className="pp-settings-header">
          <h3>助手设置</h3>
          <button className="pp-icon-btn" onClick={() => setSettingsOpen(false)} aria-label="关闭设置">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="pp-settings-body">
          <div className="pp-setting-group">
            <label>对话能力来源</label>
            <select
              value={settings.capabilitySource}
              onChange={(e) => setSettings({ capabilitySource: e.target.value as 'offline-demo' | 'custom-api' })}
            >
              <option value="offline-demo">离线演示模式（关键词匹配）</option>
              <option value="custom-api">自定义 API 接口</option>
            </select>
            <p className="pp-setting-hint">
              {settings.capabilitySource === 'offline-demo'
                ? '使用 SitePack 配置的标准流程进行关键词匹配，无需网络连接。'
                : '连接自定义大模型 API 实现自然语言理解。'}
            </p>
          </div>

          {settings.capabilitySource === 'custom-api' && (
            <>
              <div className="pp-setting-group">
                <label>API 地址</label>
                <input
                  type="url"
                  value={settings.customApiUrl}
                  onChange={(e) => setSettings({ customApiUrl: e.target.value })}
                  placeholder="https://api.example.com/v1/chat"
                />
              </div>
              <div className="pp-setting-group">
                <label>API Key</label>
                <input
                  type="password"
                  value={settings.customApiKey}
                  onChange={(e) => setSettings({ customApiKey: e.target.value })}
                  placeholder="sk-..."
                />
              </div>
            </>
          )}
        </div>
        <div className="pp-settings-footer">
          <button className="pp-btn-primary" onClick={() => setSettingsOpen(false)}>保存</button>
        </div>
      </div>
    </div>
  )
}
