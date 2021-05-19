<template>
  <div class="ebt-nav-sutta" id="ebt-tipitaka" v-if="displayable" >
    <v-btn v-if="previous" small text
      class="ebt-text-btn ebt-nav-btn"
      tabIndex="-1"
      @click="clickSutta(previous)"
      > 
      <div class="ebt-nav-text">
        <div>{{previous}}</div>
      </div>
    </v-btn>
    <v-icon v-else class="ebt-nav-btn-disabled">{{mdiChevronLeft}}</v-icon>

    <div class="ebt-suttacentral">
      <a :href="`https://suttacentral.net/${current.sutta_uid}`"
        tabIndex="-1"
        aria-visible=false
        target="_blank">{{current.sutta_uid}}&rarr;SuttaCentral</a>
    </div>

    <v-btn v-if="next" small text
      class="ebt-text-btn ebt-nav-btn"
      tabIndex="-1"
      @click="clickSutta(next)"
      > 
      <div class="ebt-nav-text">
        <div>{{next}}</div>
      </div>
    </v-btn>
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
.ebt-suttacentral {
  font-variant: small-caps;
  text-align: center;
  background-color: transparent;
  margin-bottom: 0.5em;
  font-size: larger;
}
.v-application .ebt-suttacentral > a {
  font-size: 0.8rem;
  color: var(--ebt-color-light);
}
.ebt-suttacentral a:hover {
  font-weight: var(--ebt-focus-font-weight);
  color: var(--ebt-focus-color-light);
}
</style>
