import 'reflect-metadata';
import { parse } from 'papaparse';
import { createReadStream } from 'fs';
import { Connection, createConnection } from 'typeorm';
import { Area } from './entity/Area';

interface Author {
    name: string;
    readonly dept: string;
    readonly area: string;
    readonly subarea: string;
    readonly count: string;
    readonly adjustedcount: string;
    readonly year: number;
};

interface CountryInfo {
    readonly institution: string;
    readonly region: 'us' | 'europe' | 'ca' | 'northamerica' | 'australasia' | 'southamerica' | 'asia' | 'africa' | 'world';
    readonly countryabbrv: string;
};

interface AreaType {
    readonly area: string;
    readonly abbrv: string;
};

interface AreaMap {
    readonly area: string;
    readonly title: string;
};

const authorinfoFile = './src/data/generated-author-info.csv';
const countryinfoFile = './src/data/country-info.csv';
const areainfoFile = './src/data/area.csv';

const startyear = 2011;
const endyear = 2021;

const nextTier: { [key: string]: boolean } =
{
    'ase': true,
    'issta': true,
    'icde': true,
    'pods': true,
    'hpca': true,
    'ndss': true, // for now
    'pets': true,
    'eurosys': true,
    'fast': true,
    'usenixatc': true,
    'icfp': true,
    'oopsla': true
};

const parentMap: { [key: string]: string } =
{
    'aaai': 'ai',
    'ijcai': 'ai',
    'cvpr': 'vision',
    'eccv': 'vision',
    'iccv': 'vision',
    'icml': 'mlmining',
    'kdd': 'mlmining',
    'nips': 'mlmining',
    'acl': 'nlp',
    'emnlp': 'nlp',
    'naacl': 'nlp',
    'sigir': 'ir',
    'www': 'ir',
    'asplos': 'arch',
    'isca': 'arch',
    'micro': 'arch',
    'hpca': 'arch', // next tier
    'ccs': 'sec',
    'oakland': 'sec',
    'usenixsec': 'sec',
    'ndss': 'sec', // next tier (for now)
    'pets': 'sec', // next tier
    'vldb': 'mod',
    'sigmod': 'mod',
    'icde': 'mod', // next tier
    'pods': 'mod',
    'dac': 'da',
    'iccad': 'da',
    'emsoft': 'bed',
    'rtas': 'bed',
    'rtss': 'bed',
    'sc': 'hpc',
    'hpdc': 'hpc',
    'ics': 'hpc',
    'mobicom': 'mobile',
    'mobisys': 'mobile',
    'sensys': 'mobile',
    'imc': 'metrics',
    'sigmetrics': 'metrics',
    'osdi': 'ops',
    'sosp': 'ops',
    'eurosys': 'ops',    // next tier (see below)
    'fast': 'ops',       // next tier
    'usenixatc': 'ops',  // next tier
    'popl': 'plan',
    'pldi': 'plan',
    'oopsla': 'plan', // next tier
    'icfp': 'plan',   // next tier
    'fse': 'soft',
    'icse': 'soft',
    'ase': 'soft',    // next tier
    'issta': 'soft',  // next tier
    'nsdi': 'comm',
    'sigcomm': 'comm',
    'siggraph': 'graph',
    'siggraph-asia': 'graph',
    'focs': 'act',
    'soda': 'act',
    'stoc': 'act',
    'crypto': 'crypt',
    'eurocrypt': 'crypt',
    'cav': 'log',
    'lics': 'log',
    'ismb': 'bio',
    'recomb': 'bio',
    'ec': 'ecom',
    'wine': 'ecom',
    'chiconf': 'chi',
    'ubicomp': 'chi',
    'uist': 'chi',
    'icra': 'robotics',
    'iros': 'robotics',
    'rss': 'robotics',
    'vis': 'visualization',
    'vr': 'visualization'
};

