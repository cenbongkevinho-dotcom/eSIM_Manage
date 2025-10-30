/**
 * 日本語（ja-JP）言語リソース。
 * 注記：現在は共通および一部ページのキーのみ。必要に応じて各モジュールで拡張してください。
 */
export default {
  routes: {
    home: "ホーム",
    login: "ログイン",
    error403: "403",
    error404: "404",
    error500: "500",
    error: {
      root: "エラーページ"
    },
    esim: {
      root: "eSIM 管理",
      activationCodes: "アクティベーションコード",
      subscriptions: "サブスクリプション",
      subscriptionDetail: "サブスクリプション詳細",
      invoices: "請求書",
      invoiceDetail: "請求書詳細",
      analytics: "アナリティクス概要"
    }
  },
  common: {
    appName: "eSIM 管理プラットフォーム",
    // 汎用ステータス文言
    loading: "読み込み中...",
    buttons: {
      fetchDetail: "詳細取得",
      backList: "一覧へ戻る",
      backHome: "ホームへ戻る",
      login: "ログイン",
      startReconcile: "照合開始",
      submitApproval: "承認送信",
      sign: "署名",
      downloadPdf: "PDFダウンロード",
      previewPdf: "PDFプレビュー",
      language: "言語",
      logout: "ログアウト",
      closeSettings: "設定を閉じる",
      clearCache: "キャッシュをクリア",
      confirm: "確認",
      cancel: "キャンセル",
      add: "追加",
      edit: "編集",
      delete: "削除"
    },
    status: {
      enabled: "有効",
      disabled: "無効",
      enabledLong: "有効",
      disabledLong: "無効"
    },
    columns: {
      createTime: "作成日時",
      operation: "操作",
      number: "件数"
    },
    dropdown: {
      language: {
        zhCN: "中国語（簡体）",
        enUS: "英語",
        zhTW: "中国語（繁体）",
        jaJP: "日本語"
      }
    },
    inputs: {
      tenant: { placeholder: "テナント名を入力してください" },
      username: { placeholder: "ユーザー名を入力してください" },
      password: { placeholder: "パスワードを入力してください" },
      subscriptionId: { placeholder: "サブスクリプションIDを入力してください" },
      invoiceId: { placeholder: "請求書IDを入力してください" },
      reconcile: {
        period: { placeholder: "照合期間：例 2025-10" },
        itemsJson: {
          placeholder:
            '照合項目JSON（例：[ { "type": "usage", "operatorId": "op_cn_cmcc" } ]）'
        }
      },
      approve: {
        approvedBy: { placeholder: "承認者" },
        comment: { placeholder: "承認コメント" }
      },
      sign: {
        signatureProvider: {
          placeholder: "署名プロバイダ（例：example-sign）"
        },
        sealId: { placeholder: "印章ID（例：seal-123）" }
      }
    },
    sections: {
      responseInfo: "レスポンス情報",
      operationPanel: "操作パネル",
      operationResult: "操作結果",
      systemSettings: "システム設定"
    },
    tips: {
      pdfDownloadNote:
        "ブラウザの保存機能を使用します。ファイル名は invoice-<ID>.pdf の形式です。"
    },
    tooltips: {
      openSettings: "設定を開く",
      backTop: "トップへ戻る",
      clickToFold: "折りたたむ",
      clickToExpand: "展開する",
      clearCacheAndBackToLogin: "キャッシュをクリアしてログインへ戻る"
    },
    // タグビュー操作文言
    tagActions: {
      reload: "再読み込み",
      closeCurrent: "現在のタブを閉じる",
      closeLeft: "左側のタブを閉じる",
      closeRight: "右側のタブを閉じる",
      closeOthers: "その他のタブを閉じる",
      closeAll: "すべてのタブを閉じる",
      contentFullscreen: "コンテンツ全画面",
      exitContentFullscreen: "コンテンツ全画面を終了"
    }
  },
  /**
   * エラーページ文言
   */
  error: {
    /** 403 禁止アクセス説明 */
    403: { desc: "申し訳ありません、このページへのアクセス権がありません。" },
    /** 404 ページが存在しない説明 */
    404: { desc: "申し訳ありません、アクセスしたページは存在しません。" },
    /** 500 サーバーエラー説明 */
    500: { desc: "申し訳ありません、サーバーでエラーが発生しました。" }
  },
  /**
   * ログインページ文言
   */
  login: {
    rules: {
      tenantRequired: "テナント名を入力してください",
      usernameRequired: "ユーザー名を入力してください",
      passwordRequired: "パスワードを入力してください",
      passwordPattern:
        "パスワードは8〜18文字で、数字・英字・記号のうち2種類以上を含めてください。"
    },
    messages: {
      success: "ログインに成功しました",
      fail: "ログインに失敗しました"
    }
  },
  debug: {
    requestAuthorization: "リクエスト Authorization",
    requestCorrelationId: "リクエスト X-Correlation-ID",
    responseCorrelationId: "X-Correlation-ID",
    responseBody: "レスポンスボディ",
    error: "エラー",
    none: "(なし)",
    notCaptured: "(未注入または未取得)",
    notReturned: "(未返却または未取得)",
    emptyOrUndefined: "(空または未定義)",
    serializationFailed: "シリアライゼーション失敗: {message}"
  },
  views: {
    /**
     * ようこそページ
     */
    welcome: {
      /** メインタイトル */
      title: "Max-Ts（国際化デモ）",
      /** 紹介を見るリンク文言 */
      linkText: "紹介を見る",
      /** 契約呼び出しテストボタン */
      testButton: "契約呼び出しをテスト（GET /api/operators）"
    },
    dict: {
      index: {
        title: "辞書管理（左側の辞書ツリーは右クリックで編集・削除できます）",
        buttons: {
          addDetail: "辞書詳細を追加"
        },
        popconfirm: {
          deleteLabel: "ラベル {label} の項目を削除してもよろしいですか？"
        },
        confirmTitle: "システムメッセージ",
        switchConfirmPrefix: "本当に",
        switchConfirmSuffix: "の辞書ラベルを変更しますか？",
        dialog: {
          addDetailTitle: "辞書詳細を追加",
          editDetailTitle: "辞書詳細を編集",
          addDictTitle: "辞書を追加",
          editDictTitle: "辞書を編集"
        }
      },
      form: {
        label: "辞書ラベル",
        value: "辞書値",
        color: "タグカラー",
        sort: "並び順",
        status: "ステータス",
        codeStatus: "アクティベーションコードのステータス",
        remark: "備考",
        placeholders: {
          label: "辞書ラベルを入力してください",
          value: "辞書値を入力してください",
          color: "タグカラーを入力または選択してください",
          sort: "並び順を入力してください",
          remark: "備考を入力してください"
        }
      },
      dictForm: {
        name: "名称",
        code: "コード",
        remark: "説明"
      },
      rules: {
        labelRequired: "辞書ラベルは必須項目です",
        valueRequired: "辞書値は必須項目です",
        nameRequired: "名称は必須項目です",
        codeRequired: "コードは必須項目です"
      },
      messages: {
        statusUpdated: "ステータスを更新しました",
        deleted: "ラベル {label} の項目を削除しました",
        created: "ラベル {label} の項目を追加しました",
        updated: "ラベル {label} の項目を編集しました",
        dictDeleted: "辞書「{name}」を削除しました"
      },
      dialog: {
        addDetailTitle: "辞書詳細を追加",
        editDetailTitle: "辞書詳細を編集",
        addDictTitle: "辞書を追加",
        editDictTitle: "辞書を編集"
      },
      tree: {
        searchPlaceholder: "辞書名を入力してください",
        addDictButton: "辞書を追加",
        deleteConfirmPrefix: "本当に ",
        deleteConfirmSuffix: " 辞書を削除しますか？"
      }
    },
    tenant: {
      package: {
        index: {
          title: "テナントパッケージ（デモのみ、操作は反映されません）",
          confirmTitle: "システムメッセージ",
          switchConfirmHtml:
            "本当に<strong>{action}</strong><strong style='color:var(--el-color-primary)'>{name}</strong>しますか？",
          buttons: {
            addPackage: "パッケージを追加",
            perms: "権限",
            search: "検索",
            reset: "リセット",
            confirm: "確認",
            cancel: "キャンセル"
          },
          switchTexts: {
            active: "有効",
            inactive: "無効"
          },
          switchActions: {
            enable: "有効化",
            disable: "無効化"
          },
          searchForm: {
            nameLabel: "パッケージ名：",
            namePlaceholder: "パッケージ名を入力してください",
            statusLabel: "ステータス：",
            statusPlaceholder: "ステータスを選択してください"
          },
          popconfirm: {
            delete: "パッケージ名が{name}のデータを削除しますか？"
          },
          sidePanel: {
            title: "メニュー権限",
            tooltips: {
              close: "閉じる",
              saveMenu: "メニュー権限を保存"
            },
            searchPlaceholder: "メニュー名で検索",
            checkboxes: {
              expandFold: "展開/折りたたみ",
              selectAll: "全選択/全解除",
              parentChildLinkage: "親子連動"
            }
          },
          columns: {
            id: "パッケージID",
            name: "パッケージ名",
            status: "ステータス",
            codeStatus: "アクティベーションコードのステータス",
            remark: "備考",
            operation: "操作"
          },
          dialog: {
            addPackageTitle: "パッケージを追加",
            editPackageTitle: "パッケージを編集"
          }
        },
        form: {
          name: "パッケージ名",
          remark: "備考",
          placeholders: {
            name: "パッケージ名を入力してください",
            remark: "備考を入力してください"
          }
        },
        rules: {
          nameRequired: "パッケージ名は必須です"
        },
        messages: {
          statusUpdated: "正常に{action}しました：{name}",
          deleted: "パッケージ名が{name}のデータを削除しました",
          created: "パッケージ名が{name}のデータを追加しました",
          updated: "パッケージ名が{name}のデータを更新しました",
          menuUpdated: "パッケージ『{name}』のメニュー権限を正常に更新しました"
        }
      }
    },
    permission: {
      perms: {
        currentCodes: "現在のコード一覧：",
        allPermsNotice: "*:*:* はすべてのボタン権限を持つことを表します",
        componentCheckTitle: "コンポーネントで権限判定",
        functionCheckTitle: "関数で権限判定",
        directiveCheckTitle:
          "ディレクティブで権限判定（この方法では動的変更は不可）",
        visibleWhen: "コード：{codes} の場合に表示"
      }
    },
    subscriptions: {
      index: {
        title: "サブスクリプション - 一覧（GET /api/subscriptions）",
        buttons: {
          fetchList: "一覧取得",
          viewDetail: "詳細を見る"
        }
      },
      title: "サブスクリプション - 詳細（GET /api/subscriptions/:id）"
    },
    invoices: {
      title: "請求書 - 詳細（GET /api/billing/invoices/:id）",
      cards: {
        reconcile: "照合",
        approve: "承認",
        sign: "署名",
        pdf: "PDFダウンロード"
      },
      messages: {
        fillInvoiceIdFirst: "まず請求書IDを入力してください",
        fillReconcilePeriodFirst:
          "まず照合期間（例：2025-10）を入力してください",
        itemsMustBeArray: "照合項目は配列である必要があります",
        itemsJsonParseFailed: "照合項目JSONの解析に失敗しました: {message}",
        reconcileSuccess: "照合に成功しました",
        approveSubmitted: "承認を送信しました",
        signCompleted: "署名が完了しました",
        pdfDownloadStarted: "PDFダウンロードを開始しました",
        pdfPreviewOpened: "PDFプレビューを新しいタブで開きました"
      }
    },
    analytics: {
      overview: {
        title:
          "分析概要（既存APIの集計：アクティベーションコード／サブスクリプション／請求書）",
        cards: {
          activationCodes: "アクティベーションコード",
          subscriptions: "サブスクリプション",
          invoices: "請求書",
          unused: "未使用",
          used: "使用済み",
          expired: "期限切れ",
          active: "有効",
          inactive: "無効",
          cancelled: "キャンセル済み"
        },
        chart: {
          monthlyNewSubscriptions:
            "月別新規サブスクリプション（createdAt で集計）",
          operatorsTop: "サブスクリプション数の上位オペレーター（Top 5）",
          noData: "データなし"
        },
        buttons: {
          refresh: "再読み込み",
          exportMonthlyCsv: "月別新規サブスクリプション CSV をエクスポート",
          exportOperatorsCsv: "オペレーター Top5 CSV をエクスポート"
        },
        filters: {
          operator: "オペレーター",
          status: "ステータス",
          codeStatus: "アクティベーションコードのステータス",
          timeRange: "期間",
          groupBy: "グルーピング",
          allOperators: "全オペレーター",
          allStatus: "全ステータス",
          cardsScope: "カードの集計範囲",
          scope: {
            overall: "全体",
            filtered: "フィルター後"
          },
          quick: {
            last7Days: "過去7日",
            last30Days: "過去30日",
            last90Days: "過去90日",
            custom: "カスタム"
          },
          group: {
            day: "日別",
            week: "週別",
            month: "月別"
          },
          actions: {
            apply: "適用",
            reset: "リセット"
          }
        }
      }
    }
  }
};
