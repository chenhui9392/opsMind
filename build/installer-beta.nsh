!define INSTALL_PATH "D:\dolphinAppBeta"

!ifdef BUILD_UNINSTALLER
  Function un.AddAppData
    RMDir /r "$APPDATA\海豚Beta"
  FunctionEnd

  !define MUI_FINISHPAGE_SHOWREADME
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "移除用户数据"
  !define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION un.AddAppData
!endif

!macro preInit
    SetRegView 64
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "${INSTALL_PATH}"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "${INSTALL_PATH}"

    SetRegView 32
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "${INSTALL_PATH}"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "${INSTALL_PATH}"
!macroend

; Beta 版卸载时清理注册表信息
!macro customUnInstall
    SetRegView 64
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\海豚Beta"
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\海豚Beta"
    SetRegView 32
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\海豚Beta"
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\海豚Beta"
!macroend
