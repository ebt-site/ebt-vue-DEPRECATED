<template>
  <div id="ebt-search-field" v-if="displayable" class="pl-1">
    <v-autocomplete 
      ref="refSearchAuto"
      v-model="search"
      :items="searchItems"
      :search-input.sync="search"
      :filter="searchFilter"
      clearable
      @input="onSearchInput($event)"
    ></v-autocomplete>
    <div class="ebt-inspire-row">
      <v-btn @click="clickInspireMe()"
        @touchstart="onTouchStart()"
        role="button"
        :aria-label="$t('inspireMe')"
        class="ebt-text-btn " :style="cssVars" small>
        {{$t('inspireMe')}}
      </v-btn>
      <audio id="inspireAudio" preload=auto>
        <source type="audio/mp3" :src="inspireAudio"/>
      </audio>
    </div>
    <v-alert :value="!!searchError" color="deep-orange darken-4" 
      type="info" :icon="mdiCancel">
      <a :href="altSearchUrl" target="_blank" >
        {{searchError}}
      </a>
    </v-alert>
  </div>
</template>

<script>
import Vue from 'vue';
import {
  mdiCancel,
} from "@mdi/js";
const BilaraWeb = require('../src/bilara-web');

export default {
  components: {
  },
  props: {
    js: Object,
  },
  data: function(){
    return {
      bilaraWeb: null,
      displayable: false,
      mdiCancel,
    };
  },
  async mounted() {
    let { $route, $vuetify, $store, $refs, js } = this;
    let { 
        sutta_uid, 
        lang, 
        translator, 
        segnum, 
        search = $route.query.search,
    } = BilaraWeb.decodeHash(window.location.hash);
    this.$nextTick(()=>Vue.set(this, 'displayable', true));
    this.bilaraWeb = new js.BilaraWeb({fetch});
    if (search) {
      let that = this;
      this.search = search;
      this.$nextTick(()=>{
        that.onSearchInput(search);
      });
    }
    console.debug('ebt-search-field.mounted() route', this.$route);
    let that = this;
    this.$nuxt.$on('ebt-load-example', payload => {
        setTimeout(()=>{ that.$nextTick(()=>{
            let { $el:refSearchAuto } = $refs['refSearchAuto'] || {};
            if (refSearchAuto) {
                console.log('ebt-search-field.mounted@ebt-load-example', refSearchAuto);
                refSearchAuto.scrollIntoView({ block: "center", });
            } else {
                console.log('ebt-search-field.mounted@ebt-load-example (no element)');
            }
        })}, 500);
    });
  },
  methods:{
    onTouchStart() {
      let audio = document.getElementById("inspireAudio");
      console.log(`ebt-search-field.onTouchStart()`, audio);
      audio && audio.play();
    },
    async onSearchInput(pattern='') { try {
      let { bilaraWeb, lang } = this;
      let noValue = {mlDocs:[]};
      pattern = pattern && pattern.toLowerCase().trim();
      let parsed = pattern && bilaraWeb.parseSuttaRef(pattern, lang);
      this.$store.commit('ebt/searchError', null);
      console.log(`onSearchInput(${pattern})`, {parsed});
      if (parsed) {
        this.$store.dispatch('ebt/loadSutta', parsed );
        return;
      }
      this.$store.commit('ebt/searchResults', null);
      this.$store.commit('ebt/search', pattern);
      this.$store.dispatch('ebt/loadExample', {pattern, lang});
    } catch(e) {
      console.error(`onSearchInput(${pattern})`, e.message);
    }},
    searchFilter(item, queryText, itemText) {
      let it = itemText.toLowerCase();
      let qt = queryText.toLowerCase();
      return it.indexOf(qt) >= 0;
    },
    clickInspireMe() {
      let { 
        $vuetify,
        examples, 
        lang,
        locale,
      } = this;
      let that = this;
      let langEx = examples[lang] || examples[locale] || examples.en;
      let iExample = Math.trunc(Math.random() * langEx.length);
      let eg = langEx[iExample];
      Vue.set(this, "search", eg);
      this.$nextTick(()=>{
        that.onSearchInput(eg);
      });
      console.log('clickInspireMe', eg);
    },
  },
  computed: {
    lang() {
        return this.$store.state.ebt.settings.lang;
    },
    locale() {
        return this.$store.state.ebt.settings.locale;
    },
    examples() {
        return this.$store.state.ebt.examples;
    },
    search: {
        get: function() { return this.$store.state.ebt.search },
        set: function(value) { this.$store.commit('ebt/search', value); },
    },
    cssVars() {
      return {
        //"--seg-text-width": this.segTextWidth,
        //'--success-color': this.$vuetify.theme.success,
      }
    },
    altSearchUrl() {
      let { search } = this;
      return [
        `https://voice.suttacentral.net`,
        `scv`,
        `index.html?#`,
        `sutta?search=${search}`,
      ].join('/');
    },
    searchError() {
        return this.$store.state.ebt.searchError;
    },
    searchItems() {
      let { $vuetify, lang, locale, } = this;
      var search = (this.search||'').toLowerCase();
      var langEx = this.examples[lang] || this.examples[locale] || this.examples.en;
      var examples = search
        ? langEx.filter(ex=>ex.toLowerCase().indexOf(search)>=0)
        : langEx;
      return !search || examples.includes(this.search) 
        ? [ ...examples ]
        : [`${this.search}`, ...examples];
    },
    inspireAudio() {
      return "audio/383542__alixgaus__turn-page.mp3";
    },
  },
}
</script>
<style>
</style>
