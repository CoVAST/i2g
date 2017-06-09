var Baby = require('babyparse');
var R = require('ramda');
var fs = require('fs');
var nodejieba = require('nodejieba');

exports.setup = function(app) {
    // app.get('/chinavis/wordcounts', function(req, res) {
    //     res.sendFile('./data/chinavis/wordcounts.json');
    // })
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
            let tokensArray = row.data.map(data => nodejieba.cut(data.content));
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