const areaMap: AreaMap[] =
[{ area: 'ai', title: 'AI' },
{ area: 'aaai', title: 'AI' },
{ area: 'ijcai', title: 'AI' },
{ area: 'vision', title: 'Vision' },
{ area: 'cvpr', title: 'Vision' },
{ area: 'eccv', title: 'Vision' },
{ area: 'iccv', title: 'Vision' },
{ area: 'mlmining', title: 'ML' },
{ area: 'icml', title: 'ML' },
{ area: 'kdd', title: 'ML' },
{ area: 'nips', title: 'ML' },
{ area: 'nlp', title: 'NLP' },
{ area: 'acl', title: 'NLP' },
{ area: 'emnlp', title: 'NLP' },
{ area: 'naacl', title: 'NLP' },
{ area: 'ir', title: 'Web+IR' },
{ area: 'sigir', title: 'Web+IR' },
{ area: 'www', title: 'Web+IR' },
{ area: 'arch', title: 'Arch' },
{ area: 'asplos', title: 'Arch' },
{ area: 'isca', title: 'Arch' },
{ area: 'micro', title: 'Arch' },
{ area: 'hpca', title: 'Arch' },
{ area: 'comm', title: 'Networks' },
{ area: 'sigcomm', title: 'Networks' },
{ area: 'nsdi', title: 'Networks' },
{ area: 'sec', title: 'Security' },
{ area: 'ccs', title: 'Security' },
{ area: 'oakland', title: 'Security' },
{ area: 'usenixsec', title: 'Security' },
{ area: 'ndss', title: 'Security' },
{ area: 'pets', title: 'Security' },
{ area: 'mod', title: 'DB' },
{ area: 'sigmod', title: 'DB' },
{ area: 'vldb', title: 'DB' },
{ area: 'icde', title: 'DB' }, // next tier
{ area: 'pods', title: 'DB' }, // next tier
{ area: 'hpc', title: 'HPC' },
{ area: 'sc', title: 'HPC' },
{ area: 'hpdc', title: 'HPC' },
{ area: 'ics', title: 'HPC' },
{ area: 'mobile', title: 'Mobile' },
{ area: 'mobicom', title: 'Mobile' },
{ area: 'mobisys', title: 'Mobile' },
{ area: 'sensys', title: 'Mobile' },
{ area: 'metrics', title: 'Metrics' },
{ area: 'imc', title: 'Metrics' },
{ area: 'sigmetrics', title: 'Metrics' },
{ area: 'ops', title: 'OS' },
{ area: 'sosp', title: 'OS' },
{ area: 'osdi', title: 'OS' },
{ area: 'fast', title: 'OS' },   // next tier
{ area: 'usenixatc', title: 'OS' },   // next tier
{ area: 'eurosys', title: 'OS' },
{ area: 'pldi', title: 'PL' },
{ area: 'popl', title: 'PL' },
{ area: 'icfp', title: 'PL' },   // next tier
{ area: 'oopsla', title: 'PL' }, // next tier
{ area: 'plan', title: 'PL' },
{ area: 'soft', title: 'SE' },
{ area: 'fse', title: 'SE' },
{ area: 'icse', title: 'SE' },
{ area: 'ase', title: 'SE' },    // next tier
{ area: 'issta', title: 'SE' },  // next tier
{ area: 'act', title: 'Theory' },
{ area: 'focs', title: 'Theory' },
{ area: 'soda', title: 'Theory' },
{ area: 'stoc', title: 'Theory' },
{ area: 'crypt', title: 'Crypto' },
{ area: 'crypto', title: 'Crypto' },
{ area: 'eurocrypt', title: 'Crypto' },
{ area: 'log', title: 'Logic' },
{ area: 'cav', title: 'Logic' },
{ area: 'lics', title: 'Logic' },
{ area: 'graph', title: 'Graphics' },
{ area: 'siggraph', title: 'Graphics' },
{ area: 'siggraph-asia', title: 'Graphics' },
{ area: 'chi', title: 'HCI' },
{ area: 'chiconf', title: 'HCI' },
{ area: 'ubicomp', title: 'HCI' },
{ area: 'uist', title: 'HCI' },
{ area: 'robotics', title: 'Robotics' },
{ area: 'icra', title: 'Robotics' },
{ area: 'iros', title: 'Robotics' },
{ area: 'rss', title: 'Robotics' },
{ area: 'bio', title: 'Comp. Bio' },
{ area: 'ismb', title: 'Comp. Bio' },
{ area: 'recomb', title: 'Comp. Bio' },
{ area: 'da', title: 'EDA' },
{ area: 'dac', title: 'EDA' },
{ area: 'iccad', title: 'EDA' },
{ area: 'bed', title: 'Embedded' },
{ area: 'emsoft', title: 'Embedded' },
{ area: 'rtas', title: 'Embedded' },
{ area: 'rtss', title: 'Embedded' },
{ area: 'visualization', title: 'Visualization' },
{ area: 'vis', title: 'Visualization' },
{ area: 'vr', title: 'Visualization' },
{ area: 'ecom', title: 'ECom' },
{ area: 'ec', title: 'ECom' },
{ area: 'wine', title: 'ECom' }
    // ,{ area : "cse", title : "CSEd" }
];

