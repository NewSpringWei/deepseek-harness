; Deployment NSIS include. `nsis.include` points here instead of at upstream's
; scripts/installer.nsh so the installer's copy comes from strings.nsh beside this file.
;
; INSTALLER_STRINGS_FILE is declared `!define /ifndef` upstream, so defining it here wins
; and every other part of the installer (theme, pages, lifecycle, uninstall, the directory
; template) stays upstream's source. INSTALLER_BUILD_DIR is deliberately NOT overridden:
; this directory also receives the compiled window-frame.dll, so the brand plates are
; rasterized over upstream's outputs in place by build-highcom/installer/prepare-brand-assets.ps1
; instead of being relocated.
!define INSTALLER_STRINGS_FILE "${__FILEDIR__}\strings.nsh"
!include "${__FILEDIR__}\..\..\scripts\installer.nsh"
