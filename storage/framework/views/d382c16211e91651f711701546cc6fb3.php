<style>
[x-cloak]{display:none !important}

.disc-search-bar{background:var(--vx-bg-card);border:1px solid var(--vx-border);border-radius:var(--ax-radius);padding:14px;margin-bottom:16px}
.disc-search-form{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.disc-input-wrap{flex:1;min-width:240px;min-height:42px;display:flex;align-items:center;gap:10px;background:var(--vx-bg-card);border:1px solid var(--vx-border-strong);border-radius:var(--ax-radius);padding:0 12px;transition:border-color var(--ax-transition),box-shadow var(--ax-transition)}
.disc-input-wrap:focus-within{border-color:var(--vx-primary);box-shadow:0 0 0 3px var(--vx-primary-soft)}
.disc-search-input{flex:1;min-width:0;background:transparent;border:0;color:var(--vx-text);padding:10px 0;font-size:14px;outline:0;font-family:inherit}
.disc-search-input::placeholder{color:var(--vx-text-muted)}
.disc-toggle-wrap{display:flex;align-items:center;padding:0 4px}
.disc-toggle-label{display:flex;align-items:center;gap:7px;color:var(--vx-text-dim);font-size:12px;font-weight:700;cursor:pointer;user-select:none}
.disc-toggle-label:hover{color:var(--vx-text)}
.disc-toggle-label input{width:15px;height:15px;cursor:pointer}
.disc-scan-btn{min-height:42px;min-width:132px;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--vx-primary);color:var(--vx-white);border:1px solid var(--vx-primary);border-radius:var(--ax-radius);padding:9px 14px;font-size:13px;font-weight:800;line-height:1;cursor:pointer;white-space:nowrap;transition:background var(--ax-transition),border-color var(--ax-transition)}
.disc-scan-btn:hover:not(:disabled){background:var(--vx-primary-hover);border-color:var(--vx-primary-hover)}
.disc-scan-btn:disabled{opacity:.7;cursor:not-allowed}
.disc-btn-loading{display:inline-flex;align-items:center;gap:8px}

.disc-spinner{width:14px;height:14px;display:inline-block;vertical-align:middle;border:2px solid rgba(255,255,255,.45);border-top-color:var(--vx-white);border-radius:999px;animation:disc-spin .7s linear infinite}
@keyframes disc-spin{to{transform:rotate(360deg)}}

