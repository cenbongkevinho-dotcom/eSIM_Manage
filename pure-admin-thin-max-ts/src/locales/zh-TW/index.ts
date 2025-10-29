/**
 * 中文（繁體）語言資源。
 * 說明：目前僅覆蓋通用與部分頁面鍵，後續可逐步在各模塊擴充。
 */
export default {
  routes: {
    home: "首頁",
    login: "登入",
    error403: "403",
    error404: "404",
    error500: "500",
    error: {
      root: "異常頁面"
    },
    esim: {
      root: "eSIM 管理",
      activationCodes: "啟用碼",
      subscriptions: "訂閱",
      subscriptionDetail: "訂閱詳情",
      invoices: "發票",
      invoiceDetail: "發票詳情"
    }
  },
  common: {
    appName: "eSIM 管理平台",
    // 通用狀態文案
    loading: "加載中...",
    buttons: {
      fetchDetail: "拉取詳情",
      backList: "返回列表",
      backHome: "返回首頁",
      login: "登入",
      startReconcile: "發起對帳",
      submitApproval: "提交審批",
      sign: "簽章",
      downloadPdf: "下載 PDF",
      language: "語言",
      logout: "退出系統",
      closeSettings: "關閉配置",
      clearCache: "清空緩存",
      confirm: "確定",
      cancel: "取消",
      add: "新增",
      edit: "修改",
      delete: "刪除"
    },
    status: {
      enabled: "啟用",
      disabled: "停用",
      enabledLong: "已啟用",
      disabledLong: "已停用"
    },
    columns: {
      createTime: "建立時間",
      operation: "操作"
    },
    dropdown: {
      language: {
        zhCN: "中文（簡體）",
        enUS: "English",
        zhTW: "中文（繁體）",
        jaJP: "日本語"
      }
    },
    inputs: {
      tenant: { placeholder: "請輸入租戶名" },
      username: { placeholder: "請輸入帳號" },
      password: { placeholder: "請輸入密碼" },
      subscriptionId: { placeholder: "請輸入訂閱ID" },
      invoiceId: { placeholder: "請輸入發票ID" },
      reconcile: {
        period: { placeholder: "對帳週期：例如 2025-10" },
        itemsJson: {
          placeholder:
            '對帳項 JSON（例如 [ { "type": "usage", "operatorId": "op_cn_cmcc" } ]）'
        }
      },
      approve: {
        approvedBy: { placeholder: "審批人" },
        comment: { placeholder: "審批意見" }
      },
      sign: {
        signatureProvider: { placeholder: "簽章服務商（例如 example-sign）" },
        sealId: { placeholder: "印章ID（例如 seal-123）" }
      }
    },
    sections: {
      responseInfo: "響應資訊",
      operationPanel: "操作面板",
      operationResult: "操作結果",
      systemSettings: "系統配置"
    },
    tips: {
      pdfDownloadNote:
        "下載將使用瀏覽器的保存功能，檔名形如 invoice-發票ID.pdf。"
    },
    tooltips: {
      openSettings: "打開系統配置",
      backTop: "回到頂部",
      clickToFold: "點擊折疊",
      clickToExpand: "點擊展開",
      clearCacheAndBackToLogin: "清空緩存並返回登入頁"
    },
    // 標籤頁操作相關文案
    tagActions: {
      reload: "重新加載",
      closeCurrent: "關閉當前標籤頁",
      closeLeft: "關閉左側標籤頁",
      closeRight: "關閉右側標籤頁",
      closeOthers: "關閉其他標籤頁",
      closeAll: "關閉全部標籤頁",
      contentFullscreen: "內容區全螢幕",
      exitContentFullscreen: "內容區退出全螢幕"
    }
  },
  /**
   * 錯誤頁文案
   */
  error: {
    /** 403 禁止訪問描述 */
    403: { desc: "抱歉，你無權訪問該頁面" },
    /** 404 頁面不存在描述 */
    404: { desc: "抱歉，你訪問的頁面不存在" },
    /** 500 伺服器錯誤描述 */
    500: { desc: "抱歉，伺服器出錯了" }
  },
  /**
   * 登入頁文案
   */
  login: {
    rules: {
      tenantRequired: "請輸入租戶名",
      usernameRequired: "請輸入帳號",
      passwordRequired: "請輸入密碼",
      passwordPattern: "密碼格式應為 8-18 位數字、字母、符號的任意兩種組合"
    },
    messages: {
      success: "登入成功",
      fail: "登入失敗"
    }
  },
  debug: {
    requestAuthorization: "請求 Authorization",
    requestCorrelationId: "請求 X-Correlation-ID",
    responseCorrelationId: "X-Correlation-ID",
    responseBody: "響應體",
    error: "錯誤",
    none: "(無)",
    notCaptured: "(未注入或未捕獲)",
    notReturned: "(未返回或未捕獲)",
    emptyOrUndefined: "(空或未定義)",
    serializationFailed: "序列化失敗: {message}"
  },
  views: {
    /**
     * 歡迎頁
     */
    welcome: {
      /** 頁面主標題 */
      title: "Max-Ts（國際化演示）",
      /** 介紹連結按鈕文案 */
      linkText: "點我查看介紹",
      /** 測試契約調用按鈕文案 */
      testButton: "測試契約調用（GET /api/operators）"
    },
    dict: {
      index: {
        title: "字典管理（左側字典樹可透過右鍵單擊進行修改和刪除）",
        buttons: {
          addDetail: "新增字典詳情"
        },
        popconfirm: {
          deleteLabel: "是否確定刪除字典標籤為{label}的這條資料"
        },
        confirmTitle: "系統提示",
        switchConfirmPrefix: "確定要",
        switchConfirmSuffix: "字典標籤嗎?",
        dialog: {
          addDetailTitle: "新增字典詳情",
          editDetailTitle: "修改字典詳情",
          addDictTitle: "新增字典",
          editDictTitle: "修改字典"
        }
      },
      form: {
        label: "字典標籤",
        value: "字典值",
        color: "標籤顏色",
        sort: "排序",
        status: "狀態",
        remark: "備註",
        placeholders: {
          label: "請輸入字典標籤",
          value: "請輸入字典值",
          color: "請輸入或選擇標籤顏色",
          sort: "請輸入排序",
          remark: "請輸入備註信息"
        }
      },
      dictForm: {
        name: "名稱",
        code: "編碼",
        remark: "描述"
      },
      rules: {
        labelRequired: "字典標籤為必填項",
        valueRequired: "字典值為必填項",
        nameRequired: "名稱為必填項",
        codeRequired: "編碼為必填項"
      },
      messages: {
        statusUpdated: "已成功修改狀態",
        deleted: "您刪除了字典標籤為{label}的這條資料",
        created: "您新增了字典標籤為{label}的這條資料",
        updated: "您修改了字典標籤為{label}的這條資料",
        dictDeleted: "已成功刪除字典：{name}"
      },
      dialog: {
        addDetailTitle: "新增字典詳情",
        editDetailTitle: "修改字典詳情",
        addDictTitle: "新增字典",
        editDictTitle: "修改字典"
      },
      tree: {
        searchPlaceholder: "請輸入字典名稱",
        addDictButton: "新增字典",
        deleteConfirmPrefix: "確定要刪除 ",
        deleteConfirmSuffix: " 字典嗎?"
      }
    },
    tenant: {
      package: {
        index: {
          title: "租戶套餐（僅演示，操作後不生效）",
          confirmTitle: "系統提示",
          switchConfirmHtml:
            "確認要<strong>{action}</strong><strong style='color:var(--el-color-primary)'>{name}</strong>嗎？",
          buttons: {
            addPackage: "新增套餐",
            perms: "權限",
            search: "搜尋",
            reset: "重置",
            confirm: "確定",
            cancel: "取消"
          },
          switchTexts: {
            active: "已啟用",
            inactive: "已停用"
          },
          switchActions: {
            enable: "啟用",
            disable: "停用"
          },
          searchForm: {
            nameLabel: "套餐名稱：",
            namePlaceholder: "請輸入套餐名稱",
            statusLabel: "狀態：",
            statusPlaceholder: "請選擇狀態"
          },
          popconfirm: {
            delete: "是否確認刪除套餐名稱為{name}的這條數據"
          },
          sidePanel: {
            title: "選單權限",
            tooltips: {
              close: "關閉",
              saveMenu: "保存選單權限"
            },
            searchPlaceholder: "請輸入選單進行搜尋",
            checkboxes: {
              expandFold: "展開/折疊",
              selectAll: "全選/全不選",
              parentChildLinkage: "父子聯動"
            }
          },
          columns: {
            id: "套餐編號",
            name: "套餐名稱",
            status: "狀態",
            remark: "備註",
            operation: "操作"
          },
          dialog: {
            addPackageTitle: "新增套餐",
            editPackageTitle: "修改套餐"
          }
        },
        form: {
          name: "套餐名稱",
          remark: "備註",
          placeholders: {
            name: "請輸入套餐名稱",
            remark: "請輸入備註資訊"
          }
        },
        rules: {
          nameRequired: "套餐名稱為必填項"
        },
        messages: {
          statusUpdated: "已{action}{name}",
          deleted: "您刪除了套餐名稱為{name}的這條數據",
          created: "您新增了套餐名稱為{name}的這條數據",
          updated: "您修改了套餐名稱為{name}的這條數據",
          menuUpdated: "套餐名稱為{name}的選單權限修改成功"
        }
      }
    },
    permission: {
      perms: {
        currentCodes: "當前擁有的 code 列表：",
        allPermsNotice: "*:*:* 代表擁有全部按鈕級別權限",
        componentCheckTitle: "元件方式判斷權限",
        functionCheckTitle: "函式方式判斷權限",
        directiveCheckTitle: "指令方式判斷權限（該方式不能動態修改權限）",
        visibleWhen: "擁有 code：{codes} 權限可見"
      }
    },
    subscriptions: {
      index: {
        title: "訂閱 - 列表（GET /api/subscriptions）",
        buttons: {
          fetchList: "拉取列表",
          viewDetail: "查看詳情"
        }
      },
      title: "訂閱 - 詳情（GET /api/subscriptions/:id）"
    },
    invoices: {
      title: "發票 - 詳情（GET /api/billing/invoices/:id）",
      cards: {
        reconcile: "對帳",
        approve: "審批",
        sign: "簽章",
        pdf: "PDF 下載"
      },
      messages: {
        fillInvoiceIdFirst: "請先填寫發票ID",
        fillReconcilePeriodFirst: "請先填寫對帳週期（例如 2025-10）",
        itemsMustBeArray: "對帳項必須是數組",
        itemsJsonParseFailed: "對帳項 JSON 解析失敗：{message}",
        reconcileSuccess: "對帳成功",
        approveSubmitted: "審批已提交",
        signCompleted: "簽章完成",
        pdfDownloadStarted: "PDF 下載已開始"
      }
    }
  }
};
