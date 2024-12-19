<template>
  <div>
    <input type="file" @change="onFileChange" />
    <select v-model="outputFormat" @change="resetProgress">
      <option value="wav">WAV</option>
      <option value="mp3">MP3</option>
      <!-- 添加其他格式选项 -->
    </select>
    <button @click="startConversion" :disabled="!selectedFile">
      Start Conversion
    </button>
    <div v-if="progress > 0">
      <p>Conversion Progress: {{ progress }}%</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
// 注意：在 Electron 的渲染器进程中，通常通过 import 语句导入 ipcRenderer
// 如果您的项目配置允许，请确保以下导入语句正确无误
// import { ipcRenderer } from 'electron';
// 由于我们无法确定您的 Electron 配置，这里暂时保留 window.ipcRenderer 作为示例
// 但请根据实际情况调整

export default {
  name: "AudioConverter",
  setup() {
    const selectedFile = ref(null);
    const outputFormat = ref("wav");
    const progress = ref(0);
    let conversionListener = null; // 用于存储进度事件的监听器函数

    const onFileChange = (event) => {
      selectedFile.value = event.target.files[0];
    };

    const resetProgress = () => {
      progress.value = 0;
    };

    const startConversion = async () => {
      if (!selectedFile.value) return;

      // 如果之前的转换还在进行中，可以先取消或等待它完成
      // 这里简单处理为如果有正在进行的转换，则等待它完成
      // 实际情况可能需要更复杂的逻辑来处理并发转换请求
      if (conversionListener) {
        // 注意：这里不能直接 await 一个未解决的 Promise，因为 conversionListener 不是一个 Promise
        // 这里的逻辑需要根据实际情况调整，比如使用一个标志位来等待之前的转换完成
        // 或者取消之前的转换（如果可能的话）
        // 这里只是简单地注释掉以避免潜在的错误
        // await somePreviousConversionPromise; // 假设有这样一个 Promise
      }

      const filePath = selectedFile.value.path;

      // 设置进度事件的监听器
      conversionListener = (_, { percent }) => {
        progress.value = percent;
      };
      window.ipcRenderer.on("conversion-progress", conversionListener);

      try {
        const result = await window.ipcRenderer.invoke("convert-audio", {
          filePath,
          outputFormat: outputFormat.value,
        });
        console.log(result);
        // 更新 UI 或执行其他操作
        alert("Conversion successful!");
      } catch (error) {
        console.error(error);
        // 更新 UI 或执行其他操作
        alert("Conversion failed!");
      } finally {
        // 无论转换成功还是失败，都需要移除进度事件的监听器
        window.ipcRenderer.removeListener(
          "conversion-progress",
          conversionListener,
        );
        conversionListener = null; // 清理引用
      }
    };

    // 在组件卸载时（例如，当组件被销毁时），确保移除 IPC 监听器
    // 注意：由于我们在 finally 块中已经移除了监听器，所以这里的 onUnmounted 可能不是必需的
    // 但为了保持代码的清晰和完整性，还是保留了这个钩子
    onUnmounted(() => {
      if (conversionListener) {
        window.ipcRenderer.removeListener(
          "conversion-progress",
          conversionListener,
        );
      }
    });

    return {
      selectedFile,
      outputFormat,
      progress,
      startConversion,
      resetProgress,
      onFileChange
    };
  },
};
</script>

<style scoped>
/* 添加一些基本的样式 */
input[type="file"] {
  margin-bottom: 10px;
}

select {
  margin-bottom: 10px;
}

button {
  margin-top: 10px;
}
</style>
