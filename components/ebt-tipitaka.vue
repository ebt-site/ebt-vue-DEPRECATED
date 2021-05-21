<template>
  <div class="ebt-nav-sutta" id="ebt-tipitaka" v-if="displayable" >
    <div v-if="previous" class="ebt-tipitaka-link">
      <a @click="clickSutta(previous)"
        tabIndex="-1"
        aria-visible=false
      >{{previous}}</a>
    </div>
    <v-icon v-else class="ebt-nav-btn-disabled">{{mdiChevronLeft}}</v-icon>

    <div class="ebt-tipitaka-link">
      <a :href="`https://suttacentral.net/${current.sutta_uid}`"
        tabIndex="-1"
        aria-visible=false
        target="_blank">{{current.sutta_uid}}&rarr;SuttaCentral</a>
    </div>

    <div v-if="next" class="ebt-tipitaka-link">
      <a @click="clickSutta(next)"
        tabIndex="-1"
        aria-visible=false
      >{{next}}</a>
    </div>
    <v-icon v-else class="ebt-nav-btn-disabled">{{mdiChevronRight}}</v-icon>
  </div>
</template>

<script>
import Vue from "vue";
import {
  mdiChevronLeft,
  mdiChevronRight,
} from '@mdi/js';

export default {
  components: {
  },
  props: {
    js: Object,
  },
  data: function(){
    return {
      mdiChevronLeft,
      mdiChevronRight,
      tipitaka: null,
    };
  },
  async mounted() {
    let { $el={}, js } = this;
    let tipitaka = new js.Tipitaka();
    Vue.set(this, 'tipitaka', tipitaka);
    this.$nuxt.$on('ebt-load-sutta', payload=>{
      typeof $el.scrollIntoView === 'function' && $el.scrollIntoView({
        block: "center",
      });
    });
  },
  methods:{
    clickSutta(sutta_uid) {
      let { $store, settings, } = this;
      let { lang, history } = settings;
      let iCursor = history.findIndex(h=>h.sutta_uid===sutta_uid && h.lang===lang);
      console.log(`clickSutta`, {sutta_uid, lang, iCursor});
      $store.dispatch('ebt/loadSutta', {sutta_uid, lang, });
    },
  },
  computed: {
    displayable() {
      let { tipitaka, sutta } = this;
      return tipitaka && sutta && sutta.sutta_uid;
    },
    previous() {
        let { tipitaka, sutta } = this;
        let { sutta_uid, lang } = sutta;
        return tipitaka.previousSuid(sutta_uid);
    },
    current() {
        return this.sutta;
    },
    settings() {
      return this.$store.state.ebt.settings;
    },
    next() {
        let { tipitaka, sutta } = this;
        let { sutta_uid, lang } = sutta;
        return tipitaka.nextSuid(sutta_uid);
    },
    sutta() {
        return this.$store.state.ebt.sutta;
    },
  },
}
</script>
<style>
.ebt-tipitaka {
    display: flex;
    flex-flow: row noWrap;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding-left: 2em;
    padding-right: 2em;
}
.ebt-tipitaka > button {
    width: 8em !important;
}
.ebt-tipitaka-button {
  min-width: 5rem;
}
.ebt-tipitaka-link {
  font-variant: small-caps;
  text-align: center;
  background-color: transparent;
  margin-bottom: 0.5em;
  font-size: larger;
  padding-left: 0.8em;
  padding-right: 0.8em;
}
.v-application .ebt-tipitaka-link > a {
  font-size: 0.8rem;
  color: var(--ebt-color-light);
}
.ebt-tipitaka-link:hover a {
  font-weight: var(--ebt-focus-font-weight);
  color: var(--ebt-focus-color-light);
}
</style>
