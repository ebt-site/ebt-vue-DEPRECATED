<template>
  <div class="ebt-processing" v-if="processing">
    <v-alert color="purple darken-4" dark v-if="processing">
        <v-icon>{{mdiFileClock}}</v-icon> 
        {{processing.value}}
    </v-alert>
  </div>
</template>

<script>
import {
  mdiFileClock,
} from "@mdi/js";

export default {
  components: {
  },
  data () {
    return {
      mdiFileClock,
    }
  },
  methods: {
  },
  computed: {
    processing() {
        let { $store } = this;
        return $store && $store.state.ebt.processing;
    },
  },
}
</script>
<style>
.ebt-processing {
  position: fixed;
  height: 100%;
  width: 100%;
  display: flex;
  flex-flow: column;
  justify-content: center;
  align-items: center;
  background: rgb(0,0,0,0.1);
  backdrop-filter: blur(1px);
}
.ebt-processing .v-alert {
  max-width: 90%;
}
</style>