const areas: string[] = [];
const areaNames: string[] = [];
const fields: string[] = [];
const areaDict: { [key: string]: string } = {};
const areaPosition: { [key: string]: number } = {};
const topLevelAreas: { [key: string]: string } = {};
const topTierAreas: { [key: string]: string } = {};
const authorAreas = {};
const countryInfo: { [key: string]: string } = {};
const countryAbbrv: { [key: string]: string } = {};
const areaDeptAdjustedCount = {};
const useDenseRankings: boolean = false;
let authors: Author[] = [];
let areas0: AreaType[] = [];

const loadAuthors = async(): Promise<void> => {
    let position = 0;
    for (const areamap of areaMap) {
        const { area, title } = areamap;
        areas.push(area);
        if (!(area in parentMap)) {
            topLevelAreas[area] = area;
        }
        if (!(area in nextTier)) {
            topTierAreas[area] = area;
        }
        areaNames.push(title);
        fields.push(area);
        areaDict[area] = title;
        areaPosition[area] = position;
        position++;
    }

    const file = createReadStream(authorinfoFile);
    file.on('error', function() {
        console.log('error');
    });
    const data = await new Promise((resolve) => {
        parse(file, {
            header: true,
            complete: (results) => {
                console.log("Finished:", results.data);
                resolve(results.data);
            }
        });
    });
    authors = data as Author[];
}

const countAuthorAreas = async(): Promise<void> => {
    for (const author of authors) {
        const { area, year, name, dept, count } = author;
        if (area in nextTier) {
            continue;
        }
        if ((year < startyear) || (year > endyear)) {
            continue;
        }
        const theCount = parseFloat(count);
        if (!(name in authorAreas)) {
            authorAreas[name] = {};
            for (const _area in areaDict) {
                if (areaDict.hasOwnProperty(_area)) {
                    authorAreas[name][_area] = 0;
                }
            }
        }
        if (!(dept in authorAreas)) {
            authorAreas[dept]  = {}
            for (const _area in areaDict) {
                if (areaDict.hasOwnProperty(_area)) {
                    authorAreas[dept][_area] = 0;
                }
            }
        }
        authorAreas[name][area] += theCount;
        authorAreas[dept][area] += theCount;
    }
}

const loadCountryInfo = async(): Promise<void> => {
    const file = createReadStream(countryinfoFile);
    const data = await new Promise((resolve) => {
        parse(file, {
            header: true,
            complete: (results) => {
                console.log("Finished:", results.data);
                resolve(results.data);
            }
        });
    })
    const ci = data as CountryInfo[];
    for (const info of ci) {
        countryInfo[info.institution] = info.region;
        countryAbbrv[info.institution] = info.countryabbrv;
    }
}

