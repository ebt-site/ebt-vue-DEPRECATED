<template>
  <div class="ebt-history" v-if="sutta && sutta.sutta_uid">
    <ebt-picker :items="prevItems" 
      :labelIndex="-1" 
      @ebt-pick-item="pickItem($event)"
    ></ebt-picker>

    <v-btn small text
      class="ebt-text-btn ebt-nav-btn v-btn--active""
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
    let that = this;
    setTimeout(()=>{
      let { history, iCursor, cursor, $store } = that;
      console.debug(`ebt-history.mounted()`, cursor);
      if (cursor) {
        $store.dispatch('ebt/loadSutta', cursor);
      }
    }, 500);
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
      let { history, $store } = this;
      let [ sutta_uid, lang=this.lang ] = label.split('/');
      let h = history.find(h=>h.sutta_uid===sutta_uid && h.lang===lang);
      if (h == null) {
        console.warn(`ebt-history.pickItem() could not find:`, {sutta_uid,lang});
        retrn;
      } 
      console.log(`ebt-history.pickItem()`, {sutta_uid, lang});
      $store.dispatch('ebt/loadSutta', {sutta_uid, lang});
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
          date: h.date,
        }));
    },
    prevItems() {
        let { history, sutta, iCursor } = this;
        let { sutta_uid, lang } = sutta;
        let iCur = history.findIndex(h=>
          h.sutta_uid===sutta_uid && h.lang===lang);
        return (history.slice(0, iCursor) || []).map(h=>({
          label: `${h.sutta_uid}/${h.lang}`,
          date: h.date,
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
.ebt-history {
  display: flex;
  flex-flow: row noWrap;
  align-items: center;
  justify-content: center;
  width: 100%;
}
</style>
