<template>
  <div class="ebt-nav-sutta" v-if="sutta && sutta.sutta_uid">
    <ebt-picker :items="prevItems" 
      :labelIndex="-1" 
      @ebt-pick-item="pickItem($event)"
    ></ebt-picker>

    <v-btn small text
      class="ebt-text-btn ebt-nav-btn"
      @click="clickCursor(cursor)"
    >{{cursorLabel}}</v-btn>

    <ebt-picker :items="nextItems" 
      :labelIndex="0" 
      @ebt-pick-item="pickItem($event)"
    ></ebt-picker>
  </div>
</template>

<script>
import {
  mdiChevronLeft,
  mdiChevronRight,
} from '@mdi/js';
import EbtPicker from './ebt-picker';

export default {
  components: {
    EbtPicker,
  },
  props: {
  },
  data: function(){
    return {
      mdiChevronLeft,
      mdiChevronRight,
      suttacentral: false,
    };
  },
  async mounted() {
    //this.$nuxt.$on('ebt-load-sutta', payload=>{
      //let { $el } = this;
      //$el && $el.scrollIntoView({
        //block: "center",
      //});
    //});
  },
  methods:{
    async clickCursor(cursor) {
        let { sutta, history, $store } = this;
        let { sutta_uid, lang } = cursor;
        let updateHistory = false;
        if (sutta_uid !== sutta.sutta_uid) {
            await $store.dispatch('ebt/loadSutta', {sutta_uid, lang, updateHistory});
        }
        let elt = document.getElementById(cursor.scid);
        if (elt) {
          elt.scrollIntoView({block: "center"});
        } else {
          console.warn(`clickCursor() not found: ${cursor.scid}`);
        }
    },
    pickItem(evt) {
      let { label } = evt;
      console.log(`pickItem`, evt);
      let [ sutta_uid, lang=this.lang ] = label.split('/');
      console.log(`pickItem`, {evt, sutta_uid, lang});
      this.clickSutta({sutta_uid, lang});
    },
    clickSutta({sutta_uid, lang}) {
        let { history, $store } = this;
        let h = history.find(h=>h.sutta_uid===sutta_uid && h.lang===lang);
        let updateHistory = false;
        $store.dispatch('ebt/loadSutta', {sutta_uid, lang, updateHistory});
    },
  },
  computed: {
    cursorLabel() {
        let { scid='--', lang='--' } = this.cursor || {};
        return `${scid}/${lang}`;
    },
    nextItems() {
        let { history, sutta, iCursor } = this;
        let { sutta_uid, lang } = sutta;
        let iCur = history.findIndex(h=>
          h.sutta_uid===sutta_uid && h.lang===lang);
        return (history.slice(iCursor+1) || []).map(h=>({
          label: `${h.sutta_uid}/${h.lang}`,
        }));
    },
    prevItems() {
        let { history, sutta, iCursor } = this;
        let { sutta_uid, lang } = sutta;
        let iCur = history.findIndex(h=>
          h.sutta_uid===sutta_uid && h.lang===lang);
        return (history.slice(0, iCursor) || []).map(h=>({
          label: `${h.sutta_uid}/${h.lang}`,
        }));
    },
    previous() {
        let { history, sutta } = this;
        let { sutta_uid, lang } = sutta;
        let iCur = history.findIndex(h=>h.sutta_uid===sutta_uid && h.lang===lang);
        return history[iCur-1];
    },
    current() {
        let { history, sutta } = this;
        let { sutta_uid, lang } = sutta;
        let iCur = history.findIndex(h=>h.sutta_uid===sutta_uid && h.lang===lang);
        return history[iCur] || sutta;
    },
    next() {
        let { history, sutta } = this;
        let { sutta_uid, lang } = sutta;
        let iCur = history.findIndex(h=>h.sutta_uid===sutta_uid && h.lang===lang);
        return history[iCur+1];
    },
    sutta() {
        return this.$store.state.ebt.sutta;
    },
    settings() {
      return this.$store.state.ebt.settings;
    },
    iCursor() {
      return this.settings.iCursor;
    },
    cursor() {
        let { iCursor, history } = this.settings;
        return history && history[iCursor];
    },
    history() {
      return this.settings.history;
    },
  },
}
</script>
<style>
</style>
