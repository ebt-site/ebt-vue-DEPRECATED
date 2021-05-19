<template>
  <div class="ebt-nav-cursor">
    <div class="ebt-audio-bottom">
      <v-btn icon 
        ref="ebt-play-pause"
        @click="clickPlayPause()"
        :aria-label="$t('ariaPlay')"
        class="ebt-icon-btn" >
        <v-icon>{{playPauseIcon}}</v-icon>
      </v-btn>
    </div>

    <v-spacer/>
    <ebt-history :js="js" >
    </ebt-history>
    <v-spacer/>

    <div class="ebt-page-bottom" >
      <v-btn icon dark
          @click="clickPageTop()"
          :aria-label="$t('ariaPageTop')"
          class="ebt-icon-btn" >
          <v-icon >{{mdiChevronUp}}</v-icon>
      </v-btn>
      <v-btn icon dark
          @click="clickPageBottom()"
          :aria-label="$t('ariaPageBottom')"
          class="ebt-icon-btn" >
          <v-icon >{{mdiChevronDown}}</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import {
  mdiAccountVoice,
  mdiChevronDown,
  mdiChevronLeft,
  mdiChevronRight,
  mdiChevronUp,
  mdiPause,
  mdiPlay,
  mdiSkipNext,
  mdiSkipPrevious,
} from '@mdi/js';
const {
  Settings,
  BilaraWeb,
} = require('../src/index');
class UrlError extends Error {
  constructor(message, url) {
    super(message);
    this.url = url;
  }
}
import EbtHistory from './ebt-history';

