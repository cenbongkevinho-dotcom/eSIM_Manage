import dayjs from "dayjs";
import DictForm from "../form/dict.vue";
import editForm from "../form/index.vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { usePublicHooks } from "../hooks";
import { h, ref, reactive, onMounted } from "vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import type { FormItemProps } from "../utils/types";
import type { PaginationProps } from "@pureadmin/table";
import { getDictTree, getDictDetail } from "@/api/system";
import { useI18n } from "vue-i18n";

/**
 * 字典管理模块的业务逻辑 Hook。
 * 提供左侧字典树、右侧详情列表、分页、搜索与新增/编辑弹窗等功能。
 */
export function useDict() {
  // 获取国际化函数
  const { t } = useI18n();
  // 左侧字典树的id
  const dictId = ref("");
  const formRef = ref();
  const dataList = ref([]);
  const loading = ref(true);
  const switchLoadMap = ref({});
  const { switchStyle } = usePublicHooks();
  const treeData = ref([]);
  const treeLoading = ref(true);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });
  /**
   * 表格列配置。
   * 所有列标题使用 i18n，确保多语言环境下显示一致。
   */
  const columns: TableColumnList = [
    {
      label: t("views.dict.form.label"),
      prop: "label",
      minWidth: 130,
      cellRenderer: scope => (
        <el-button size="small" color={scope.row.color}>
          {scope.row.label}
        </el-button>
      )
    },
    {
      label: t("views.dict.form.value"),
      prop: "value",
      minWidth: 130
    },
    {
      label: t("views.dict.form.status"),
      prop: "status",
      minWidth: 90,
      cellRenderer: scope => (
        <el-switch
          size={scope.props.size === "small" ? "small" : "default"}
          loading={switchLoadMap.value[scope.index]?.loading}
          v-model={scope.row.status}
          active-value={1}
          inactive-value={0}
          active-text={t("common.status.enabledLong")}
          inactive-text={t("common.status.disabledLong")}
          inline-prompt
          style={switchStyle.value}
          onChange={() => onChange(scope as any)}
        />
      )
    },
    {
      sortable: true,
      label: t("views.dict.form.sort"),
      minWidth: 90,
      prop: "sort"
    },
    {
      label: t("views.dict.form.remark"),
      minWidth: 90,
      prop: "remark"
    },
    {
      label: t("common.columns.createTime"),
      minWidth: 90,
      prop: "createTime",
      formatter: ({ createTime }) =>
        dayjs(createTime).format("YYYY-MM-DD HH:mm:ss")
    },
    {
      label: t("common.columns.operation"),
      fixed: "right",
      width: 180,
      slot: "operation"
    }
  ];
  /**
   * 切换字典标签的启用/停用状态。
   * 弹窗与提示均使用 i18n，并保留 HTML 高亮效果。
   */
  function onChange({ row, index }) {
    const actionText =
      row.status === 0
        ? t("common.status.disabled")
        : t("common.status.enabled");
    const confirmHtml = `${t("views.dict.index.switchConfirmPrefix")}<strong>${actionText}</strong><strong style='color:var(--el-color-primary)'>${row.label}</strong>${t("views.dict.index.switchConfirmSuffix")}`;
    ElMessageBox.confirm(confirmHtml, t("views.dict.index.confirmTitle"), {
      confirmButtonText: t("common.buttons.confirm"),
      cancelButtonText: t("common.buttons.cancel"),
      type: "warning",
      dangerouslyUseHTMLString: true,
      draggable: true
    })
      .then(() => {
        switchLoadMap.value[index] = Object.assign(
          {},
          switchLoadMap.value[index],
          {
            loading: true
          }
        );
        setTimeout(() => {
          switchLoadMap.value[index] = Object.assign(
            {},
            switchLoadMap.value[index],
            {
              loading: false
            }
          );
          message(t("views.dict.messages.statusUpdated"), {
            type: "success"
          });
        }, 300);
      })
      .catch(() => {
        row.status === 0 ? (row.status = 1) : (row.status = 0);
      });
  }

  /**
   * 删除字典详情项后，弹出成功消息并刷新列表。
   */
  function handleDelete(row) {
    message(t("views.dict.messages.deleted", { label: row.label }), {
      type: "success"
    });
    onSearch();
  }

  /**
   * 页大小变更事件。
   */
  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
  }

  /**
   * 页码变更事件。
   */
  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
  }

  /**
   * 根据当前选择的字典ID查询字典详情列表，并更新分页。
   */
  async function onSearch() {
    loading.value = true;
    const { data } = await getDictDetail({ dictId: dictId.value });
    dataList.value = data.list;
    pagination.total = data.total;
    pagination.pageSize = data.pageSize;
    pagination.currentPage = data.currentPage;

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  /**
   * 左侧树选择事件：更新字典ID并触发查询。
   */
  function onTreeSelect({ id, selected }) {
    dictId.value = selected ? id : "";
    onSearch();
  }

  /**
   * 打开字典详情的新增/编辑弹窗。
   * @param mode 操作模式：add（新增）或 edit（编辑）
   * @param row 当前行数据（编辑模式时传入）
   */
  function openDialog(mode: "add" | "edit" = "add", row?: FormItemProps) {
    const isAdd = mode === "add";
    const dialogTitle = isAdd
      ? t("views.dict.index.dialog.addDetailTitle")
      : t("views.dict.index.dialog.editDetailTitle");
    addDialog({
      title: dialogTitle,
      props: {
        formInline: {
          isAdd,
          label: row?.label ?? "",
          value: row?.value ?? "",
          color: row?.color ?? "#6abe39",
          sort: row?.sort ?? 999,
          status: row?.status ?? 1,
          remark: row?.remark ?? ""
        }
      },
      width: "32%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        function chores() {
          const msg = isAdd
            ? t("views.dict.messages.created", { label: curData.label })
            : t("views.dict.messages.updated", { label: curData.label });
          message(msg, { type: "success" });
          done(); // 关闭弹框
          onSearch(); // 刷新表格数据
        }
        FormRef.validate(valid => {
          if (valid) {
            console.log("curData", curData);
            // 表单规则校验通过
            if (isAdd) {
              // 实际开发先调用新增接口，再进行下面操作
              chores();
            } else {
              // 实际开发先调用修改接口，再进行下面操作
              chores();
            }
          }
        });
      }
    });
  }

  /**
   * 打开字典（名称/编码）新增或编辑弹窗。
   * @param mode 操作模式：add（新增）或 edit（编辑）
   * @param row 当前字典数据（编辑模式时传入）
   */
  function openDictDialog(mode: "add" | "edit" = "add", row?: any) {
    const isEdit = mode === "edit";
    const dialogTitle = isEdit
      ? t("views.dict.index.dialog.editDictTitle")
      : t("views.dict.index.dialog.addDictTitle");
    addDialog({
      title: dialogTitle,
      props: {
        formInline: {
          isEdit,
          name: row?.name ?? "",
          code: row?.code ?? "",
          remark: row?.remark ?? ""
        }
      },
      width: "32%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(DictForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline;
        function chores() {
          const msg = isEdit
            ? t("views.dict.messages.updated", { label: curData.name })
            : t("views.dict.messages.created", { label: curData.name });
          message(msg, { type: "success" });
          done(); // 关闭弹框
          getDictTreeData(); // 刷新左侧字典树
        }
        FormRef.validate(valid => {
          if (valid) {
            console.log("curData", curData);
            // 表单规则校验通过
            if (!isEdit) {
              // 实际开发先调用新增接口，再进行下面操作
              chores();
            } else {
              // 实际开发先调用修改接口，再进行下面操作
              chores();
            }
          }
        });
      }
    });
  }

  /** 字典管理-左侧树数据 */
  async function getDictTreeData() {
    treeLoading.value = true;
    const { data } = await getDictTree();
    setTimeout(() => {
      treeData.value = data;
      treeLoading.value = false;
    }, 200);
  }

  onMounted(() => {
    getDictTreeData();
    onSearch();
  });

  return {
    dictId,
    loading,
    columns,
    dataList,
    treeData,
    treeLoading,
    pagination,
    deviceDetection,
    onSearch,
    openDialog,
    onTreeSelect,
    handleDelete,
    openDictDialog,
    getDictTreeData,
    handleSizeChange,
    handleCurrentChange
  };
}
