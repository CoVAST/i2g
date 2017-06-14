var Baby = require('babyparse');
var R = require('ramda');
var fs = require('fs');
var path = require('path');
var nodejieba = require('nodejieba');

exports.setupRoutes = function(app) {
    let data = (() => {
        let _dates = null;
        let _cache = {};
        let readDate = (date, callback) => {
            /// TODO: able to cache multiple dates
            _cache = {};
            let pathname = './data/chinavis/' + date + '.json';
            fs.readFile(pathname, (err, str) => {
                _cache[date] = JSON.parse(str);
                callback(_cache[date]);
            });
        }

        return {
            dates: callback => {
                if (!_dates) {
                    fs.readFile('./data/chinavis/dates.json', (err, str) => {
                        _dates = JSON.parse(str);
                        callback(_dates);
                    });
                } else {
                    callback(_dates);
                }
            },
            wordCounts: (date, callback) => {
                if (R.contains(date, R.keys(_cache))) {
                    callback(_cache[date].words);
                    return;
                }
                readDate(date, obj => {
                    callback(obj.words);
                });
            },
            senderCounts: (date, callback) => {
                if (R.contains(date, R.keys(_cache))) {
                    callback(_cache[date].senders);
                    return;
                }
                readDate(date, obj => {
                    callback(obj.senders);
                });
            },
            messages: (parameters, callback) => {
                console.log(parameters);
            }
        }
    })();

    app.get('/chinavis/dates', (req, res) => {
        data.dates(R.bind(res.send, res));
    });
    app.get('/chinavis/wordcounts/:date', (req, res) => {
        data.wordCounts(req.params.date, R.bind(res.send, res));
    });
    app.get('/chinavis/sendercounts/:date', (req, res) => {
        data.senderCounts(req.params.date, R.bind(res.send, res));
    });
    app.get('/chinavis/messages', (req, res) => {
        data.messages(JSON.parse(req.query.parameters), R.bind(res.send, res));
    });
}

exports.setup = function(app) {
    let wordToRecordId = {};
    fs.readFile('./data/chinavis/old/words.json', (err, str) => {
        wordToRecordId = JSON.parse(str);
    });

    let records = [];
    fs.readFile('./data/chinavis/old/records.json', (err, str) => {
        records = JSON.parse(str);
    })

    app.get('/chinavis/records/:word', (req, res) => {
        let ids = wordToRecordId[req.params.word] || [];
        let requested = R.map(id => records[id], ids);
        let uniques = {}
        R.forEach(record => {
            if (!uniques[record.content]) {
                uniques[record.content] = [];
            }
            let copy = R.clone(record);
            delete copy.content;
            uniques[record.content].push(copy);
        }, requested);
        const convert =
                R.compose(R.map(R.zipObj(['content', 'metas'])), R.toPairs);
        let array = convert(uniques);
        // console.log(array.length);
        res.send(array.slice(0, 500));
    })
}

exports.preprocessDateCounts = function() {
    let filenames = fs.readdirSync('./data/chinavis');
    let pathnames = R.map(name => './data/chinavis/' + name, filenames);
    let output = R.map(pathname => {
        console.log('processing', pathname);
        let obj = JSON.parse(fs.readFileSync(pathname));
        let nMsgs = obj.messages.length;
        let basename = path.basename(pathname, '.json');
        return {
            date: basename,
            nMessages: nMsgs
        };
    }, pathnames);
    fs.writeFileSync('./data/chinavis/dates.json', JSON.stringify(output));
}

let countUniques = array => {
    return R.reduce((acc, value) => {
        if (!acc[value])
            acc[value] = 0;
        ++acc[value];
        return acc;
    }, {}, array);
}
let descendSortBy2ndValue = R.sort((a, b) => b[1] - a[1]);

let msgsToTokenArrays = R.map(msg => nodejieba.cut(msg.content));
let isTokenAWord = R.complement(R.test(/^[-`（）,，；:、：./【】。！\s\w]+$/));
let atLeastTwoChars = R.pipe(R.length, R.gte(R.__, 2));
let filterTokens = R.filter(R.both(isTokenAWord, atLeastTwoChars));
let extractWords = R.pipe(msgsToTokenArrays, R.flatten, filterTokens);
let extractWordCounts = R.pipe(extractWords, countUniques);
let extractSortedWordCounts =
        R.pipe(extractWordCounts, R.toPairs, descendSortBy2ndValue);

let extractSenders = R.map(msg => msg.phone);
let extractSenderCounts = R.pipe(extractSenders, countUniques);
let extractSortedSenderCounts =
        R.pipe(extractSenderCounts, R.toPairs, descendSortBy2ndValue);

exports.preprocess = function() {
    let filenames =
            fs.readdirSync('/Users/yey/work/data/ChinaVis Datasets/data');
    let paths = R.map(
            name => '/Users/yey/work/data/ChinaVis Datasets/data/' + name,
            filenames);
    // paths = paths.slice(50);
    // console.log(paths);
    R.forEach(pathname => {
        console.log('processing', pathname);
        let results = Baby.parseFiles(pathname, {
            header: true
        })
        let msgs = results.data;
        let dateStr = path.basename(pathname, '.csv');
        let wordCounts = extractSortedWordCounts(msgs);
        console.log(wordCounts.slice(0, 5));
        let senderCounts = extractSortedSenderCounts(msgs);
        console.log(senderCounts.slice(0, 5));

        let output = {
            words: wordCounts,
            senders: senderCounts,
            messages: msgs
        };

        let outpath = './data/chinavis/' + dateStr + '.json';
        console.log('ouputting to ', outpath);
        fs.writeFileSync(outpath, JSON.stringify(output));
    }, paths);
}

exports.init = function() {
    let filenames = fs.readdirSync('./data/chinavis');
    let paths = filenames.map(name => './data/chinavis/' + name);
    // let paths = './data/chinavis/20170223.csv';

    let records = [];
    let words = {};
    Baby.parseFiles(paths, {
        header: true,
        step: (row) => {
            let tokensArray =
                    row.data.map(data => nodejieba.cut(data.content));
            let tokens = [].concat(...tokensArray);
            // console.log(tokens);
            row.data.forEach(data => {
                let index = records.push(data) - 1;
                tokens.forEach(token => {
                    if (!words[token]) {
                        words[token] = [];
                    }
                    words[token].push(index);
                })
            })
        }
    });

    let counts = R.map(indexes => indexes.length, words);
    let pairs = R.toPairs(counts);
    let filtered =
            R.filter(
                pair => !R.test(/^[-`（）,；:、：./【】。！\s\w]+$/, pair[0]),
                pairs);
    filtered = R.filter(pair => pair[0].length > 1, filtered);
    let sorted = R.sort((a, b) => b[1] - a[1], filtered);
    // let sliced = R.slice(1, 100, sorted);
    // console.log(sorted.length);
    console.log(records[0]);
    console.log(words[0]);
    console.log(sorted[0]);

    fs.writeFile('./data/chinavis/records.json', JSON.stringify(records));
    fs.writeFile('./data/chinavis/words.json', JSON.stringify(words));
    fs.writeFile('./data/chinavis/wordcounts.json', JSON.stringify(sorted));
}
