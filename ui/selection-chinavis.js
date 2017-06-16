define(function(require){

var Layout = require('vastui/layout'),
    Panel = require('vastui/panel'),
    Button = require('vastui/button'),
    Iconn = require('vastui/icon'),
    List = require('vastui/list');

var ajax = require('p4/io/ajax'),
    dsv = require('p4/io/parser'),
    dataStruct = require('p4/core/datastruct'),
    arrays = require('p4/core/arrays'),
    pipeline =require('p4/core/pipeline'),
    stats = require('p4/dataopt/stats');

return function(arg) {
	var options = arg || {},
		container = options.container,
		onSelect = options.onselect || function() {};

	var appLayout = new Layout({
        margin: 5,
        container: 'page-left-view-body',
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
    let logFunc = (str) => () => console.log(str);
    appLayout.messagesPopulated = logFunc('messagesPopulated');
    appLayout.messageClicked = (msgObj) => {
    	// console.log(msgObj);
        let pid = msgObj.content;
        let locs = R.map(meta => {
        	// console.log(meta.recitime * 1000, meta.recitime + '000');
        	let time = moment(parseInt(meta.recitime)).tz('Asia/Shanghai');
        	gTime = time;
        	// let time = new Date(parseInt(meta.recitime));
            return {
            	day: time.day(),
            	hour: time.hour(),
            	hours: time.hour() + ' - ' + time.hour(),
                lat: meta.lat,
            	location: meta.md5,
                long: meta.lng,
                month: time.month(),
                time: time.toDate(),
                user: msgObj.content
            }
        }, msgObj.metas);
        onSelect(pid, locs);
    }

    let dates = [];
    let wordCounts = [];
    let senderCounts = [];
    let msgObjs = [];
    let currDate = '';
    let currWords = [];
    let currSenders = [];

    let setCurrDate = dateId => {
    	currDate = dates[dateId].date;
    	let wordsLoading = loadWords(currDate);
    	wordsLoading.then(populateWordList);
    	let sendersLoading = loadSenders(currDate);
    	sendersLoading.then(populateSenderList);
    	Promise.all([ wordsLoading, sendersLoading ])
    		.then(results => loadMessages(currDate, [], []))
    		.then(populateMessages);
    }
    let setCurrWords = ids => {
    	let words = R.map(id => wordCounts[id][0], ids);
    	wordList.setSelectedItemIds(ids);
    	currWords = words;
    }
    let setCurrSenders = ids => {
    	let senders = R.map(id => senderCounts[id][0], ids);
    	senderList.setSelectedItemIds(ids);
    	currSenders = senders;
    }
    let updateMessages = () => {
    	loadMessages(currDate, currWords, currSenders).then(populateMessages);
    }

    var views = {};
    appLayout.views = views;

    views.dates = new Panel({
        container: appLayout.cell('dates-view'),
        id: 'panel-dates',
        // title: '日期（短信数量）',
        title: '日期',
        style: {
            overflow: 'scroll',
            padding: '0 6px'
        },
        header: {height: 35, style: {backgroundColor: '#FFF'}}
    });
    let dateList = new List({
        container: views.dates.body,
        types: ['selection'],
        onselect: setCurrDate
    });

    views.words = new Panel({
        container: appLayout.cell('words-view'),
        id: 'panel-words',
        // title: '词（短信数量）',
        title: '词',
        style: {
            overflow: 'scroll',
            padding: '0 6px'
        },
        header: {height: 35, style: {backgroundColor: '#FFF'}}
    });
    views.words.header.append(
    		'<a id="cv-text-words-clear" href="#">Clear</a>');
    $('#cv-text-words-clear').click(() => {
    	setCurrWords([]);
    	updateMessages();
    })
    let wordList = new List({
        container: views.words.body,
        types: ['selection'],
        onselect: () => {
        	let ids = wordList.getSelectedItemIds();
        	setCurrWords(ids);
        	updateMessages();
        }
    });

    views.senders = new Panel({
        container: appLayout.cell('senders-view'),
        id: 'panel-senders',
        // title: '发信号码（短信数量）',
        title: '发信号码',
        style: {
            overflow: 'scroll',
            padding: '0 6px'
        },
        header: {height: 35, style: {backgroundColor: '#FFF'}}
    });
    views.senders.header.append(
    		'<a id="cv-text-senders-clear" href="#">Clear</a>');
    $('#cv-text-senders-clear').click(() => {
    	setCurrSenders([]);
    	updateMessages();
    })
    let senderList = new List({
        container: views.senders.body,
        types: ['selection'],
        onselect: () => {
        	let ids = senderList.getSelectedItemIds();
        	setCurrSenders(ids);
        	updateMessages();
        }
    });

    views.sms = new Panel({
        container: appLayout.cell('sms-view'),
        id: 'panel-sms',
        title: 'SMS',
        style: {
            overflow: 'scroll',
            padding: '0 6px'
        },
        header: {height: 35, style: {backgroundColor: '#FFF'}}
    })
    let smsList = new List({
        container: views.sms.body,
        types: ['selection'],
        onselect: id => appLayout.messageClicked(msgObjs[id])
    })

    let datesLoading = ajax.get({ url: '/chinavis/dates' })
    		.then(array => {
    	dates = array;
    	return dates;
    });
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
            return '<span class="cv-text-dates-date" date="'
                 + dateObj.date
                 + '">'
                 + formatted
                 + '</span>'
                 // + '（'
                 // + '<span class="cv-text-dates-count">'
                 // + dateObj.nMessages
                 // + '</span>'
                 // + '）';
        }
        R.forEach(obj => {
            dateList.append({
                text: dateObjToEl(obj)
            });
        }, dates);
    });
    datesLoading.then(dates => setCurrDate(0));

    let loadWords = dateString => ajax.get({
    	url: '/chinavis/wordcounts/' + dateString
    });
    let populateWordList = array => {
    	wordCounts = array;
        wordList.clear();
        let wordCountToEl = wordCount => {
            return '<span class="cv-text-words-word">'
                 + wordCount[0]
                 + '</span>'
                 // + '（'
                 // + '<span class="cv-text-words-count">'
                 // + wordCount[1]
                 // + '</span>'
                 // + '）';
        };
        R.forEach(wordCount => {
            wordList.append({
                text: wordCountToEl(wordCount)
            });
        }, wordCounts);
    }

    let loadSenders = dateString => ajax.get({
    	url: '/chinavis/sendercounts/' + dateString
    });
    let populateSenderList = array => {
    	senderCounts = array;
        senderList.clear();
        let senderCountToEl = senderCount => {
            return '<span class="cv-text-senders-word">'
                 + senderCount[0]
                 + '</span>'
                 // + '（'
                 // + '<span class="cv-text-senders-count">'
                 // + senderCount[1]
                 // + '</span>'
                 // + '）';
        }
        R.forEach(senderCount => {
            senderList.append({
                text: senderCountToEl(senderCount)
            });
        }, senderCounts);
    }

    let loadMessages = (dateString, words, senders) => {
    	views.sms.showLoading();
    	return ajax.get({
        	url: '/chinavis/messages?parameters='
                    + encodeURIComponent(JSON.stringify({
                date: dateString,
                words: words,
                senders: senders
            }))
        });
    };
    let populateMessages = messages => {
    	smsList.clear();
    	msgObjs = messages;
    	R.forEach(msgObj => {
    		smsList.append({
    			text: msgObj.content
    		})
    	}, messages);
    	views.sms.hideLoading();
    	appLayout.messagesPopulated(msgObjs);
    }

    return appLayout;
}

});