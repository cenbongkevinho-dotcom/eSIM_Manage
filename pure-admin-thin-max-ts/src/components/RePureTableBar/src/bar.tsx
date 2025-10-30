import Sortable from "sortablejs";
import { useEpThemeStoreHook } from "@/store/modules/epTheme";
// 引入全局注册的在线 Iconify 组件用于 TSX 中显式引用
// 使用 SmartIcon（离线优先）替换在线 Iconify 引用
import { SmartIcon } from "@/components/ReIcon";
import {
  type PropType,
  ref,
  unref,
  computed,
  nextTick,
  defineComponent,
  getCurrentInstance
} from "vue";
import {
  delay,
  cloneDeep,
  isBoolean,
  isFunction,
  getKeyList
} from "@pureadmin/utils";

// 统一使用冒号风格命名，运行时 SmartIcon 离线优先 + 在线回退渲染
const Fullscreen = "ri:fullscreen-fill";
const ExitFullscreen = "ri:fullscreen-exit-fill";
// 拖拽手柄使用 Remix 图标
const DragMove = "ri:drag-move-2-fill";
const Refresh = "ep:refresh";
const Setting = "ri:settings-3-line";
const ExpandAll = "ep:arrow-down-bold";
const DensityMenu = "ep:menu";

const props = {
  /** 头部最左边的标题 */
  title: {
    type: String,
    default: "列表"
  },
  /** 对于树形表格，如果想启用展开和折叠功能，传入当前表格的ref即可 */
  tableRef: {
    type: Object as PropType<any>
  },
  /** 需要展示的列 */
  columns: {
    type: Array as PropType<TableColumnList>,
    default: () => []
  },
  isExpandAll: {
    type: Boolean,
    default: true
  },
  tableKey: {
    type: [String, Number] as PropType<string | number>,
    default: "0"
  }
};