.disc-progress-wrap{margin-top:12px}
.disc-progress-bar{height:8px;background:var(--vx-bg-darker);border-radius:999px;overflow:hidden}
.disc-progress-fill{height:100%;background:var(--vx-primary);border-radius:999px;transition:width .65s ease;position:relative}
.disc-progress-bar.is-indeterminate .disc-progress-fill{width:18% !important;animation:disc-loading 1.25s ease-in-out infinite}
@keyframes disc-loading{0%{transform:translateX(-120%)}100%{transform:translateX(560%)}}
.disc-progress-info{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:8px}
.disc-progress-pct{color:var(--vx-primary-hover);font-family:"JetBrains Mono",Consolas,"Courier New",monospace;font-size:12px;font-weight:800}
.disc-progress-msg{max-width:76%;color:var(--vx-text-dim);font-size:12px;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.disc-alert{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:11px 13px;border-radius:var(--ax-radius);font-size:13px}
.disc-alert-error{background:var(--sev-critical-soft);color:var(--sev-critical-text);border:1px solid rgba(217,45,32,.18)}
.disc-alert-success{background:var(--sev-low-soft);color:var(--sev-low-text);border:1px solid rgba(22,163,74,.18)}
.disc-alert-close{margin-left:auto;background:transparent;border:0;color:inherit;cursor:pointer;font-size:12px;opacity:.65}
.disc-alert-close:hover{opacity:1}

.disc-domain-card{background:var(--vx-bg-card);border:1px solid var(--vx-border);border-radius:var(--ax-radius);margin-bottom:10px;overflow:hidden;transition:border-color var(--ax-transition)}
.disc-domain-card:hover{border-color:var(--vx-border-strong)}
.disc-domain-header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;transition:background var(--ax-transition)}
.disc-domain-header:hover{background:var(--vx-bg-subtle)}
.disc-domain-left{flex:1;min-width:0;display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.disc-domain-icon{width:30px;height:30px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:var(--ax-radius);background:var(--vx-primary-soft);color:var(--vx-primary-hover);font-size:14px}
.disc-domain-name{color:var(--vx-text);font-size:14px;font-weight:800;word-break:break-all}
.disc-count-badge{display:inline-flex;align-items:center;min-height:22px;padding:3px 8px;border-radius:999px;background:var(--vx-bg-darker);color:var(--vx-text-dim);font-size:10px;font-weight:800;text-transform:uppercase;white-space:nowrap}
.disc-domain-actions{display:flex;align-items:center;gap:7px;flex-shrink:0}
.disc-delete-btn{width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:7px;background:transparent;color:var(--vx-text-muted);cursor:pointer;transition:background var(--ax-transition),color var(--ax-transition),border-color var(--ax-transition)}
.disc-delete-btn:hover{background:var(--sev-critical-soft);border-color:rgba(217,45,32,.14);color:var(--sev-critical-text)}

.disc-domain-body{border-top:1px solid var(--vx-border);animation:disc-expand .18s ease}
@keyframes disc-expand{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.disc-host-block{border-top:1px solid var(--vx-border)}
.disc-host-block:first-child{border-top:0}
.disc-host-header{padding:10px 14px 6px 46px}
.disc-host-left{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.disc-host-name{color:var(--vx-text);font-size:13px;font-weight:750;word-break:break-all}
.disc-host-ip{padding:2px 7px;border-radius:6px;background:var(--vx-bg-darker);color:var(--vx-text-dim);font-family:"JetBrains Mono",Consolas,"Courier New",monospace;font-size:11px}
.disc-category-section{border-top:1px solid var(--vx-border)}
.disc-category-section:first-child{border-top:0}
.disc-category-header{display:flex;align-items:center;gap:8px;padding:6px 14px 6px 46px;background:var(--vx-bg-subtle);cursor:pointer;transition:background var(--ax-transition);font-size:11px;font-weight:800;color:var(--vx-text-dim);user-select:none}
.disc-category-header:hover{background:var(--vx-bg-darker);color:var(--vx-text)}
.disc-host-info-panel{margin:6px 14px 8px 46px;background:var(--vx-bg-subtle);border:1px solid var(--vx-border);border-radius:var(--ax-radius);padding:12px}
.disc-info-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:9px 18px}
.disc-info-item{display:flex;flex-direction:column;gap:2px;min-width:0;overflow:hidden}
.disc-info-label{color:var(--vx-text-muted);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0}
.disc-info-value{color:var(--vx-text);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.disc-info-value.mono{font-family:"JetBrains Mono",Consolas,"Courier New",monospace}
.disc-info-value[style*="flex"]{white-space:normal;overflow:visible}
.disc-ext-link{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border:1px solid var(--vx-border);border-radius:6px;background:var(--vx-bg-card);color:var(--vx-text-dim);font-size:10px;font-weight:800;text-decoration:none}
.disc-ext-link:hover{background:var(--vx-bg-darker);color:var(--vx-text)}

.disc-badge{display:inline-flex;align-items:center;gap:4px;min-height:20px;padding:2px 7px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:0;text-transform:uppercase;white-space:nowrap}
.disc-badge-cdn{background:var(--sev-medium-soft);color:var(--sev-medium-text);border:1px solid rgba(212,154,0,.22)}
.disc-badge-web{background:var(--sev-low-soft);color:var(--sev-low-text);border:1px solid rgba(22,163,74,.16)}
.disc-badge-tcp{background:var(--vx-bg-darker);color:var(--vx-text-dim);border:1px solid var(--vx-border)}
.disc-badge-country{background:var(--vx-bg-darker);color:var(--vx-text-dim);border:1px solid var(--vx-border);font-size:11px}

.disc-port-row{position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 14px 8px 68px;transition:background var(--ax-transition)}
.disc-port-row:hover{background:var(--vx-bg-subtle)}
.disc-port-left{flex:1;min-width:0;display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.disc-port-line{position:absolute;left:52px;top:0;width:1px;height:100%;background:var(--vx-border-strong)}
.disc-port-badge-lg{display:inline-flex;align-items:center;overflow:hidden;border:1px solid var(--vx-border-strong);border-radius:7px;font-size:11px;line-height:1;flex-shrink:0;background:var(--vx-bg-card)}
.disc-pnum{min-width:42px;padding:6px 8px;background:var(--vx-primary-soft);color:var(--vx-primary-hover);font-weight:900;text-align:center}
.disc-psvc{padding:6px 8px;color:var(--vx-text-dim);font-weight:800;text-transform:uppercase}
.disc-port-url{min-width:0;color:var(--vx-text-dim);font-family:"JetBrains Mono",Consolas,"Courier New",monospace;font-size:11px;word-break:break-all}
.disc-svc-detail{color:var(--vx-text-muted);font-size:10px}
.disc-port-right{display:flex;align-items:center;gap:6px;flex-shrink:0}
.disc-add-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:7px;background:var(--vx-bg-card);color:var(--vx-primary-hover);border:1px solid var(--vx-primary-border);font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;transition:background var(--ax-transition),color var(--ax-transition)}
.disc-add-btn:hover{background:var(--vx-primary);color:var(--vx-white)}
.disc-delete-sm{width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:0;border-radius:7px;background:transparent;color:var(--vx-text-muted);cursor:pointer;opacity:0;transition:opacity var(--ax-transition),background var(--ax-transition),color var(--ax-transition)}
.disc-port-row:hover .disc-delete-sm{opacity:1}
.disc-delete-sm:hover{background:var(--sev-critical-soft);color:var(--sev-critical-text)}
.disc-promoted-tag{display:inline-flex;align-items:center;gap:4px;color:var(--sev-low-text);font-size:11px;font-weight:800}

.disc-empty{text-align:center;padding:58px 18px;background:var(--vx-bg-card);border:1px solid var(--vx-border);border-radius:var(--ax-radius)}
.disc-empty-icon{margin-bottom:10px;color:var(--vx-text-muted);font-size:42px;opacity:.45}
.disc-empty-title{margin:0 0 5px;color:var(--vx-text);font-size:15px;font-weight:800}
.disc-empty-sub{margin:0;color:var(--vx-text-dim);font-size:12px}

.disc-modal-overlay{position:fixed;inset:0;z-index:1200;display:flex;align-items:center;justify-content:center;padding:16px;background:var(--vx-modal-overlay);backdrop-filter:blur(6px)}
.disc-modal{width:480px;max-width:100%;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;background:var(--vx-bg-card);border:1px solid var(--vx-border);border-radius:10px;box-shadow:var(--vx-modal-shadow);animation:disc-modal-in .18s ease}
@keyframes disc-modal-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.disc-modal-lg{width:620px}
.disc-modal-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid var(--vx-border)}
.disc-modal-header h3{display:flex;align-items:center;gap:8px;margin:0;color:var(--vx-text);font-size:15px;font-weight:800}
.disc-modal-close{width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:0;border-radius:7px;background:transparent;color:var(--vx-text-muted);cursor:pointer}
.disc-modal-close:hover{background:var(--vx-bg-darker);color:var(--vx-text)}
.disc-modal-body{flex:1;overflow:auto;padding:18px}
.disc-modal-footer{display:flex;align-items:center;justify-content:flex-end;gap:9px;flex-wrap:wrap;padding:14px 18px;border-top:1px solid var(--vx-border)}
.disc-modal-label{display:block;margin-bottom:6px;color:var(--vx-text-dim);font-size:11px;font-weight:800;text-transform:uppercase}
.disc-modal-url{padding:10px 12px;border:1px solid var(--vx-border);border-radius:var(--ax-radius);background:var(--vx-bg-subtle);color:var(--vx-primary-hover);font-family:"JetBrains Mono",Consolas,"Courier New",monospace;font-size:12px;word-break:break-all}
.disc-modal-input{width:100%;min-height:38px;padding:9px 12px;border:1px solid var(--vx-border-strong);border-radius:var(--ax-radius);background:var(--vx-bg-card);color:var(--vx-text);font-family:inherit;font-size:13px;outline:0}
.disc-modal-input:focus{border-color:var(--vx-primary);box-shadow:0 0 0 3px var(--vx-primary-soft)}
.disc-modal-input::placeholder{color:var(--vx-text-muted)}
.disc-modal-cdn-warn{display:flex;align-items:flex-start;gap:8px;margin-bottom:14px;padding:10px 12px;border-radius:var(--ax-radius);background:var(--sev-medium-soft);border:1px solid rgba(212,154,0,.2);color:var(--sev-medium-text);font-size:12px}
.disc-modal-cancel-btn,.disc-confirm-btn,.disc-delete-confirm-btn{min-height:34px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 13px;border-radius:var(--ax-radius);font-size:12px;font-weight:800;cursor:pointer}
.disc-modal-cancel-btn{background:var(--vx-bg-card);border:1px solid var(--vx-border-strong);color:var(--vx-text)}
.disc-modal-cancel-btn:hover{background:var(--vx-bg-darker)}
.disc-confirm-btn{background:var(--vx-primary);border:1px solid var(--vx-primary);color:var(--vx-white)}
.disc-confirm-btn:hover{background:var(--vx-primary-hover);border-color:var(--vx-primary-hover)}
.disc-delete-confirm-btn{background:var(--sev-critical);border:1px solid var(--sev-critical);color:var(--vx-white)}
.disc-delete-confirm-btn:hover{background:var(--sev-critical-hover);border-color:var(--sev-critical-hover)}

.disc-subfinder-list{max-height:400px;overflow-y:auto;border:1px solid var(--vx-border);border-radius:var(--ax-radius);background:var(--vx-bg-card)}
.disc-sub-item{display:flex;align-items:center;gap:10px;padding:9px 12px;color:var(--vx-text);border-bottom:1px solid var(--vx-border);font-size:13px;cursor:pointer;transition:background var(--ax-transition)}
.disc-sub-item:last-child{border-bottom:0}
.disc-sub-item:hover{background:var(--vx-bg-subtle)}
.disc-sub-item input{width:15px;height:15px;flex-shrink:0;cursor:pointer}
.disc-sub-item span{font-family:"JetBrains Mono",Consolas,"Courier New",monospace;font-size:12px;word-break:break-all}
.disc-sub-main{background:var(--vx-primary-soft)}

@media(max-width:900px){
    .disc-search-form{align-items:stretch;flex-direction:column}
    .disc-input-wrap{min-width:0}
    .disc-toggle-wrap{padding:3px 0}
    .disc-scan-btn{width:100%}
    .disc-host-header{padding-left:14px}
    .disc-host-info-panel{margin-left:14px}
    .disc-port-row{padding-left:34px;flex-wrap:wrap}
    .disc-port-line{display:none}
    .disc-info-grid{grid-template-columns:1fr 1fr}
    .disc-terminal-window, .disc-status-bar { left: 0; }
}
@media(max-width:600px){
    .disc-search-bar{padding:12px}
    .disc-domain-header{align-items:flex-start}
    .disc-port-row{padding:8px 12px;align-items:flex-start;flex-direction:column}
    .disc-port-right{width:100%;justify-content:flex-end}
    .disc-delete-sm{opacity:1}
    .disc-info-grid{grid-template-columns:1fr}
    .disc-modal-header,.disc-modal-body,.disc-modal-footer{padding-left:14px;padding-right:14px}
}
/* Terminal Section (inline in content flow) */
.disc-terminal-section {
    margin-top: 24px;
}

.disc-term-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: var(--vx-bg-card);
    border: 1px solid var(--vx-border);
    border-radius: var(--ax-radius);
    font-size: 11px;
    font-weight: 700;
    color: var(--vx-text-dim);
}
.disc-term-bar-left {
    display: flex;
    align-items: center;
    gap: 10px;
}
.disc-status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--vx-text-muted); flex-shrink: 0; }
.disc-status-dot.active { background: var(--vx-primary); box-shadow: 0 0 8px var(--vx-primary); animation: disc-pulse 1.5s infinite; }
@keyframes disc-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