const loadAreaInfo = async(): Promise<void> => {
    const file = createReadStream(areainfoFile);
    const data = await new Promise((resolve) => {
        parse(file, {
            header: true,
            complete: (results) => {
                console.log("Finished:", results.data);
                resolve(results.data);
            }
        });
    });
    areas0 = data as AreaType[];
}

function updateWeights(_areas: string[], weights: { [key: string]: number }): number {
    let numAreas = 0;
    for (const _area of _areas) {
        weights[_area] = 1;
        numAreas++;
    }
    return numAreas;
}

function inRegion(dept: string, regions: string): boolean {
    switch (regions) {
        case 'us':
            if (dept in countryInfo) {
                return false;
            }
            break;
        case 'at':
        case 'au':
        case 'br':
        case 'ca':
        case 'ch':
        case 'cn':
        case 'de':
        case 'dk':
        case 'es':
        case 'fr':
        case 'gr':
        case 'hk':
        case 'il':
        case 'in':
        case 'it':
        case 'jp':
        case 'kr':
        case 'nl':
        case 'nz':
        case 'tr':
        case 'uk':
            if (countryAbbrv[dept] !== regions) {
                return false;
            }
            break;
        case 'europe':
            if (!(dept in countryInfo)) { // USA
                return false;
            }
            if (countryInfo[dept] !== 'europe') {
                return false;
            }
            break;
        case 'northamerica':
            if ((dept in countryInfo) && (countryInfo[dept] !== 'canada')) {
                return false;
            }
            break;
        case 'australasia':
            if (!(dept in countryInfo)) { // USA
                return false;
            }
            if (countryInfo[dept] !== 'australasia') {
                return false;
            }
            break;
        case 'southamerica':
            if (!(dept in countryInfo)) { // USA
                return false;
            }
            if (countryInfo[dept] !== 'southamerica') {
                return false;
            }
            break;
        case 'asia':
            if (!(dept in countryInfo)) { // USA
                return false;
            }
            if (countryInfo[dept] !== 'asia') {
                return false;
            }
            break;
        case 'africa':
            if (!(dept in countryInfo)) { // USA
                return false;
            }
            if (countryInfo[dept] !== 'africa') {
                return false;
            }
            break;
        case 'world':
            break;
    }
    return true;
}

function buildDepartments(regions: string,
    weights: { [key: string]: number },
    deptCounts: { [key: string]: number },
    deptNames: { [key: string]: string[] },
    facultycount: { [key: string]: number },
    facultyAdjustedCount: { [key: string]: number }): void {
    const visited: { [key: string]: boolean } = {};

    for (const author of authors) {
        const { dept, year, name } = author;
        let area = author.area;
        if (!inRegion(dept, regions)) {
            continue;
        }
        if ((year < startyear) || (year > endyear)) {
            continue;
        }
        if (typeof dept === 'undefined') {
            continue;
        }
        if (area in parentMap) {
            area = parentMap[area];
        }
        if (!(area in weights)) {
            continue;
        }
        const areaDept: string = area + dept;
        if (!(areaDept in areaDeptAdjustedCount)) {
            areaDeptAdjustedCount[areaDept] = 0;
        }
        const count: number = parseInt(author.count, 10);
        const adjustedCount: number = parseFloat(author.adjustedcount);
        areaDeptAdjustedCount[areaDept] += adjustedCount;
        if (!(name in visited)) {
            visited[name] = true;
            facultycount[name] = 0;
            facultyAdjustedCount[name] = 0;
            if (!(dept in deptCounts)) {
                deptCounts[dept] = 0;
                deptNames[dept] = ([] as string[]);
            }
            deptNames[dept].push(name);
            deptCounts[dept] += 1;
        }
        facultycount[name] += count;
        facultyAdjustedCount[name] += adjustedCount;
    }
}

