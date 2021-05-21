<template>
  <div class="ebt-nav-cursor">
    <div class="ebt-audio-bottom">
      <v-btn icon 
        id="ebt-play-pause"
        ref="ebt-play-pause"
        @click="clickPlayPause()"
        :aria-label="$t('ariaPlay')"
        class="ebt-icon-btn" >
        <v-icon>{{playPauseIcon}}</v-icon>
      </v-btn>
    </div>
    <v-icon class="mr3" v-if="audioStarted" small>{{mdiVolumeHigh}}</v-icon>
    <v-icon v-if="audioStarted && playToEnd" small>{{mdiInfinity}}</v-icon>
    <v-icon v-if="audioStarted && !playToEnd" small>{{mdiNumeric1}}</v-icon>

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
  mdiNumeric1,
  mdiVolumeHigh,
  mdiVoicemail,
  mdiInfinity,
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

const RE_NOAUDIO = /ac87a767581710d97b8bf190fd5e109c/;
const URL_NOAUDIO = "/audio/383542__alixgaus__turn-page.mp3"

export default {
  components: {
    EbtHistory,
  },
  props: {
    js: Object,
  },
  data: function(){
    return {
      mdiNumeric1,
      mdiVolumeHigh,
      mdiVoicemail,
      mdiInfinity,
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
      audioScid: null,
      playPauseIcon: mdiAccountVoice,
      playToEnd: false,
    };
  },
  async mounted() {
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
        if (RE_NOAUDIO.test(url)) {
          url = URL_NOAUDIO;
        }
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
          console.log(`createAudioSource() no audio`, scid);
          let urlNoAudio = "/audio/383542__alixgaus__turn-page.mp3"
          return this.fetchAudioSource(urlNoAudio);
        }
        return null;
      }
    },
    async clickPlayPause() {
      let { audioStarted, playPauseIcon, $refs } = this;
      let playPause = $refs['ebt-play-pause'];
      playPause && playPause.$el.focus && playPause.$el.focus();
      if (audioStarted) {
        if (playPauseIcon === mdiPause) {
          Vue.set(this, "playToEnd", false);
          this.clickPause();
        } else {
          Vue.set(this, "playToEnd", true);
          console.log('clickPlayPause() playToEnd');
        }
      } else {
        Vue.set(this, "audioStarted", new Date());
        Vue.set(this, "playToEnd", false);
        this.clickPlay();
      }
    },
    async clickPause() {
      let { audioSource, playToEnd } = this;
      if (audioSource) {
        Vue.set(this, "audioStarted", null); // paused
        console.log(`clickPause() stop audio`);
        audioSource.stop();
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
          audioSource.onended = evt => {
            let { audioStarted, playToEnd } = that;
            if (playToEnd) {
              console.log(`ebt-cursor.clickPlay().audioSource.onended() playToEnd`);
              if (!audioStarted) {
                Vue.set(that, "playToEnd", false);
              }
              that.nextSegment();
            } else if (!audioStarted) { // paused
              console.log(`ebt-cursor.clickPlay().audioSource.onended() paused`);
              Vue.set(that, "playPauseIcon", mdiAccountVoice);
              Vue.set(that, "audioSource", null);
            } else { // normal end
              console.log(`ebt-cursor.clickPlay().audioSource.onended() segment end`);
              Vue.set(that, "audioStarted", null);
              Vue.set(that, "playPauseIcon", mdiAccountVoice);
              Vue.set(that, "audioSource", null);
              that.nextSegment();
            }
          };
          console.log(`ebt-cursor.clickPlay()`, {scid, lang, vroot, vtrans});
          Vue.set(this, "audioScid", scid);
          audioSource.start();
          this.updatePlayPauseIcon();
      } else {
        console.log(`ebt-cursor.clickPlay() (no audio)`, {scid, lang, vroot, vtrans});
        Vue.set(that, "audioStarted", null);
      }
    },
    nextSegment() {
      let { audioScid, sutta, cursor, $store, playToEnd } = this;
      let segments = sutta && sutta.segments || [];
      let iAudioSegment = segments.findIndex(s=>s.scid === audioScid);
      let iCursorSegment = segments.findIndex(s=>s.scid === cursor.scid);
      let stop = iCursorSegment < 0 || iAudioSegment < 0;
      if (!stop) {
        let iNextSeg = audioScid === cursor.scid
          ? iAudioSegment + 1
          : iCursorSegment;
        let nextSeg = segments[iNextSeg];
        let nextScid = nextSeg && nextSeg.scid;
        if (nextScid) {
          console.log(`nextSegment() =>`, nextScid);
          $store.commit('ebt/cursorScid', nextScid);
          let elt = document.getElementById(nextScid);
          elt && elt.scrollIntoView({
            block: "center",
            behavior: "smooth",
          });
          if (playToEnd) {
            this.clickPlay();
          }
        } else {
          stop = true;
        }
      } 
      if (stop) {
        Vue.set(this, "playToEnd", false);
        Vue.set(this, "audioStarted", null);
        Vue.set(this, "audioSource", null);
        Vue.set(this, "playPauseIcon", mdiAccountVoice);
        console.log("nextSegment() playback completed");
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
    updatePlayPauseIcon() {
      let that = this;
      let { playToEnd } = this;

      if (playToEnd) {
        console.log(`updatePlayPauseIcon() pause (playToEnd)`);
        Vue.set(this, "playPauseIcon", mdiPause);
      } else {
        Vue.set(this, "playPauseIcon", mdiInfinity);
        let MS_CONTINUOUS_PLAY = 1000;
        setTimeout(()=>{
          let { audioStarted } = this;
          let playPauseIcon = audioStarted ? mdiPause : mdiAccountVoice;
          if (playPauseIcon !== this.playPauseIcon) {
            Vue.set(this, "playPauseIcon", playPauseIcon);
            console.log(`updatePlayPauseIcon() pause (play segment)`);
          } else {
            console.log(`updatePlayPauseIcon() accountVoice`);
          }
        }, MS_CONTINUOUS_PLAY);
      }
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
