interface FormItemProps {
  id?: number;
  /** 是否为新增模式，用于控制字典详情表单的显示逻辑 */
  isAdd: boolean;
  label: string;
  value: string;
  color: string;
  sort: number;
  status: number;
  remark: string;
}
interface FormProps {
  formInline: FormItemProps;
}

interface DictFormItemProps {
  /** 是否为编辑模式，用于控制字典编码是否可编辑等逻辑 */
  isEdit: boolean;
  name: string;
  code: string;
  remark: string;
}
interface DictFormProps {
  formInline: DictFormItemProps;
}

export type { FormItemProps, FormProps, DictFormItemProps, DictFormProps };
