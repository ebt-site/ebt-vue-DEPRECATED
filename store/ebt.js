const {
    BilaraWeb,
    Settings,
} = require('../src/index');
const examples = require('../api/examples.json');

var bilaraWeb;

const DEFAULT = {
    get sutta() { return {
        titles: ['...'],
        lang: 'en',
        translator: '...',
        sutta_uid: null,
        segments: [
            {scid: null, pli: '...', en: '...'}
        ],
    }}
}

export const state = () => ({
    search: '',
    searchResults: {},
    searchError: null,
    settings: Object.assign({}, new Settings()),
    sutta: DEFAULT.sutta,
    examples,
    voices: [],
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
    cursorScid(state, value) {
        let { sutta, settings } = state;
        let { history } = settings;
        let { sutta_uid, lang, translator, } = sutta;
        let iCursor = history.findIndex(h=>h.sutta_uid===sutta_uid && h.lang===lang);
        if (iCursor < 0) {
            iCursor = history.findIndex(h=>h.sutta_uid===sutta_uid);
            console.warn(`$store.state.ebt.cursorScid ${sutta_uid}/${lang} not found.`,
                `Substituting iCursor:${iCursor}`, history[iCursor]);
        }
        if (iCursor < 0) {
            console.warn(`$store.state.ebt.cursorScid mutation ignored.`,
                `Cursor not found for scid:${value} lang:${lang} history:`, 
                history);
            return;
        }
        let cursor = history[iCursor];
        let minutes = (Date.now() - cursor.date)/MS_MINUTE;
        let addToWorkingMemory = WORKING_MINUTES < minutes;
        if (cursor.scid !== value) {
            cursor.scid = value;
            if (addToWorkingMemory) {
                console.log(`$store.state.ebt.cursorScid() addToWorkingMemory`, 
                    {value, minutes, cursor}); 
                cursor.date = new Date();
                history.sort((a,b)=>a.date-b.date);
                iCursor = history.length-1;
                cursor = history[iCursor];
            }
        }
        settings.iCursor = iCursor;
        cursor.lang = lang;
        cursor.translator = translator;
        console.log(`$store.state.ebt.cursorScid()`, {iCursor, cursor});
    },
    searchError(state, error=null) {
        state.searchError = error;
        console.debug(`$store.state.ebt.searchError:`, error);
    },
    sutta(state, sutta) {
        let { settings } = state;
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
        Object.assign(state.sutta, DEFAULT.sutta, sutta);
        console.debug(`$store.state.ebt.sutta:`, {sutta, settings});
    },
    suttaRef(state, value) {
        let { settings } = state;
        let { sutta_uid, lang, updateHistory=true } = value;
        Object.assign(state.sutta, DEFAULT.sutta, {sutta_uid, lang});
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
    },
    searchResults(state, value) {
        state.searchResults = value;
        let mlDocs = value && value.mlDocs;
        if (mlDocs instanceof Array) {
            mlDocs.forEach(mld=>(mld.showDetails = false));
        }
        console.log(`$store.state.ebt.searchResults:`, value);
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
        let { sutta_uid, lang=settings.lang, updateHistory } = payload;
        context.commit('suttaRef', {sutta_uid, lang, updateHistory});
        bilaraWeb = bilaraWeb || new BilaraWeb({fetch});
        let sutta = await bilaraWeb.loadSutta({sutta_uid, lang});
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
        let { search } = $nuxt.$route.query;
        let newSearch = `${sutta_uid}/${lang}`;
        if (search !== newSearch) {
            $nuxt.$router.push({
                path: 'suttas',
                query: {
                    search: `${sutta_uid}/${lang}`,
                },
            });
            console.log(`$store.state.ebt.store.loadSutta`, window.location);
        }
        context.commit('sutta', sutta);
        let cursor = settings.history[settings.iCursor];
        let scid = payload.scid || cursor.sutta_uid===payload.sutta_uid && cursor.scid;
        $nuxt.$emit('ebt-load-sutta', Object.assign({scid}, payload));
    },
    async loadExample ({commit, state}, payload) {
        let { pattern, lang=state.settings.lang } = payload;
        bilaraWeb = bilaraWeb || new BilaraWeb({fetch});
        let value = pattern && await bilaraWeb.find({ pattern, lang, });
        if (value) {
            value.mlDocs.forEach(mld=>{
                mld.segments = Object.keys(mld.segMap).map(scid=>mld.segMap[scid]);
            });
            commit('searchResults', value);
            commit('search', pattern);
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