export default defineComponent({
  name: "PureTableBar",
  props,
  emits: ["refresh", "fullscreen"],
  setup(props, { emit, slots, attrs }) {
    const size = ref("default");
    const loading = ref(false);
    const checkAll = ref(true);
    const isFullscreen = ref(false);
    const isIndeterminate = ref(false);
    const instance = getCurrentInstance()!;
    const isExpandAll = ref(props.isExpandAll);
    const filterColumns = cloneDeep(props?.columns).filter(column =>
      isBoolean(column?.hide)
        ? !column.hide
        : !(isFunction(column?.hide) && column?.hide())
    );
    let checkColumnList = getKeyList(cloneDeep(props?.columns), "label");
    const checkedColumns = ref(getKeyList(cloneDeep(filterColumns), "label"));
    const dynamicColumns = ref(cloneDeep(props?.columns));

    const getDropdownItemStyle = computed(() => {
      return s => {
        return {
          background:
            s === size.value ? useEpThemeStoreHook().epThemeColor : "",
          color: s === size.value ? "#fff" : "var(--el-text-color-primary)"
        };
      };
    });

    const iconClass = computed(() => {
      return [
        "text-black",
        "dark:text-white",
        "duration-100",
        "hover:text-primary!",
        "cursor-pointer",
        "outline-hidden"
      ];
    });

    const topClass = computed(() => {
      return [
        "flex",
        "justify-between",
        "pt-[3px]",
        "px-[11px]",
        "border-b-[1px]",
        "border-solid",
        "border-[#dcdfe6]",
        "dark:border-[#303030]"
      ];
    });

    /**
     * 触发表格刷新动作
     * 说明：
     * - 设置 loading 动画，发出 "refresh" 事件供父组件处理数据刷新
     * - 500ms 后自动结束 loading 动画
     */
    function onReFresh() {
      loading.value = true;
      emit("refresh");
      delay(500).then(() => (loading.value = false));
    }

    /**
     * 切换树形表格的展开/折叠状态
     * @description 通过递归控制所有行的展开状态，实现一键展开/折叠
     */
    function onExpand() {
      isExpandAll.value = !isExpandAll.value;
      toggleRowExpansionAll(props.tableRef.data, isExpandAll.value);
    }

    /**
     * 切换当前容器的全屏状态
     * @param none 外部通过 "fullscreen" 事件接收状态布尔值
     */
    function onFullscreen() {
      isFullscreen.value = !isFullscreen.value;
      emit("fullscreen", isFullscreen.value);
    }

    /**
     * 递归切换所有行的展开状态
     * @param data 当前表格数据源（支持树形结构）
     * @param isExpansion 是否展开
     */
    function toggleRowExpansionAll(data, isExpansion) {
      data.forEach(item => {
        props.tableRef.toggleRowExpansion(item, isExpansion);
        if (item.children !== undefined && item.children !== null) {
          toggleRowExpansionAll(item.children, isExpansion);
        }
      });
    }

    /**
     * 切换“列展示”全选状态
     * @param val 是否全选
     */
    function handleCheckAllChange(val: boolean) {
      checkedColumns.value = val ? checkColumnList : [];
      isIndeterminate.value = false;
      dynamicColumns.value.map(column =>
        val ? (column.hide = false) : (column.hide = true)
      );
    }

    /**
     * 监听列复选框选中项变化，更新“半选”与“全选”状态
     * @param value 当前选中的列 label 列表
     */
    function handleCheckedColumnsChange(value: string[]) {
      checkedColumns.value = value;
      const checkedCount = value.length;
      checkAll.value = checkedCount === checkColumnList.length;
      isIndeterminate.value =
        checkedCount > 0 && checkedCount < checkColumnList.length;
    }

    /**
     * 切换单列显示/隐藏
     * @param val 是否显示
     * @param label 列标识（label）
     */
    function handleCheckColumnListChange(val: boolean, label: string) {
      dynamicColumns.value.filter(item => item.label === label)[0].hide = !val;
    }

    /**
     * 重置列展示设置为初始配置
     * @description 恢复全选、取消半选、同步初始列与已选列
     */
    async function onReset() {
      checkAll.value = true;
      isIndeterminate.value = false;
      dynamicColumns.value = cloneDeep(props?.columns);
      checkColumnList = [];
      checkColumnList = await getKeyList(cloneDeep(props?.columns), "label");
      checkedColumns.value = getKeyList(cloneDeep(filterColumns), "label");
    }

    const dropdown = {
      dropdown: () => (
        <el-dropdown-menu class="translation">
          <el-dropdown-item
            style={getDropdownItemStyle.value("large")}
            onClick={() => (size.value = "large")}
          >
            宽松
          </el-dropdown-item>
          <el-dropdown-item
            style={getDropdownItemStyle.value("default")}
            onClick={() => (size.value = "default")}
          >
            默认
          </el-dropdown-item>
          <el-dropdown-item
            style={getDropdownItemStyle.value("small")}
            onClick={() => (size.value = "small")}
          >
            紧凑
          </el-dropdown-item>
        </el-dropdown-menu>
      )
    };

    /**
     * 列展示拖拽排序
     * @param event 鼠标进入事件（用于初始化 Sortable 拖拽）
     */
    const rowDrop = (event: { preventDefault: () => void }) => {
      event.preventDefault();
      nextTick(() => {
        const wrapper: HTMLElement = (
          instance?.proxy?.$refs[`GroupRef${unref(props.tableKey)}`] as any
        ).$el.firstElementChild;
        Sortable.create(wrapper, {
          animation: 300,
          handle: ".drag-btn",
          onEnd: ({ newIndex, oldIndex, item }) => {
            const targetThElem = item;
            const wrapperElem = targetThElem.parentNode as HTMLElement;
            const oldColumn = dynamicColumns.value[oldIndex];
            const newColumn = dynamicColumns.value[newIndex];
            if (oldColumn?.fixed || newColumn?.fixed) {
              // 当前列存在fixed属性 则不可拖拽
              const oldThElem = wrapperElem.children[oldIndex] as HTMLElement;
              if (newIndex > oldIndex) {
                wrapperElem.insertBefore(targetThElem, oldThElem);
              } else {
                wrapperElem.insertBefore(
                  targetThElem,
                  oldThElem ? oldThElem.nextElementSibling : oldThElem
                );
              }
              return;
            }
            const currentRow = dynamicColumns.value.splice(oldIndex, 1)[0];
            dynamicColumns.value.splice(newIndex, 0, currentRow);
          }
        });
      });
    };

    /**
     * 判断列是否为固定列
     * @param label 列标识（label）
     */
    const isFixedColumn = (label: string) => {
      return dynamicColumns.value.filter(item => item.label === label)[0].fixed
        ? true
        : false;
    };

    /**
     * 构建 tippy 的提示配置
     * @param content 提示文案内容
     */
    const rendTippyProps = (content: string) => {
      // https://vue-tippy.netlify.app/props
      return {
        content,
        offset: [0, 18],
        duration: [300, 0],
        followCursor: true,
        hideOnClick: "toggle"
      };
    };

    /**
     * 列设置弹窗的触发图标
     * 说明：使用 SmartIcon（离线优先），同时保留 v-tippy 提示与样式
     */
    const reference = {
      reference: () => (
        <SmartIcon
          class={["w-[16px]", iconClass.value]}
          icon={Setting}
          v-tippy={rendTippyProps("列设置")}
        />
      )
    };

    return () => (
      <>
        <div
          {...attrs}
          class={[
            "w-full",
            "px-2",
            "pb-2",
            "bg-bg_color",
            isFullscreen.value
              ? ["h-full!", "z-2002", "fixed", "inset-0"]
              : "mt-2"
          ]}
        >
          <div class="flex justify-between w-full h-[60px] p-4">
            {slots?.title ? (
              slots.title()
            ) : (
              <p class="font-bold truncate">{props.title}</p>
            )}
            <div class="flex items-center justify-around">
              {slots?.buttons ? (
                <div class="flex mr-4">{slots.buttons()}</div>
              ) : null}
              {props.tableRef?.size ? (
                <>
                  <SmartIcon
                    class={["w-[16px]", iconClass.value]}
                    icon={ExpandAll}
                    style={{
                      transform: isExpandAll.value ? "none" : "rotate(-90deg)"
                    }}
                    v-tippy={rendTippyProps(
                      isExpandAll.value ? "折叠" : "展开"
                    )}
                    onClick={() => onExpand()}
                  />
                  <el-divider direction="vertical" />
                </>
              ) : null}
              <SmartIcon
                class={[
                  "w-[16px]",
                  iconClass.value,
                  loading.value ? "animate-spin" : ""
                ]}
                icon={Refresh}
                v-tippy={rendTippyProps("刷新")}
                onClick={() => onReFresh()}
              />
              <el-divider direction="vertical" />
              <el-dropdown
                v-slots={dropdown}
                trigger="click"
                v-tippy={rendTippyProps("密度")}
              >
                <SmartIcon
                  class={["w-[16px]", iconClass.value]}
                  icon={DensityMenu}
                />
              </el-dropdown>
              <el-divider direction="vertical" />

              <el-popover
                v-slots={reference}
                placement="bottom-start"
                popper-style={{ padding: 0 }}
                width="200"
                trigger="click"
              >
                <div class={[topClass.value]}>
                  <el-checkbox
                    class="-mr-1!"
                    label="列展示"
                    v-model={checkAll.value}
                    indeterminate={isIndeterminate.value}
                    onChange={value => handleCheckAllChange(value)}
                  />
                  <el-button type="primary" link onClick={() => onReset()}>
                    重置
                  </el-button>
                </div>

                <div class="pt-[6px] pl-[11px]">
                  <el-scrollbar max-height="36vh">
                    <el-checkbox-group
                      ref={`GroupRef${unref(props.tableKey)}`}
                      modelValue={checkedColumns.value}
                      onChange={value => handleCheckedColumnsChange(value)}
                    >
                      <el-space
                        direction="vertical"
                        alignment="flex-start"
                        size={0}
                      >
                        {checkColumnList.map((item, index) => {
                          return (
                            <div class="flex items-center">
                              <SmartIcon
                                class={[
                                  "drag-btn w-[16px] mr-2",
                                  isFixedColumn(item)
                                    ? "cursor-no-drop!"
                                    : "cursor-grab!"
                                ]}
                                icon={DragMove}
                                onMouseenter={(event: {
                                  preventDefault: () => void;
                                }) => rowDrop(event)}
                              />
                              <el-checkbox
                                key={index}
                                label={item}
                                value={item}
                                onChange={value =>
                                  handleCheckColumnListChange(value, item)
                                }
                              >
                                <span
                                  title={item}
                                  class="inline-block w-[120px] truncate hover:text-text_color_primary"
                                >
                                  {item}
                                </span>
                              </el-checkbox>
                            </div>
                          );
                        })}
                      </el-space>
                    </el-checkbox-group>
                  </el-scrollbar>
                </div>
              </el-popover>
              <el-divider direction="vertical" />

              <SmartIcon
                class={["w-[16px]", iconClass.value]}
                icon={isFullscreen.value ? ExitFullscreen : Fullscreen}
                v-tippy={isFullscreen.value ? "退出全屏" : "全屏"}
                onClick={() => onFullscreen()}
              />
            </div>
          </div>
          {slots.default({
            size: size.value,
            dynamicColumns: dynamicColumns.value
          })}
        </div>
      </>
    );
  }
});
