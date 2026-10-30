// Kök düzende (app/layout.tsx) sayfa yüklenirken çalışan betik. Tarayıcının
// "uygulamayı yükle" isteği React hazır olmadan gelebildiği için onu hemen yakalayıp
// saklar; components/pwa/pwa.tsx buradan okur.
export const INSTALL_PROMPT_SCRIPT = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__hvInstallPrompt=e;window.dispatchEvent(new Event("hv:installable"))});window.addEventListener("appinstalled",function(){window.__hvInstallPrompt=null;window.__hvInstalled=true;window.dispatchEvent(new Event("hv:installed"))});`;
