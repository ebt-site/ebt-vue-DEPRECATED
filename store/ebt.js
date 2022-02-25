const {
    BilaraWeb,
    Settings,
} = require('../src/index');
const examples = require('scv-bilara/src/examples.json');
const { PaliHyphenator } = require('js-ebt');
import Vue from "vue";

var bilaraWeb;
const WAITING = '\u231B...';

export const state = () => ({
    processing: null,
    search: '',
    searchResults: {},
    searchError: null,
    settings: Object.assign({}, new Settings()),
    sutta: null,
    examples,
    voices: [],
    hyphenator: new PaliHyphenator({
      minWord: 5,
      maxWord: 20,
    }),
})

const MS_MINUTE = 60 * 1000;
const WORKING_MINUTES = 24*60;

export const mutations = {
    pinSutta(state, value=new Date()) {
        let { sutta, settings={} } = state;
        let { iCursor, history } = settings;
        if (iCursor != null) {
            let cursor = settings.history[iCursor];
            cursor.date = value;
            history.sort((a,b)=>a.date-b.date);
            settings.iCursor = history.length - 1;
            console.log(`$store.state.ebt.pinSutta()`, history);
        }
    },
    selectSegment(state, scid) {
        if (scid == null) {
            console.warn(`$store.state.ebt.selectSegment scid:${scid}`);
            return;
        }
        let { sutta, settings } = state;
        let { history } = settings;
        let { sutta_uid, lang, translator, } = sutta;
        let iCursor = history.findIndex(h=>h.sutta_uid===sutta_uid && h.lang===lang);
        if (iCursor < 0) {
            iCursor = history.findIndex(h=>h.sutta_uid===sutta_uid);
            settings.iCursor = iCursor;
            console.warn(`$store.state.ebt.selectSegment ${sutta_uid}/${lang} not found.`,
                `Substituting iCursor:${iCursor}`, history[iCursor]);
        }
        if (iCursor < 0) {
            console.warn(`$store.state.ebt.selectSegment mutation ignored.`,
                `Cursor not found for scid:${scid} lang:${lang} history:`, 
                history);
            return;
        }
        let cursor = history[iCursor];
        cursor.lang = lang;
        cursor.translator = translator;

        let minutes = (Date.now() - cursor.date)/MS_MINUTE;
        let inWorkingMemory = true; // minutes <= WORKING_MINUTES;
        cursor.scid = scid;
        if (inWorkingMemory) {
            console.debug(`$store.state.ebt.selectSegment scid =>`,  scid);
        } else {
            console.debug(`$store.state.ebt.selectSegment add to working memory`, 
                {scid, minutes, cursor}); 
            cursor.date = new Date();
            history.sort((a,b)=>a.date-b.date);
            iCursor = history.length-1;
            cursor = history[iCursor];
            settings.iCursor = iCursor;
        }

        let [sid, segnum] = scid.split(':');
        console.log({scid, sutta_uid});
        if (sid !== sutta_uid) {
          sutta_uid = sid;
        }
        let { search } = BilaraWeb.decodeHash(window.location.hash);;
        window.location.hash = BilaraWeb.encodeHash({
            sutta_uid,
            lang,
            translator,
            segnum,
            search,
        });
        Vue.nextTick(()=>{
            console.debug(`$store.state.ebt.selectSegment`,
                `=> ebt-segment-selected({${scid}})` );
            $nuxt.$emit('ebt-segment-selected', {scid}); 
        });
    },
    searchError(state, error=null) {
        state.searchError = error;
        console.debug(`$store.state.ebt.searchError:`, error);
    },
    sutta(state, sutta) {
        let { settings, hyphenator } = state;
        let { history } = settings;
        let { sutta_uid, lang } = sutta;
        let iCursor = history.findIndex(h=>h.sutta_uid===sutta_uid && h.lang===lang);
        let cursor = history[iCursor];
        if (cursor) {
            cursor.scid = cursor.scid || sutta.segments[0].scid;
            cursor.translator = sutta.translator;
            cursor.lang = lang;
            settings.iCursor = iCursor;
        }
        state.sutta = sutta;
        sutta.segments.forEach(seg=>{
          let pli = seg.pli;
          if (pli) {
            let words = pli.split(' ').map(word=>hyphenator.hyphenate(word));
            seg.pli = words.join(' ');
          }
        });
        console.log(`dbg sutta`, sutta.segments.length);
        console.debug(`$store.state.ebt.sutta:`, {sutta, settings});
    },
    processing(state, value) {
        if (value) {
            state.processing = {
                value,
                started: new Date(),
            };
            console.log(`$store.state.ebt.processing`, state.processing);
        } else {
            let elapsed = state.processing && state.processing.value || 0;
            console.log(`$store.state.ebt.processing elapsed:${elapsed}`);
            state.processing = null;
        }
    },
    suttaRef(state, value) {
        let { settings } = state;
        let { sutta_uid, lang, updateHistory=true } = value;
        Object.assign(state.sutta, {sutta_uid, lang});
        if (updateHistory) {
            let { history } = settings;
            let iCursor = history.findIndex(h=>h.sutta_uid===sutta_uid && h.lang===lang);
            let cursor = history[iCursor];
            if (!cursor) {
                let date = new Date();
                let { scid } = state.sutta.segments[0];
                let { translator } = state.sutta;
                cursor = { sutta_uid, date, lang, translator, scid};
                history.push(cursor);
                settings.iCursor = history.length - 1;
            }
            if (cursor && !cursor.scid) {
                cursor.scid = state.sutta.segments[0].scid;
                cursor.lang = state.sutta.lang;
                cursor.translator = state.sutta.translator;
            }
            history.sort((a,b)=>a.date-b.date);
        }
        console.debug(`$store.state.ebt.suttaRef:`, {value, settings}); 
    },
    search(state, value) {
        if (value !== state.search) {
            console.debug(`$store.state.ebt.search:`, value);
            state.search = value;
        }
        let { 
            sutta_uid, lang, translator, segnum, search 
        } = BilaraWeb.decodeHash(window.location.hash);
        if (search !== value) {
            search = value;
            window.location.hash = BilaraWeb.encodeHash({
                sutta_uid, lang, translator, segnum, search, 
            });
            $nuxt.$emit('ebt-search', search);
        }
    },
    searchResults(state, value) {
        state.searchResults = value;
        let mlDocs = value && value.mlDocs;
        if (mlDocs instanceof Array) {
            mlDocs.forEach(mld=>(mld.showDetails = false));
        }
        console.debug(`$store.state.ebt.searchResults:`, value);
    },
    settings(state, value) {
        Object.assign(state.settings, value);
        value.showTrans === false && (state.settings.showPali = true);
        value.showPali === false && (state.settings.showTrans = true);
        value.saveSettings && (state.settings.saveSettingsExamples = false);
        value.saveSettingsExamples && (state.settings.saveSettings = false);
        console.log(`$store.state.ebt.settings:`, state.settings);
    },
    voices(state, value) {
        Object.assign(state.voices, value);
        console.debug(`$store.state.ebt.voices:`, value);
    },
    examples(state, value) {
        Object.assign(state.examples, value);
        console.debug(`$store.state.ebt.examples:`, value);
    },
}

