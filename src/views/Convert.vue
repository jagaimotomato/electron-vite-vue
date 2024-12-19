<template>
  <div class="convert-container" @click="onContainerClick">
    <div class="form-input">
      <v-file-input
        label="选择文件"
        class="file-input"
        color="deep-purple-accent-4"
        variant="outlined"
        chips
        counter
        multiple
        show-size="1024"
        placeholder="请选择文件"
        width="500px"
        @update:modelValue="onChange"
        :accept="`.${type}`"
        :disabled="disabled"
      ></v-file-input>
      <div class="btn-wrap">
        <el-popover
          :visible="visible"
          placement="bottom"
          title="选择格式"
          :width="512"
        >
          <template #reference>
            <v-btn class="m-2 btn" @click="onPopoverChange">{{
              type || "选择格式"
            }}</v-btn>
          </template>
          <template #default>
            <type-select v-model="type" @select="visible = false"></type-select>
          </template>
        </el-popover>
        <v-icon icon="mdi-arrow-right-box"></v-icon>
        <el-popover
          :visible="beTransTypeVisible"
          placement="bottom"
          title="选择格式"
          :width="512"
        >
          <template #reference>
            <v-btn class="m-2 btn" @click="onBeTransTypeVisibleChange">{{
              beTransType || "选择格式"
            }}</v-btn>
          </template>
          <template #default>
            <type-select
              v-model="beTransType"
              @select="beTransTypeVisible = false"
            ></type-select>
          </template>
        </el-popover>
      </div>
    </div>
    <v-table height="300px" fixed-header>
      <thead>
        <tr>
          <th class="text-left">名称</th>
          <th class="text-left">大小</th>
          <th class="text-left">进度</th>
          <th class="text-left">目标格式</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in selectedFiles" :key="item.name">
          <td>{{ item.name }}</td>
          <td>{{ getFileSizeStr(item.size) }}</td>
          <td>{{ item.params.percent }}</td>
          <td>{{ item.params.outputFormat }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, toRaw, reactive, computed } from "vue";
import TypeSelect from "../components/TypeSelect.vue";
import { ClickOutside as vClickOutside } from "element-plus";

const visible = ref(false);
const beTransTypeVisible = ref(false);
const prefix = ref("");
const list = reactive([]);
const type = ref("");
const beTransType = ref("");
let selectedFiles = reactive([]);

const onPopoverChange = () => {
  visible.value = !visible.value;
  console.log("Convert.vue->26", visible.value);
};

const onBeTransTypeVisibleChange = () => {
  beTransTypeVisible.value = !beTransTypeVisible.value;
};

const disabled = computed(() => {
  return !beTransType.value || beTransType.value === type.value;
});

const onChange = (files) => {
  console.log("Convert.vue->46", files, selectedFiles);
  if (files.length) {
    files.forEach((file) => {
      if (!selectedFiles.some((v) => isSameFile(v, file))) {
        selectedFiles.push(file);
        file.outputFormat = beTransType.value;
        // 在file对象中新建一个传递给 ffmpeg 的参数
        file.params = {
          outputFormat: beTransType.value,
          filePath: file.path,
          id: self.crypto.randomUUID(),
          percent: 0,
          status: "beFormated",
        };
        startConversion(file.params);
      }
    });
  } else {
    selectedFiles = [];
  }
};

function isSameFile(file1, file2) {
  return (
    file1.name === file2.name &&
    file1.size === file2.size &&
    file1.lastModified === file2.lastModified
  );
}

const getFileSizeStr = (size) => {
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.floor(size * 100) / 100}${units[unitIndex]}`;
};

const startConversion = async (params) => {
  // 如果之前的转换还在进行中，可以先取消或等待它完成
  // 这里简单处理为如果有正在进行的转换，则等待它完成
  // 实际情况可能需要更复杂的逻辑来处理并发转换请求
  console.log("Convert.vue->136", params);
  try {
    const result = await window.ipcRenderer.invoke("convert-audio", params);
    console.log(result);
    // 更新 UI 或执行其他操作
    alert("Conversion successful!");
  } catch (error) {
    console.error(error);
    // 更新 UI 或执行其他操作
    alert("Conversion failed!");
  } finally {
  }
};

// 处理popover 点击其他地方关闭
const onContainerClick = (event) => {
  console.log("Convert.vue->159", event);
};

// 设置进度事件的监听器
const conversionListener = (event, file) => {
  console.log("Convert.vue->171", file);
  const { id, percent } = file;
};
onMounted(() => {
  window.ipcRenderer.on("conversion-progress", conversionListener);
});
onUnmounted(() => {
  if (conversionListener) {
    window.ipcRenderer.removeListener(
      "conversion-progress",
      conversionListener,
    );
  }
});
</script>

<style scoped>
.convert-container {
  padding: 12px 24px;
  margin-top: 100px;
}

.form-input {
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-wrap {
  display: flex;
  align-items: center;
  margin-left: 12px;
}

:deep(.v-input__details) {
  display: none;
}

:deep(.file-input.v-input) {
  width: 600px;
  flex: unset;
  flex-shrink: 0;
}

:deep(.mdi-arrow-right-box) {
  margin: 0 12px;
}

.btn {
  width: 94px;
}
</style>
