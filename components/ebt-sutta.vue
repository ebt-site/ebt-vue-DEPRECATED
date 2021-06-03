<template>
  <div v-if="sutta && sutta.sutta_uid" class="ebt-sutta" >
    <header class="ebt-header-class">
      <div class="ebt-sutta-id">
        {{current.sutta_uid}}/{{current.lang}}
        <v-icon v-if="isPinnedSutta" 
          @click="onPin()"
          :title="pinDate"
          :class="pinClass"
        >{{mdiPin}}</v-icon>
        <v-icon v-if="!isPinnedSutta"
            :title="pinDate"
            @click="onPin()"
            class="ebt-unpinned-sutta">
            {{mdiPinOutline}}
        </v-icon>
        <v-icon :class="linkClass"
          :title="linkUrl"
          @click="onLink()"
        >{{mdiLink}}</v-icon>
      </div>
      <div class="ebt-author" v-if="author">
        {{$t('translatedBy')}} {{author.name}}
      </div>
    </header>
    <div class="ebt-text-container" @click="textClicked($event)">
      <div v-for="seg in segments" :key="seg.scid" 
        :ref="seg.scid"
        :id="seg.scid"
        @click="clickSegment(seg)"
        :class="segmentClass(seg)">
        <div v-if="settings.showId" class="ebt-scid">{{seg.scid}}</div>
        <div v-if="settings.showPali" v-html="seg.pli" class="ebt-text-root"/>
        <div v-if="settings.showTrans" v-html="seg[sutta.lang]" class="ebt-text-trans"/>
      </div>
    </div><!-- ebt-text-container -->
    <footer class="ebt-footer">
        <ebt-tipitaka :js="js" />
    </footer>
  </div>
</template>

<script>
import {
  mdiLink,
  mdiGhost,
  mdiPin,
  mdiPinOutline,
} from '@mdi/js';
import EbtHistory from './ebt-history'
import EbtTipitaka from './ebt-tipitaka'
import Vue from 'vue'

const MS_MINUTE = 60*1000;
const PINNED_MINUTES = 24*60;

