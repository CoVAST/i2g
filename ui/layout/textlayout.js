define(function(require) {
    var ajax = require('p4/io/ajax'),
        Layout = require('vastui/layout'),
        Panel = require('vastui/panel'),
        Button = require('vastui/button'),
        Table = require('vastui/table'),
        ProgressBar = require('vastui/progress');

    return function() {
        var appLayout = new Layout({
            margin: 10,
            container: 'page-text',
            rows: [
                {
                    id: 'filter-view',
                    height: 0.4,
                    cols: [
                        {
                            id: 'dates-view',
                            width: 0.33
                        },
                        {
                            id: 'words-view',
                            width: 0.33
                        },
                        {
                            id: 'senders-view',
                            width: 0.33
                        }
                    ]
                },
                {
                    id: 'sms-view',
                    height: 0.6
                }
            ]
        });
        document.getElementById('filter-view').style.whiteSpace = 'nowrap';
        document.getElementById('filter-view').style.overflow = 'auto';

        var views = {};
        appLayout.views = views;

        views.dates = new Panel({
            container: appLayout.cell('dates-view'),
            id: 'panel-dates',
            title: 'Dates',
            style: {
                overflow: 'scroll',
                padding: '0 6px'
            },
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        });
        let dateList = new List({
            container: views.dates.body,
            types: ['selection'],
            onselect
        });

        views.words = new Panel({
            container: appLayout.cell('words-view'),
            id: 'panel-words',
            title: 'Words',
            style: {
                overflow: 'scroll',
                padding: '0 6px'
            },
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        });
        let wordList = new List({
            container: views.words.body,
            types: ['selection'],
            onselect: function(itemId) {
                console.log(this);
            }
        });

        views.senders = new Panel({
            container: appLayout.cell('senders-view'),
            id: 'panel-senders',
            title: 'Senders',
            style: {
                overflow: 'scroll',
                padding: '0 6px'
            },
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        });
        let senderList = new List({
            container: views.senders.body,
            types: ['selection']
        });

        views.sms = new Panel({
            container: appLayout.cell('sms-view'),
            id: 'panel-sms',
            title: 'SMS',
            style: {
                overflow: 'scroll'
            },
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        })
        let smsList = new List({
            container: views.sms.body,
            types: ['selection']
        })

        let datesLoading = ajax.get({ url: '/chinavis/dates' });
        datesLoading.then(dates => {
            dateList.clear();
            let formatDateString = str =>
                    str.slice(0, 4) + '年'
                  + str.slice(4, 6) + '月'
                  + str.slice(6, 8) + '日';
            let calcMaxCount = R.pipe(
                    R.map(dateObj => dateObj.nMessages),
                    R.reduce(R.max, 0));
            let maxCount = calcMaxCount(dates);
            let dateObjToEl = dateObj => {
                let formatted = formatDateString(dateObj.date);
                // return formatted;
                // let ratio = dateObj.nMessages / maxCount;
                // return [formatted, dateObj.nMessages];
                return '<span class="cv-text-dates-date" date="'
                     + dateObj.date
                     + '">'
                     + formatted
                     + '</span>'
                     + '  |  '
                     + '<span>短信数量：</span>'
                     + '<span class="cv-text-dates-count">'
                     + dateObj.nMessages
                     + '</span>';
            }
            R.forEach(obj => {
                dateList.append({
                    text: dateObjToEl(obj)
                });
            }, dates);
        });
        let wordCountsLoading = datesLoading.then(dates => {
            return ajax.get({ url: '/chinavis/wordcounts/' + dates[0].date });
        });
        wordCountsLoading.then(wordCounts => {
            wordList.clear();
            let wordCountToEl = wordCount => {
                return '<span class="cv-text-words-word">'
                     + wordCount[0]
                     + '</span>'
                     + '  |  '
                     + '<span>短信数量：</span>'
                     + '<span class="cv-text-words-count">'
                     + wordCount[1]
                     + '</span>';
            };
            R.forEach(wordCount => {
                wordList.append({
                    text: wordCountToEl(wordCount)
                });
            }, wordCounts);
        });
        let senderCountsLoading = datesLoading.then(dates => {
            return ajax.get({
                url: '/chinavis/sendercounts/' + dates[0].date
            });
        });
        senderCountsLoading.then(senderCounts => {
            senderList.clear();
            let senderCountToEl = senderCount => {
                return '<span class="cv-text-senders-word">'
                     + senderCount[0]
                     + '</span>'
                     + '  |  '
                     + '<span>短信数量：</span>'
                     + '<span class="cv-text-senders-count">'
                     + senderCount[1]
                     + '</span>';
            }
            R.forEach(senderCount => {
                senderList.append({
                    text: senderCountToEl(senderCount)
                });
            }, senderCounts);
        });
        Promise.all([ datesLoading, wordCountsLoading, senderCountsLoading ])
                .then(results => {
            let dates = results[0];
            let wordCounts = results[1];
            let senderCounts = results[2];
            let url = '/chinavis/messages?parameters='
                    + encodeURIComponent(JSON.stringify({
                date: dates[0],
                words: [ wordCounts[0] ],
                senders: []
            }));
            // console.log(url);
            return ajax.get({ url: url })
        }).then(messages => {

        });

        return appLayout;
    }
})