export const actions = {
    async loadSutta (context, payload) {
        let settings = context.state.settings;
        let { showEnglish } = settings;
        let { hash, query, path } = $nuxt.$route;
        let { 
            sutta_uid, 
            lang=settings.lang, 
            translator,
            updateHistory,
            selectSegment=hash && hash.length>1,
        } = payload;

        let msg = this.$t('loadingSutta')
            .replace(/A_SUTTA/, `${sutta_uid}/${lang}`);
        context.commit('processing', msg);
        bilaraWeb = bilaraWeb || new BilaraWeb({fetch});
        let parsed = bilaraWeb.parseSuttaRef(sutta_uid, lang, translator);
        let sutta;
        let refLang = showEnglish ? 'en' : undefined;
        let useSuttaRef = 0;
        if (useSUttaRef) {
          sutta = await bilaraWeb.loadSuttaRef(sutta_uid, refLang);
        } else {
          sutta = await bilaraWeb.loadSutta({
              sutta_uid:parsed.sutta_uid, 
              lang,
              showEnglish,
          });
        }
        context.commit('processing', null);
        if (sutta == null) {
            console.log(`$store.state.ebt.loadSutta(${sutta_uid}/${lang})`,
                `substituting ${sutta_uid}/en`);
            lang = 'en';
            sutta = await bilaraWeb.loadSutta({sutta_uid, lang});
        }
        if (sutta == null) {
            console.error(`$store.state.ebt.loadSutta(${sutta_uid}/${lang})`,
                `=> not found`);
            return;
        }
        if (path.startsWith('/sutta')) {
            let translator = sutta.translator;
            await context.commit('sutta', sutta);
            await context.commit('suttaRef', {sutta_uid, lang, updateHistory});
            let cursor = settings.history[settings.iCursor];
            let scid = payload.scid || 
                cursor.sutta_uid===payload.sutta_uid && cursor.scid;
            let segnum = scid.split(':').pop();
            Vue.nextTick(()=>{
                console.log(`$store.state.ebt.loadSutta()`, payload);
                $nuxt.$emit('ebt-load-sutta', Object.assign({}, payload, {scid}));
                selectSegment && context.commit('selectSegment', scid);
            });
        } else {
            console.error(`$store.state.ebt.loadSutta UNEXPECTED path:${path}`);
        }
    },
    async loadExample ({commit, state}, payload) {
        let { pattern, lang=state.settings.lang } = payload;
        window.location.hash = '';
        bilaraWeb = bilaraWeb || new BilaraWeb({fetch});
        let value = pattern && await bilaraWeb.find({ pattern, lang, });
        if (value) {
            value.mlDocs.forEach(mld=>{
                mld.segments = Object.keys(mld.segMap).map(scid=>mld.segMap[scid]);
            });
            commit('searchResults', value);
            commit('search', pattern);
            commit('searchError', null);
            $nuxt.$emit('ebt-load-example', payload);
        } else if (pattern) {
            let error = this.$t('notFound').replace('A_PATTERN', pattern);
            commit('searchError', error);
            commit('search', pattern);
        }
    },
    async loadVoices({state, commit}) {
        bilaraWeb = bilaraWeb || new BilaraWeb({fetch});
        let voices = await bilaraWeb.voices();
        commit('voices', voices);
    },
}
