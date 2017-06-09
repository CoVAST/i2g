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
                    width: 0.8
                }
            ]
        });

        var views = {};
        appLayout.views = views;

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
        let requestSMSByWord = word => {
            ajax.get({ url: '/chinavis/records/' + word })
                .then(records => {
                    while (smsList.hasChildNodes()) {
                        smsList.removeChild(smsList.lastChild);
                    }
                    records.forEach((record) => {
                        smsList.append({
                            text: record.content
                        })
                        let item = smsList.lastChild;
                        // item.setAttribute('metas', record.metas);
                        item.onclick = function(e) {
                            let children = $(this).children('.metas');
                            if (!children.length) {
                                let item = this;
                                let container = document.createElement('div');
                                container.className = 'metas';
                                item.appendChild(container);
                                let list = new List({
                                    container: container,
                                    types: ['selection']
                                });
                                record.metas.forEach(meta => {
                                    list.append({
                                        text: JSON.stringify(meta)
                                    })
                                });
                            } else {
                                children.toggle();
                            }
                        }
                    })
                })
        }
        words.selectItem = item => {
            let word = item.firstChild.firstChild.innerHTML;
            requestSMSByWord(word);
            let selectedItems = $('#panel-words .selected.item');
            if (selectedItems.length) {
                selectedItems[0].className = 'item';
            }
            item.className = 'selected item';
        }
        words.onclick = e => {
            let parents = $(e.target).parents('.item');
            if (!parents.length) {
                return;
            }
            let item = parents[0];
            words.selectItem(item);
        }

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

        ajax.get({ url: '/data/chinavis/wordcounts.json' })
            .then(wordCounts => {
                wordCounts.forEach((wordCount) => {
                    words.append({
                        text: '<span>'
                            + wordCount[0]
                            + '</span>'
                            + '<span style="float:right;">'
                            + wordCount[1]
                            + "</span>"
                    })
                })
            });

        return appLayout;
    }
})
