<template>
  <div class="ebt-nav-sutta" v-if="sutta && sutta.sutta_uid">
    <ebt-picker :items="prevItems" 
      :labelIndex="-1" 
      @ebt-pick-item="pickItem($event)"
    ></ebt-picker>

    <div class="ebt-suttacentral"
      @mouseover="suttacentral=true" @mouseleave="suttacentral=false">
      <a v-if="suttacentral"
        :href="`https://suttacentral.net/${current.sutta_uid}`"
        target="_blank"> SuttaCentral </a>
      <span v-else >
        {{current.sutta_uid}}/{{current.lang}} </span>
    </div>

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
    let { $el } = this;
    this.$nuxt.$on('ebt-load-sutta', payload=>{
      $el && $el.scrollIntoView({
        block: "center",
      });
    });
  },
  methods:{
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
    iCursor() {
      return this.$store.state.ebt.settings.iCursor;
    },
    history() {
      return this.$store.state.ebt.settings.history;
    },
  },
}
</script>
<style>
</style>
