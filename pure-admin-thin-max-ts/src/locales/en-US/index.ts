/**
 * English (US) language resources.
 * Notes: Only keys needed by current pages/components are provided; extend per module later.
 */
export default {
  routes: {
    home: "Home",
    login: "Login",
    error403: "403",
    error404: "404",
    error500: "500",
    error: {
      root: "Error Pages"
    },
    esim: {
      root: "eSIM Management",
      activationCodes: "Activation Codes",
      subscriptions: "Subscriptions",
      subscriptionDetail: "Subscription Detail",
      invoices: "Invoices",
      invoiceDetail: "Invoice Detail"
    }
  },
  common: {
    appName: "eSIM Management",
    // Generic status text
    loading: "Loading...",
    buttons: {
      fetchDetail: "Fetch Detail",
      backList: "Back to List",
      backHome: "Back to Home",
      login: "Login",
      startReconcile: "Start Reconcile",
      submitApproval: "Submit Approval",
      sign: "Sign",
      downloadPdf: "Download PDF",
      language: "Language",
      logout: "Logout",
      closeSettings: "Close Settings",
      clearCache: "Clear Cache",
      confirm: "Confirm",
      cancel: "Cancel",
      add: "Add",
      edit: "Edit",
      delete: "Delete"
    },
    status: {
      enabled: "Enabled",
      disabled: "Disabled",
      enabledLong: "Enabled",
      disabledLong: "Disabled"
    },
    columns: {
      createTime: "Created At",
      operation: "Actions"
    },
    dropdown: {
      language: {
        zhCN: "Chinese (Simplified)",
        enUS: "English",
        zhTW: "Chinese (Traditional)",
        jaJP: "Japanese"
      }
    },
    inputs: {
      tenant: { placeholder: "Please enter tenant name" },
      username: { placeholder: "Please enter username" },
      password: { placeholder: "Please enter password" },
      subscriptionId: { placeholder: "Enter Subscription ID" },
      invoiceId: { placeholder: "Enter Invoice ID" },
      reconcile: {
        period: { placeholder: "Reconcile period: e.g., 2025-10" },
        itemsJson: {
          placeholder:
            'Reconcile items JSON (e.g., [ { "type": "usage", "operatorId": "op_cn_cmcc" } ])'
        }
      },
      approve: {
        approvedBy: { placeholder: "Approver" },
        comment: { placeholder: "Approval comment" }
      },
      sign: {
        signatureProvider: {
          placeholder: "Signature provider (e.g., example-sign)"
        },
        sealId: { placeholder: "Seal ID (e.g., seal-123)" }
      }
    },
    sections: {
      responseInfo: "Response Info",
      operationPanel: "Operations",
      operationResult: "Operation Result",
      systemSettings: "System Settings"
    },
    tips: {
      pdfDownloadNote:
        "The browser's save will be used. Filename like invoice-<ID>.pdf."
    },
    tooltips: {
      openSettings: "Open Settings",
      backTop: "Back to top",
      clickToFold: "Click to collapse",
      clickToExpand: "Click to expand",
      clearCacheAndBackToLogin: "Clear cache and return to login"
    },
    // Tag view actions
    tagActions: {
      reload: "Reload",
      closeCurrent: "Close current tab",
      closeLeft: "Close left tabs",
      closeRight: "Close right tabs",
      closeOthers: "Close other tabs",
      closeAll: "Close all tabs",
      contentFullscreen: "Content fullscreen",
      exitContentFullscreen: "Exit content fullscreen"
    }
  },
  /**
   * Error pages texts
   */
  error: {
    /** 403 Forbidden description */
    403: { desc: "Sorry, you are not authorized to access this page." },
    /** 404 Not Found description */
    404: { desc: "Sorry, the page you visited does not exist." },
    /** 500 Server error description */
    500: { desc: "Sorry, the server encountered an error." }
  },
  /**
   * Login page texts
   */
  login: {
    rules: {
      tenantRequired: "Please enter tenant name",
      usernameRequired: "Please enter username",
      passwordRequired: "Please enter password",
      passwordPattern:
        "Password must be 8-18 characters and include at least two of numbers, letters, or symbols."
    },
    messages: {
      success: "Login succeeded",
      fail: "Login failed"
    }
  },
  debug: {
    requestAuthorization: "Request Authorization",
    requestCorrelationId: "Request X-Correlation-ID",
    responseCorrelationId: "X-Correlation-ID",
    responseBody: "Response Body",
    error: "Error",
    none: "(none)",
    notCaptured: "(not injected or not captured)",
    notReturned: "(not returned or not captured)",
    emptyOrUndefined: "(empty or undefined)",
    serializationFailed: "Serialization failed: {message}"
  },
  views: {
    /**
     * Welcome page
     */
    welcome: {
      /** Main title */
      title: "Max-Ts (i18n demo)",
      /** Link to introduction */
      linkText: "View introduction",
      /** Test contract call button */
      testButton: "Test contract call (GET /api/operators)"
    },
    dict: {
      index: {
        title:
          "Dictionary Management (Right-click on the left tree to edit or delete)",
        buttons: {
          addDetail: "Add Dictionary Detail"
        },
        popconfirm: {
          deleteLabel:
            "Are you sure you want to delete the item with label {label}?"
        },
        confirmTitle: "System Prompt",
        switchConfirmPrefix: "Are you sure to ",
        switchConfirmSuffix: " the dictionary label?",
        dialog: {
          addDetailTitle: "Add Dictionary Detail",
          editDetailTitle: "Edit Dictionary Detail",
          addDictTitle: "Add Dictionary",
          editDictTitle: "Edit Dictionary"
        }
      },
      form: {
        label: "Dictionary Label",
        value: "Dictionary Value",
        color: "Tag Color",
        sort: "Sort Order",
        status: "Status",
        remark: "Remark",
        placeholders: {
          label: "Please enter dictionary label",
          value: "Please enter dictionary value",
          color: "Please enter or select tag color",
          sort: "Please enter sort order",
          remark: "Please enter remark"
        }
      },
      dictForm: {
        name: "Name",
        code: "Code",
        remark: "Description"
      },
      rules: {
        labelRequired: "Label is required",
        valueRequired: "Value is required",
        nameRequired: "Name is required",
        codeRequired: "Code is required"
      },
      messages: {
        statusUpdated: "Status updated successfully",
        deleted: "You deleted the item with label {label}",
        created: "You added the item with label {label}",
        updated: "You edited the item with label {label}",
        dictDeleted: "Successfully deleted dictionary: {name}"
      },
      dialog: {
        addDetailTitle: "Add Dictionary Detail",
        editDetailTitle: "Edit Dictionary Detail",
        addDictTitle: "Add Dictionary",
        editDictTitle: "Edit Dictionary"
      },
      tree: {
        searchPlaceholder: "Please enter dictionary name",
        addDictButton: "Add Dictionary",
        deleteConfirmPrefix: "Are you sure to delete ",
        deleteConfirmSuffix: " dictionary?"
      }
    },
    tenant: {
      package: {
        index: {
          title: "Tenant Packages (Demo only, operations have no effect)",
          confirmTitle: "System Message",
          switchConfirmHtml:
            "Are you sure to <strong>{action}</strong> <strong style='color:var(--el-color-primary)'>{name}</strong>?",
          buttons: {
            addPackage: "Add Package",
            perms: "Permissions",
            search: "Search",
            reset: "Reset"
          },
          switchTexts: {
            active: "Enabled",
            inactive: "Disabled"
          },
          switchActions: {
            enable: "Enable",
            disable: "Disable"
          },
          searchForm: {
            nameLabel: "Package Name:",
            namePlaceholder: "Please enter package name",
            statusLabel: "Status:",
            statusPlaceholder: "Please select status"
          },
          popconfirm: {
            delete: "Are you sure to delete the item with package name {name}?"
          },
          sidePanel: {
            title: "Menu Permissions",
            tooltips: {
              close: "Close",
              saveMenu: "Save Menu Permissions"
            },
            searchPlaceholder: "Enter menu to search",
            checkboxes: {
              expandFold: "Expand/Collapse",
              selectAll: "Select All/Unselect All",
              parentChildLinkage: "Parent-Child Linkage"
            }
          },
          columns: {
            id: "Package ID",
            name: "Package Name",
            status: "Status",
            remark: "Remark",
            operation: "Actions"
          },
          dialog: {
            addPackageTitle: "Add Package",
            editPackageTitle: "Edit Package"
          }
        },
        form: {
          name: "Package Name",
          remark: "Remark",
          placeholders: {
            name: "Please enter package name",
            remark: "Please enter remark"
          }
        },
        rules: {
          nameRequired: "Package name is required"
        },
        messages: {
          statusUpdated: "Successfully {action} {name}",
          deleted: "You deleted the item with package name {name}",
          created: "You added the item with package name {name}",
          updated: "You updated the item with package name {name}",
          menuUpdated:
            "Menu permissions updated for package {name} successfully"
        }
      }
    },
    permission: {
      perms: {
        currentCodes: "Current code list: ",
        allPermsNotice:
          "*:*:* indicates all button-level permissions are granted",
        componentCheckTitle: "Check permissions by component",
        functionCheckTitle: "Check permissions by function",
        directiveCheckTitle:
          "Check permissions by directive (this method cannot update permissions dynamically)",
        visibleWhen: "Visible if code(s): {codes}"
      }
    },
    subscriptions: {
      index: {
        title: "Subscription - List (GET /api/subscriptions)",
        buttons: {
          fetchList: "Fetch List",
          viewDetail: "View Detail"
        }
      },
      title: "Subscription - Detail (GET /api/subscriptions/:id)"
    },
    invoices: {
      title: "Invoice - Detail (GET /api/billing/invoices/:id)",
      cards: {
        reconcile: "Reconcile",
        approve: "Approve",
        sign: "Sign",
        pdf: "PDF Download"
      },
      messages: {
        fillInvoiceIdFirst: "Please fill in the invoice ID first",
        fillReconcilePeriodFirst:
          "Please fill in reconcile period (e.g., 2025-10)",
        itemsMustBeArray: "Reconcile items must be an array",
        itemsJsonParseFailed: "Failed to parse reconcile items JSON: {message}",
        reconcileSuccess: "Reconcile succeeded",
        approveSubmitted: "Approval submitted",
        signCompleted: "Sign completed",
        pdfDownloadStarted: "PDF download started"
      }
    }
  }
};