function computeStats(deptNames: { [key: string]: string[] },
    numAreas: number,
    weights: { [key: string]: number },
    stats: { [key: string]: number }) {
    for (const dept in deptNames) {
        if (!deptNames.hasOwnProperty(dept)) {
            continue;
        }
        stats[dept] = 1;
        for (const area in topLevelAreas) {
            const areaDept = area + dept;
            if (!(areaDept in areaDeptAdjustedCount)) {
                areaDeptAdjustedCount[areaDept] = 0;
            }
            if (area in weights) {
                // Adjusted (smoothed) geometric mean.
                stats[dept] *= (areaDeptAdjustedCount[areaDept] + 1.0);
            }
        }
        // finally compute geometric mean.
        stats[dept] = Math.pow(stats[dept], 1 / numAreas); // - 1.0;
    }
}

function sortIndex(univagg: { [key: string]: number }): string[] {
    const keys = Object.keys(univagg);
    keys.sort((a, b) => {
        if (univagg[a] !== univagg[b]) {
            return univagg[b] - univagg[a];
        }
        if (a < b) {
            return -1;
        }
        if (b < a) {
            return 1;
        }
        return 0;
    });
    return keys;
}

const rank = async(connection: Connection): Promise<void> => {
    const whichRegions = 'us';
    await loadAreaInfo();
    for (const area0 of areas0) {
        const deptNames: { [key: string]: string[] } = {};    /* names of departments. */
        const deptCounts: { [key: string]: number } = {};           /* number of faculty in each department. */
        const facultycount: { [key: string]: number } = {};         /* name -> raw count of pubs per name / department */
        const facultyAdjustedCount: { [key: string]: number } = {}; /* name -> adjusted count of pubs per name / department */
        const currentWeights: { [key: string]: number } = {};       /* array to hold 1 or 0, depending on if the area is checked or not. */
        const stats = {};

        console.log(area0);
        const numAreas = updateWeights(area0.abbrv.split('&'), currentWeights);
        console.log(currentWeights);
        buildDepartments(whichRegions, currentWeights, deptCounts, deptNames, facultycount, facultyAdjustedCount);
        computeStats(deptNames, numAreas, currentWeights, stats);

        if (numAreas > 0) {
            let ties = 1;               /* number of tied entries so far (1 = no tie yet); used to implement "competition rankings" */
            let rank0 = 0;               /* index */
            let oldv = 9999999.999;     /* old number - to track ties */
            /* Sort the university aggregate count from largest to smallest. */
            // First, round the stats.
            for (const k in stats) {
                const v = Math.round(10.0 * stats[k]) / 10.0;
                stats[k] = v;
            }
            // Now sort them,
            const keys2 = sortIndex(stats);
            for (const dept of keys2) {
                const v = stats[dept];
                if (oldv !== v) {
                    if (useDenseRankings) {
                        rank0 += 1;
                    } else {
                        rank0 += ties;
                        ties = 0;
                    }
                }
                let abbrv = 'us';
                if (dept in countryAbbrv) {
                    abbrv = countryAbbrv[dept];
                }
                const area = new Area();
                area.area = area0.area;
                area.rank = rank0;
                area.department = dept;
                area.count = Math.round(10.0 * v) / 10.0;
                area.facultyNum = deptCounts[dept];
                await connection.manager.save(area);
                console.log(rank0 + ' ' + dept + ' ' + (Math.round(10.0 * v) / 10.0).toFixed(1) + ' ' + deptCounts[dept]);
                ties++;
                oldv = v;
            }
        }
    }
}

createConnection().then(async(connection) => {
    console.log('Successfully create connection');
    await loadAuthors();
    console.log('Successfully load author info');
    await countAuthorAreas();
    console.log('Successfully count author info');
    await loadCountryInfo();
    await rank(connection);
    console.log('Successfully rank');
}).catch(error => console.log(error));