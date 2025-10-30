/**
 * 中文（简体）语言资源。
 * 说明：仅覆盖当前页面与通用调试组件所需键，后续可逐步在各模块扩充。
 */
export default {
  routes: {
    home: "首页",
    login: "登录",
    error403: "403",
    error404: "404",
    error500: "500",
    error: {
      root: "异常页面"
    },
    esim: {
      root: "eSIM管理",
      activationCodes: "激活码",
      subscriptions: "订阅",
      subscriptionDetail: "订阅详情",
      invoices: "发票",
      invoiceDetail: "发票详情",
      analytics: "数据概览"
    }
  },
  common: {
    appName: "eSIM 管理平台",
    // 通用状态文案
    loading: "加载中...",
    buttons: {
      fetchDetail: "拉取详情",
      backList: "返回列表",
      backHome: "返回首页",
      login: "登录",
      startReconcile: "发起对账",
      submitApproval: "提交审批",
      sign: "签章",
      downloadPdf: "下载 PDF",
      previewPdf: "预览 PDF",
      language: "语言",
      logout: "退出系统",
      closeSettings: "关闭配置",
      clearCache: "清空缓存",
      confirm: "确定",
      cancel: "取消",
      add: "新增",
      edit: "修改",
      delete: "删除"
    },
    status: {
      enabled: "启用",
      disabled: "停用",
      enabledLong: "已启用",
      disabledLong: "已停用"
    },
    columns: {
      createTime: "创建时间",
      operation: "操作",
      number: "数量"
    },
    dropdown: {
      language: {
        zhCN: "中文（简体）",
        enUS: "English",
        zhTW: "中文（繁体）",
        jaJP: "日本語"
      }
    },
    inputs: {
      tenant: { placeholder: "请输入租户名" },
      username: { placeholder: "请输入账号" },
      password: { placeholder: "请输入密码" },
      subscriptionId: { placeholder: "请输入订阅ID" },
      invoiceId: { placeholder: "请输入发票ID" },
      reconcile: {
        period: { placeholder: "对账周期：例如 2025-10" },
        itemsJson: {
          placeholder:
            '对账项 JSON（例如 [ { "type": "usage", "operatorId": "op_cn_cmcc" } ]）'
        }
      },
      approve: {
        approvedBy: { placeholder: "审批人" },
        comment: { placeholder: "审批意见" }
      },
      sign: {
        signatureProvider: { placeholder: "签章服务商（例如 example-sign）" },
        sealId: { placeholder: "印章ID（例如 seal-123）" }
      }
    },
    sections: {
      responseInfo: "响应信息",
      operationPanel: "操作面板",
      operationResult: "操作结果",
      systemSettings: "系统配置"
    },
    tips: {
      pdfDownloadNote:
        "下载将使用浏览器的保存功能，文件名形如 invoice-发票ID.pdf。"
    },
    tooltips: {
      openSettings: "打开系统配置",
      backTop: "回到顶部",
      clickToFold: "点击折叠",
      clickToExpand: "点击展开",
      clearCacheAndBackToLogin: "清空缓存并返回登录页"
    },
    // 标签页操作相关文案
    tagActions: {
      reload: "重新加载",
      closeCurrent: "关闭当前标签页",
      closeLeft: "关闭左侧标签页",
      closeRight: "关闭右侧标签页",
      closeOthers: "关闭其他标签页",
      closeAll: "关闭全部标签页",
      contentFullscreen: "内容区全屏",
      exitContentFullscreen: "内容区退出全屏"
    }
  },
  /**
   * 错误页文案
   */
  error: {
    /** 403 禁止访问描述 */
    403: { desc: "抱歉，你无权访问该页面" },
    /** 404 页面不存在描述 */
    404: { desc: "抱歉，你访问的页面不存在" },
    /** 500 服务器错误描述 */
    500: { desc: "抱歉，服务器出错了" }
  },
  /**
   * 登录页文案
   */
  login: {
    rules: {
      tenantRequired: "请输入租户名",
      usernameRequired: "请输入账号",
      passwordRequired: "请输入密码",
      passwordPattern: "密码格式应为8-18位数字、字母、符号的任意两种组合"
    },
    messages: {
      success: "登录成功",
      fail: "登录失败"
    }
  },
  debug: {
    requestAuthorization: "请求 Authorization",
    requestCorrelationId: "请求 X-Correlation-ID",
    responseCorrelationId: "X-Correlation-ID",
    responseBody: "响应体",
    error: "错误",
    none: "(无)",
    notCaptured: "(未注入或未捕获)",
    notReturned: "(未返回或未捕获)",
    emptyOrUndefined: "(空或未定义)",
    serializationFailed: "序列化失败: {message}"
  },
  views: {
    /**
     * 欢迎页
     */
    welcome: {
      /** 页面主标题 */
      title: "Max-Ts（国际化演示）",
      /** 介绍链接按钮文案 */
      linkText: "点我查看介绍",
      /** 测试契约调用按钮文案 */
      testButton: "测试契约调用（GET /api/operators）"
    },
    dict: {
      index: {
        title: "字典管理（左侧字典树可通过右键单击进行修改和删除）",
        buttons: {
          addDetail: "新增字典详情"
        },
        popconfirm: {
          deleteLabel: "是否确定删除字典标签为{label}的这条数据"
        },
        confirmTitle: "系统提示",
        switchConfirmPrefix: "确定要",
        switchConfirmSuffix: "字典标签吗?",
        dialog: {
          addDetailTitle: "新增字典详情",
          editDetailTitle: "修改字典详情",
          addDictTitle: "新增字典",
          editDictTitle: "修改字典"
        }
      },
      form: {
        label: "字典标签",
        value: "字典值",
        color: "标签颜色",
        sort: "排序",
        status: "状态",
        remark: "备注",
        placeholders: {
          label: "请输入字典标签",
          value: "请输入字典值",
          color: "请输入或选择标签颜色",
          sort: "请输入排序",
          remark: "请输入备注信息"
        }
      },
      dictForm: {
        name: "名称",
        code: "编码",
        remark: "描述"
      },
      rules: {
        labelRequired: "字典标签为必填项",
        valueRequired: "字典值为必填项",
        nameRequired: "名称为必填项",
        codeRequired: "编码为必填项"
      },
      messages: {
        statusUpdated: "已成功修改状态",
        deleted: "您删除了字典标签为{label}的这条数据",
        created: "您新增了字典标签为{label}的这条数据",
        updated: "您修改了字典标签为{label}的这条数据",
        dictDeleted: "已成功删除字典：{name}"
      },
      dialog: {
        addDetailTitle: "新增字典详情",
        editDetailTitle: "修改字典详情",
        addDictTitle: "新增字典",
        editDictTitle: "修改字典"
      },
      tree: {
        searchPlaceholder: "请输入字典名称",
        addDictButton: "新增字典",
        deleteConfirmPrefix: "确定要删除 ",
        deleteConfirmSuffix: " 字典吗?"
      }
    },
    tenant: {
      package: {
        index: {
          title: "租户套餐（仅演示，操作后不生效）",
          confirmTitle: "系统提示",
          switchConfirmHtml:
            "确认要<strong>{action}</strong><strong style='color:var(--el-color-primary)'>{name}</strong>吗?",
          buttons: {
            addPackage: "新增套餐",
            perms: "权限",
            search: "搜索",
            reset: "重置",
            confirm: "确定",
            cancel: "取消"
          },
          switchTexts: {
            active: "已启用",
            inactive: "已停用"
          },
          switchActions: {
            enable: "启用",
            disable: "停用"
          },
          searchForm: {
            nameLabel: "套餐名称：",
            namePlaceholder: "请输入套餐名称",
            statusLabel: "状态：",
            statusPlaceholder: "请选择状态"
          },
          popconfirm: {
            delete: "是否确认删除套餐名称为{name}的这条数据"
          },
          sidePanel: {
            title: "菜单权限",
            tooltips: {
              close: "关闭",
              saveMenu: "保存菜单权限"
            },
            searchPlaceholder: "请输入菜单进行搜索",
            checkboxes: {
              expandFold: "展开/折叠",
              selectAll: "全选/全不选",
              parentChildLinkage: "父子联动"
            }
          },
          columns: {
            id: "套餐编号",
            name: "套餐名称",
            status: "状态",
            remark: "备注",
            operation: "操作"
          },
          dialog: {
            addPackageTitle: "新增套餐",
            editPackageTitle: "修改套餐"
          }
        },
        form: {
          name: "套餐名称",
          remark: "备注",
          placeholders: {
            name: "请输入套餐名称",
            remark: "请输入备注信息"
          }
        },
        rules: {
          nameRequired: "套餐名称为必填项"
        },
        messages: {
          statusUpdated: "已{action}{name}",
          deleted: "您删除了套餐名称为{name}的这条数据",
          created: "您新增了套餐名称为{name}的这条数据",
          updated: "您修改了套餐名称为{name}的这条数据",
          menuUpdated: "套餐名称为{name}的菜单权限修改成功"
        }
      }
    },
    permission: {
      perms: {
        currentCodes: "当前拥有的code列表：",
        allPermsNotice: "*:*:* 代表拥有全部按钮级别权限",
        componentCheckTitle: "组件方式判断权限",
        functionCheckTitle: "函数方式判断权限",
        directiveCheckTitle: "指令方式判断权限（该方式不能动态修改权限）",
        visibleWhen: "拥有code：{codes} 权限可见"
      }
    },
    subscriptions: {
      index: {
        title: "订阅 - 列表（GET /api/subscriptions）",
        buttons: {
          fetchList: "拉取列表",
          viewDetail: "查看详情"
        }
      },
      title: "订阅 - 详情（GET /api/subscriptions/:id）"
    },
    invoices: {
      title: "发票 - 详情（GET /api/billing/invoices/:id）",
      cards: {
        reconcile: "对账",
        approve: "审批",
        sign: "签章",
        pdf: "PDF 下载"
      },
      messages: {
        fillInvoiceIdFirst: "请先填写发票ID",
        fillReconcilePeriodFirst: "请先填写对账周期（例如 2025-10）",
        itemsMustBeArray: "对账项必须是数组",
        itemsJsonParseFailed: "对账项 JSON 解析失败：{message}",
        reconcileSuccess: "对账成功",
        approveSubmitted: "审批已提交",
        signCompleted: "签章完成",
        pdfDownloadStarted: "PDF 下载已开始",
        pdfPreviewOpened: "已在新标签页打开 PDF 预览"
      }
    },
    analytics: {
      overview: {
        title: "数据概览（聚合现有接口：激活码/订阅/发票）",
        cards: {
          activationCodes: "激活码",
          subscriptions: "订阅",
          invoices: "发票",
          unused: "未使用",
          used: "已使用",
          expired: "已过期",
          active: "启用",
          inactive: "停用",
          cancelled: "已取消"
        },
        chart: {
          monthlyNewSubscriptions: "每月新增订阅（按 createdAt 聚合）",
          operatorsTop: "运营商订阅数量排行（Top5）",
          noData: "暂无数据"
        },
        buttons: {
          refresh: "刷新数据",
          exportMonthlyCsv: "导出新增订阅 CSV",
          exportOperatorsCsv: "导出运营商 Top5 CSV"
        },
        filters: {
          operator: "运营商",
          status: "状态",
          codeStatus: "激活码状态",
          timeRange: "时间范围",
          groupBy: "分组维度",
          allOperators: "全部运营商",
          allStatus: "全部状态",
          cardsScope: "卡片统计范围",
          scope: {
            overall: "总览",
            filtered: "按筛选"
          },
          quick: {
            last7Days: "近7天",
            last30Days: "近30天",
            last90Days: "近90天",
            custom: "自定义"
          },
          group: {
            day: "按日",
            week: "按周",
            month: "按月"
          },
          actions: {
            apply: "应用筛选",
            reset: "重置"
          }
        }
      }
    }
  }
};