export default {
  components: {
    EbtHistory,
  },
  props: {
    js: Object,
  },
  data: function(){
    return {
      mdiChevronLeft,
      mdiChevronRight,
      mdiChevronUp,
      mdiChevronDown,
      mdiAccountVoice,
      mdiPlay,
      mdiPause,
      mdiSkipNext,
      mdiSkipPrevious,
      audioSource: null,
      bilaraWeb: null,
      audioStarted: null,
    };
  },
  async mounted() {
    /*
    let { $el, $refs, cursor } = this;
    this.$nuxt.$on('ebt-load-sutta', (payload={})=>{
      let { scid } = payload;
      console.log(`ebt-cursor.mounted.ebt-load-sutta`, payload);
      if (scid) {
        let elt = document.getElementById(scid);
        console.log(`ebt-cursor.mounted.ebt-load-sutta elt:`, elt);
        elt && elt.scrollIntoView({block: "center"});
      }
    });
    */
    this.bilaraWeb = new this.js.BilaraWeb({fetch});
  },
  methods:{
    async fetchAudioSource(...urls) {
      urls = urls.filter(url=>!!url);
      let audioContext = new AudioContext();
      let audioSource = audioContext.createBufferSource();
      let urlBuffers = [];
      let urlAudio = [];
      let numberOfChannels = 2;
      let length = 0;
      let sampleRate = 48000;
      for (let i = 0; i < urls.length; i++) {
        let url = urls[i];
        if (url) {
          let res = await fetch(url);
          if (!res.ok) {
            throw new UrlError(`fetchAudioSource() no audio:`, url);
          }
          urlBuffers.push(res.arrayBuffer());
        }
      }
      for (let i = 0; i < urlBuffers.length; i++) {
        urlAudio.push(audioContext.decodeAudioData(await urlBuffers[i]));
      }
      for (let i = 0; i < urlAudio.length; i++) {
        let ua = urlAudio[i] = await urlAudio[i];
        numberOfChannels = Math.min(numberOfChannels, ua.numberOfChannels);
        length += ua.length;
        sampleRate = Math.max(sampleRate, ua.sampleRate);
      }

      let audioBuffer = new AudioBuffer({length, numberOfChannels, sampleRate})
      for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
        let offset = 0;
        let channelData = new Float32Array(length);
        for (let i = 0; i < urlAudio.length; i++) {
          let ua = urlAudio[i];
          channelData.set(ua.getChannelData(channelNumber), offset);
          offset += ua.length;
        }
        audioBuffer.copyToChannel(channelData, channelNumber);
      }

      audioSource.buffer = audioBuffer;
      audioSource.connect(audioContext.destination);
      return audioSource;
    },
    clickPause() {
      let { audioSource } = this;
      audioSource && audioSource.stop();
    },
    async createAudioSource({vtrans, vroot}) {
      let {
        bell,
        bilaraWeb,
        cursor,
        settings,
      } = this;
      let { scid, lang, translator } = cursor;
      try {
        var audioUrls = await bilaraWeb.segmentAudioUrls({
          scid,
          lang,
          translator,
          vtrans,
          vroot,
        });
        var urlPali = settings.showPali && audioUrls.pli;
        var urlTrans = settings.showTrans && audioUrls[lang];

        return await this.fetchAudioSource(urlPali, urlTrans);
      } catch(e) {
        if (e.url === urlPali && vroot.toLowerCase() !== 'aditi') {
          let vrootAlt = 'aditi';
          console.log(`createAudioSource() ${vroot} unavailable`,
            `(trying ${vtrans}/${vrootAlt})`);
          vroot = vrootAlt;
          return this.createAudioSource({ vtrans, vroot, });
        } else if (e.url === urlTrans && vtrans.toLowerCase() !== 'amy') {
          let vtransAlt = 'amy';
          console.log(`createAudioSource() ${vtrans} unavailable`,
            `(trying ${vtransAlt}/${vroot})`);
          vtrans = vtransAlt;
          return this.createAudioSource({ vtrans, vroot, });
        } else {
          console.error(`createAudioSource() no audio`, audioUrls, e);
        }
        return null;
      }
    },
    async clickPlayPause() {
      let { audioStarted, $refs } = this;
      let playPause = $refs['ebt-play-pause'];
      playPause && playPause.$el.focus && playPause.$el.focus();
      if (audioStarted) {
        this.clickPause();
      } else {
        this.clickPlay();
      }
    },
    async clickPlay() {
      let {
        bell,
        bilaraWeb,
        cursor,
        settings,
        $store,
      } = this;
      let { scid, lang, translator } = cursor;
      let vtrans = lang === settings.lang
        ? settings.vnameTrans
        : bilaraWeb.langDefaultVoice(lang).name;
      let vroot = settings.vnameRoot;
      console.log(`clickPlay()`,
        `sutta:${scid}/${lang}/${translator}`,
        `narrators:${vroot}/${vtrans}`);
      let that = this;
      let audioSource = await this.createAudioSource({ vtrans, vroot, });
      Vue.set(that, "audioSource", audioSource);
      if (audioSource) {
          Vue.set(that, "audioStarted", new Date());
          audioSource.onended = evt => {
            Vue.set(that, "audioStarted", null);
            Vue.set(that, "audioSource", null);
            that.nextSegment();
          };
          console.log(`ebt-cursor.clickPlay()`, {scid, lang, vroot, vtrans});
          audioSource.start();
      } else {
        console.log(`ebt-cursor.clickPlay() (no audio)`, {scid, lang, vroot, vtrans});
        Vue.set(that, "audioStarted", null);
      }
    },
    nextSegment() {
      let { sutta, cursor, $store } = this;
      let segments = sutta && sutta.segments || [];
      let iSegment = segments.findIndex(s=>s.scid === cursor.scid);
      if (iSegment >= 0) {
        let nextSeg = segments[iSegment+1];
        let nextScid = nextSeg && nextSeg.scid;
        console.log(`nextScid`, nextScid);
        nextScid && $store.commit('ebt/cursorScid', nextScid);
        let elt = document.getElementById(nextScid);
        elt && elt.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }
    },
    clickPageTop() {
        let elt = document.getElementById("ebt-search-field");
        if (elt) {
            let refSearchAuto = elt.__vue__.$refs.refSearchAuto;
            let input = refSearchAuto.$refs.input;
            this.$nextTick(()=>{
                elt.scrollIntoView({block: "center"});
                input.focus();
            });
        }
    },
    clickPageBottom() {
        let elt = document.getElementById("ebt-tipitaka");
        console.log('clickPageBottom', {elt});
        elt && this.$nextTick(()=>{
            elt.scrollIntoView({block: "center"});
        });
    },
  },
  computed: {
    cursorLabel() {
        let { scid='--', lang='--' } = this.cursor || {};
        return `${scid}/${lang}`;
    },
    cursor() {
        let { iCursor, history } = this.settings;
        return history && history[iCursor];
    },
    current() {
        let { history, sutta } = this;
        let { sutta_uid, lang } = sutta;
        let iCur = history.findIndex(h=>h.sutta_uid===sutta_uid && h.lang===lang);
        return history[iCur] || sutta;
    },
    sutta() {
        return this.$store.state.ebt.sutta;
    },
    segments() {
      let { sutta } = this;
      return sutta && sutta.segments || [];
    },
    history() {
      return this.$store.state.ebt.settings.history;
    },
    bell() {
      let { ips } = this;
      return ips && Settings.IPS_CHOICES[ips];
    },
    ips() {
      return this.settings?.ips; 
    },
    playPauseIcon() {
      return this.audioStarted ? mdiPause : mdiAccountVoice;
    },
    settings() {
      return this.$store.state.ebt.settings; 
    },
  },
}
</script>
<style>
.ebt-nav-cursor {
  display: flex;
  flex-flow: row noWrap;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background-color: var(--ebt-background-color-dark);
}
.ebt-audio-bottom {
  position: absolute;
  let: 0;
  bottom: calc(var(--ebt-bottom-navigation-height)*1);
  background-color: var(--ebt-focus-background-color-dark) !important;
  border-top-right-radius: 0.5em !important;
  display: flex;
  flex-flow: row;
  padding: 2pt;
  padding-left: 1em;
  padding-right: 1em;
}
.ebt-page-bottom {
  position: absolute;
  right: 0;
  bottom: calc(var(--ebt-bottom-navigation-height)*1);
  background-color: var(--ebt-focus-background-color-dark) !important;
  border-top-left-radius: 0.5em !important;
  display: flex;
  flex-flow: row;
  padding: 2pt;
}
</style>