.disc-terminal-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 1px solid var(--vx-border);
    color: var(--vx-text-dim);
    cursor: pointer;
    padding: 5px 10px;
    border-radius: var(--ax-radius);
    font-size: 11px;
    font-weight: 700;
    font-family: inherit;
    transition: background var(--ax-transition), color var(--ax-transition), border-color var(--ax-transition);
}
.disc-terminal-toggle:hover { background: var(--vx-bg-subtle); color: var(--vx-text); border-color: var(--vx-border-strong); }
.disc-terminal-toggle.active { background: var(--vx-primary-soft); color: var(--vx-primary-hover); border-color: var(--vx-primary-border); }

.disc-term-window-inline {
    margin-top: 8px;
    background: #0d0f14;
    border: 1px solid var(--vx-border);
    border-radius: var(--ax-radius);
    overflow: hidden;
    animation: disc-expand .18s ease;
}

.disc-term-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: #1a1d23;
    border-bottom: 1px solid #2d333b;
    color: #8b949e;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.disc-term-body {
    max-height: 260px;
    overflow-y: auto;
    padding: 12px 16px;
    font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
    color: #e6edf3;
}
.disc-term-line { margin-bottom: 2px; white-space: pre-wrap; word-break: break-all; }
.disc-term-line .term-prompt { color: var(--vx-primary-hover); margin-right: 8px; user-select: none; }

.disc-term-body::-webkit-scrollbar { width: 8px; }
.disc-term-body::-webkit-scrollbar-track { background: #0d0f14; }
.disc-term-body::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
.disc-term-body::-webkit-scrollbar-thumb:hover { background: #484f58; }

.disc-scan-btn-cancel {
    background: var(--sev-critical) !important;
    border-color: var(--sev-critical) !important;
}
.disc-scan-btn-cancel:hover {
    background: var(--sev-critical-hover) !important;
    border-color: var(--sev-critical-hover) !important;
}
</style>
<?php /**PATH /app/resources/views/livewire/partials/discovery-styles.blade.php ENDPATH**/ ?>