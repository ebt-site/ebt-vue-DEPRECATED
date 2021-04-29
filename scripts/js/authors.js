#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { logger } = require('log-instance');
const {
    BilaraData,
} = require('scv-bilara');
const APP_DIR = path.join(__dirname, '..', '..');
const API_DIR = path.join(APP_DIR, 'api');
const SRC_DIR = path.join(APP_DIR, 'src');
const AUTHORS = path.join(API_DIR, 'authors.json');

logger.logLevel = 'info';

(async function(){ try {
    let bilaraData = new BilaraData({
        name: 'ebt-data',
        branch: 'published',
    });
    await bilaraData.initialize();

    let authors = bilaraData.authors;
    await fs.promises.writeFile(AUTHORS, JSON.stringify(authors, null, '\t'));
} catch(e) {
    logger.warn(e);
}})();
