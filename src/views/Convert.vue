<template>
  <div class="convert-container">
    <div class="form-input">
      <v-file-input
        label="选择文件"
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
      ></v-file-input>
      <div class="btn-wrap">
        <el-popover
          :visible="visible"
          placement="bottom"
          title="选择格式"
          :width="512"
        >
          <template #reference>
            <v-btn class="m-2" @click="onPopoverChange">{{
              type || "选择格式"
            }}</v-btn>
          </template>
          <template #default>
            <type-select v-model="type"></type-select>
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
            <v-btn class="m-2" @click="onBeTransTypeVisibleChange">{{
              beTransType || "选择格式"
            }}</v-btn>
          </template>
          <template #default>
            <type-select v-model="beTransType"></type-select>
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
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in selectedFiles" :key="item.name">
          <td>{{ item.name }}</td>
          <td>{{ getFileSizeStr(item.size) }}</td>
          <td>{{ item.percent }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, toRaw, reactive } from "vue";
import TypeSelect from "../components/TypeSelect.vue";

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

const onChange = (files) => {
  console.log("Convert.vue->46", files, selectedFiles);
  if (files.length) {
    files.forEach((file) => {
      if (!selectedFiles.some((v) => isSameFile(v, file))) {
        selectedFiles.push(file);
        file.outputFormat = beTransType.value;
      }
    });
  } else {
    selectedFiles = [];
  }
  startConversion();
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

const startConversion = async () => {
  if (!selectedFiles.length) return;

  // 如果之前的转换还在进行中，可以先取消或等待它完成
  // 这里简单处理为如果有正在进行的转换，则等待它完成
  // 实际情况可能需要更复杂的逻辑来处理并发转换请求
  const params = {
    filePath: selectedFiles[0].path,
    outputFormat: selectedFiles[0].outputFormat,
  };
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

:deep(.v-input) {
  width: 600px;
  flex: unset;
  flex-shrink: 0;
}

:deep(.mdi-arrow-right-box) {
  margin: 0 12px;
}
</style>
