define(function(require) {
    var ajax = require('p4/io/ajax'),
        Layout = require('vastui/layout'),
        Panel = require('vastui/panel'),
        Button = require('vastui/button'),
        ProgressBar = require('vastui/progress');

    return function() {
        var appLayout = new Layout({
            margin: 10,
            container: 'page-text',
            cols: [
                {
                    id: 'words-view',
                    width: 0.2
                },
                {
                    id: 'sms-view',
                    width: 0.6
                }
            ]
        });

        var views = {};
        views.words = new Panel({
            container: appLayout.cell('words-view'),
            id: 'panel-words',
            title: 'Words',
            style: {
                overflow: 'scroll',
                padding: '0 20px'
            },
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        })
        let words = new List({
            container: views.words.body,
            types: ['selection']
        })
        appLayout.views = views;

        ajax.get({ url: '/data/chinavis/wordcounts.json' })
            .then(wordCounts => {
                console.log(wordCounts);
                wordCounts.forEach((wordCount) => {
                    words.append({
                        text: wordCount[0] + '<span style="float:right;">' + wordCount[1] + "</span>"
                    })
                })
            })

        return appLayout;
    }
})
