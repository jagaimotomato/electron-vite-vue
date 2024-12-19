<script setup lang="ts">
import { list } from "./config.json";
import { ref, computed } from "vue";
const model = defineModel();
const keywords = ref("");
const tab = ref("1");
const typeList = ref(list);
const poolList = list.map((v) => v.prefix).flat();

const onChange = (status: boolean, item: string) => {
  if (status) {
    model.value = item;
  } else {
    model.value = "";
  }
};

function update() {}

const filterList = computed(() => {
  return poolList.filter(v => v.includes(keywords.value))
})
</script>

<template>
  <div>
    <v-text-field v-model="keywords">
      <template v-slot:append>
        <v-icon>mdi-magnify</v-icon>
      </template>
    </v-text-field>
    <v-divider></v-divider>
    <v-card>
      <div v-if="!keywords" class="d-flex flex-row">
        <v-tabs v-model="tab" color="primary" direction="vertical">
          <v-tab
            v-for="(v, k) in typeList"
            :prepend-icon="`mdi-${v.icon}`"
            :text="v.name"
            :value="k"
            :key="`type-${k}`"
          ></v-tab>
        </v-tabs>

        <v-tabs-window
          v-model="tab"
          v-for="(v, k) in typeList"
          :key="`window-${k}`"
        >
          <v-tabs-window-item>
            <v-card flat class="tag-wrap">
              <el-check-tag
                type="success"
                v-for="(item, index) in v.prefix"
                :key="`tag-${index}`"
                :checked="item === model"
                @change="(status: boolean) => onChange(status, item)"
              >
                {{ item }}
              </el-check-tag>
            </v-card>
          </v-tabs-window-item>
        </v-tabs-window>
      </div>
      <v-card v-else flat class="tag-wrap">
        <el-check-tag
            type="success"
            v-for="(item, index) in filterList"
            :key="`tag-${index}`"
            :checked="item === model"
            @change="(status: boolean) => onChange(status, item)"
        >
          {{ item }}
        </el-check-tag>
      </v-card>
    </v-card>
  </div>
</template>

<style scoped lang="scss">
:deep(.v-input__details) {
  display: none;
}
:deep(.v-divider) {
  margin: 12px 0;
}

.tag-wrap {
  padding: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

:deep(.el-check-tag) {
  width: 72px;
  text-align: center;
}
</style>
