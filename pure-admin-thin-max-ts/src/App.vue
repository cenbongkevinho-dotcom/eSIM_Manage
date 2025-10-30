<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
    <ReDialog />
    <ReFloatButton :floatBtns="floatBtns" />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElConfigProvider } from "element-plus";
import { ReDialog } from "@/components/ReDialog";
import ReFloatButton from "@/components/ReFloatButton";
import { elementLocaleRef } from "@/plugins/i18n";

// 使用字符串图标名称，配合离线图标注册，避免虚拟模块加载导致的 ~icons 资源请求

export default defineComponent({
  name: "app",
  components: {
    [ElConfigProvider.name]: ElConfigProvider,
    ReDialog,
    ReFloatButton
  },
  computed: {
    currentLocale() {
      // 读取 i18n 插件暴露的 Element Plus 语言引用，实现随语言切换联动
      return elementLocaleRef.value;
    },
    floatBtns() {
      return [
        {
          tip: "保姆级文档",
          link: "https://pure-admin.cn/",
          // 统一为冒号风格，SmartIcon/useRenderIcon 运行时离线优先 + 在线回退
          icon: "ri:book-open-line",
          show: false
        },
        {
          tip: "高级服务",
          icon: "ri:user-heart-line",
          link: "https://pure-admin.cn/pages/service/",
          show: false
        },
        {
          tip: "Max-Ts 版本",
          link: "https://pure-admin.cn/pages/service/#max-ts-版本",
          icon: "ri:vip-diamond-line",
          show: false
        }
      ];
    }
  }
});
</script>