export default {
  components: {
    EbtHistory,
    EbtTipitaka,
  },
  props: {
    js: Object,
  },
  data: function(){
    return {
      mdiGhost,
      mdiLink,
      mdiPin,
      mdiPinOutline,
      bilaraWeb: null,
      pinClass: "ebt-pinned-sutta",
      linkClass: "ebt-link-sutta",
    };
  },
  async mounted() {
    this.bilaraWeb = new this.js.BilaraWeb({fetch});
    let that = this;
    this.$nuxt.$on('ebt-load-sutta', (cursor={})=>{
        that.scrollToCursor(cursor)
    });
    console.log(`ebt-sutta.mounted()`);
    that.scrollToCursor(this.cursor);
  },
  methods:{
    onPin() {
      let { $store } = this;
      $store.commit('ebt/pinSutta');
      let that = this;
      Vue.set(that, "pinClass", "ebt-pinned-sutta ebt-bounce1");
      console.log(`onPin`, that.pinClass);
      setTimeout(()=>{
        Vue.set(that, "pinClass", "ebt-pinned-sutta");
      }, 500);
    },
    onLink() {
      let { linkUrl } = this;
      let that = this;
      Vue.set(that, "linkClass", "ebt-link-sutta ebt-bounce1");
      setTimeout(()=>{
        Vue.set(that, "linkClass", "ebt-link-sutta");
      }, 500);
      navigator.clipboard.writeText(linkUrl);
      console.log(`onLink()`, linkUrl);
    },
    scrollToCursor(cursor) {
      let that = this;
      let { $refs } = that;
      cursor && that.$nextTick(()=>{
        let { scid } = cursor;
        if (scid) {
          let elt = $refs[scid];
          elt = elt instanceof Array ? elt[0] : elt;
          elt = elt && elt.$el || elt;
          console.debug(`ebt-sutta.scrollToCursor scid:${scid} elt:`, elt); 
          elt && elt.scrollIntoView({block: "center"});
        } else {
          console.debug(`ebt-sutta.scrollToCursor scid:${scid} (ignored)`);
        }
      });
    },
    clickSegment(seg) {
      let { $store } = this;
      $store.commit('ebt/cursorScid', seg.scid);
      let el = document.getElementById('ebt-play-pause');
      if (el) {
        el.focus && el.focus();
      }
      console.log(`clickSegment()`, seg.scid, el);
    },
    title(n) {
        return this.titles[n] || {};
    },
    textClicked(event) {
      let { sutta, lang, $store } = this;
      if (event.target.className === 'ebt-matched') {
        let text = event.target.innerText;
        let pattern = this.bilaraWeb.exampleOfMatch(text, lang);
        console.log(`textClicked`, event, text, 'example:', pattern, lang);
        if (pattern) {
          $store.dispatch('ebt/loadExample', {pattern, lang});
        }
      }
    },
    segmentClass(seg) {
        let { fullLine } = this.$store.state.ebt.settings;
        let { scid } = seg;
        let { titles, cursor } = this;
        let segClass = "ebt-segment";
        if (/:0.1$/.test(scid)) {
          segClass = `ebt-division`;
        } else if (/:0/.test(scid)) {
          segClass = `ebt-sutta-title`;
        }
        if (!fullLine) {
          segClass += ' ebt-side-by-side';
        }

        return cursor && seg.scid === cursor.scid
            ? `${segClass} ebt-sutta-cursor`
            : `${segClass}`;
    },
  },
  computed: {
    linkUrl() {
      let { sutta } = this;
      let { location } = window;
      let { origin, pathname } = location;
      let pathParts = pathname.split('/');
      let url = `${origin}/${pathParts[1]}/suttas?search=${sutta.sutta_uid}`;
      return url;
    },
    titles() {
      return this.sutta.segments.filter(seg=>/:0/.test(seg.scid));
    },
    segments() {
      //return this.sutta.segments.filter(seg=>!/:0/.test(seg.scid));
      return this.sutta.segments;
    },
    cursor() {
      let { iCursor, history } = this.settings;
      return history[iCursor];
    },
    settings() {
      return this.$store.state.ebt.settings;
    },
    sutta() {
      return this.$store.state.ebt.sutta;
    },
    lang() {
      return this.sutta.lang || 'en';
    },
    author() {
      let { bilaraWeb } = this;
      let authors = bilaraWeb && bilaraWeb.authors || [];
      return authors[this.sutta.translator];
    },
    history() {
      return this.$store.state.ebt.settings.history;
    },
    current() {
        let { history, sutta } = this;
        let { sutta_uid, lang } = sutta;
        let iCur = history.findIndex(h=>
          h.sutta_uid===sutta_uid && h.lang===lang);
        return history[iCur] || sutta;
    },
    pinDate() {
        let { cursor, $t } = this;
        if (cursor == null) {
            return '(no date)';
        }
        let { date } = cursor;
        if (typeof date === 'string') {
            date = new Date(date);
        }

        let d = date.toLocaleDateString();
        let t = date.toLocaleTimeString();
        let tmplt = $t('pinned') || "A_DATE";

        return tmplt.replace(/A_DATE/, `${d} ${t}`);
    },
    isPinnedSutta() {
        let { cursor={} } = this;
        let { date } = cursor;
        if (date == null) {
            return false;
        }
        let minutes = (Date.now() - date)/MS_MINUTE;
        return minutes < PINNED_MINUTES;
    }
  },
}
</script>
<style>
.ebt-link-sutta {
    cursor: pointer;
}
.ebt-unpinned-sutta {
    cursor: pointer;
}
.ebt-pinned-sutta {
  -webkit-transform: rotate(45deg);
  -moz-transform: rotate(45deg);
  -ms-transform: rotate(45deg);
  -o-transform: rotate(45deg);
  transform: rotate(45deg);
}
.ebt-sutta-id {
  font-variant: small-caps;
  text-align: center;
  background-color: transparent;
  margin-bottom: 0.5em;
  font-size: larger;
}
.ebt-bounce1 {
  animation: ebt-bounce 2s;
}
@keyframes ebt-bounce {
  0% {
    transform: scale(0.1);
  }
  60% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
