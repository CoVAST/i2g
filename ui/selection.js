define(function(require){
    var Layout = require('vastui/layout'),
        Panel = require('vastui/panel'),
        Button = require('vastui/button'),
        List = require('vastui/list');

    var ajax = require('p4/io/ajax'),
        dsv = require('p4/io/parser'),
        dataStruct = require('p4/core/datastruct'),
        arrays = require('p4/core/arrays'),
        pipeline =require('p4/core/pipeline'),
        stats = require('p4/dataopt/stats');

    return function(arg) {
        var options = arg || {},
            // container = options.container || 'domain-vis',
            igraph = options.igraph;

        var data = {},
            result;

        var selection = new Layout({
            // margin: 5,
            // padding: 5,
            id: "panel-data-selection",
            container: 'page-left-view-body',
            cols: [
                {
                    id: "list-subject",
                    width: 0.5
                },
                {
                    id: "list-related-people",
                    width: 0.5
                }
            ]
        });
        selection.onSelect = options.onselect || function() {};
        selection.mapCenter = [37.7749, -122.4194];
        selection.mapZoom = 10;

        let onSelect = (d, r) => {
            selection.onSelect.call(this, d, r);
            igraph.append({
                nodes: {label: d, labelPrefix: 'Person', type: "people", pos: [100,100], value: 0},
                links: []
            });
        }

        var views = {};

        views.subject = new Panel({
            container: selection.cell('list-subject'),
            id: "panel-subject",
            title: "Subject List",
            padding: 10,
            header: {height: 40, style: {backgroundColor: '#FFF'}}
        });

        views.related = new Panel({
            padding: 10,
            container: selection.cell('list-related-people'),
            id: "panel-related-people",
            title: "Related People",
            style: {
                overflow: 'scroll'
            },
            header: {height: 40, style: {backgroundColor: '#FFF'}}
        });

        views.subject.append(
            '<div class="ui icon input fluid" >' +
              '<input type="text" id="subject-search"  placeholder="Search...">' +
              '<i id="subject-search-button" class="search link icon"></i>' +
            '</div>'
        );

        $("#subject-search").change(function(){
            console.log(this.value);
        })

        var subjectList = new List({
            container: views.subject.body,
            types: ['selection', 'single'],
            onselect: function(subjectId) {
                populateRelatedPeople(data.subjects[subjectId]);
            }
        })

        var selectedSubjectID = 0, selected = {};

        var relatedPeople = new List({
            container: views.related.body,
            types: ['divided', 'selection'],
            selectedColor: 'purple',
            onselect: function(index) {
                let d = data.relatedPersonIds[index];
                var r = pipeline()
                .match({
                    user: d
                })
                (data.records);
                selected[d] = !selected[d];
                onSelect.call(this, d, r);
            }
        });

        ajax.getAll([
            {url: '/data/test-relationship.csv', dataType: 'text'},
            {url: '/data/test-geo280k.csv', dataType: 'text'}
        ]).then(function(text){
            data.relationship = dataStruct({
                array: dsv(text[0], '\t'),
                header: ['source', 'target'],
                types: ['int', 'int']
            }).objectArray();

            data.records = dataStruct({
                array: dsv(text[1], '\t'),
                header: ['user', 'time', 'lat', 'long', 'location'],
                types: ['int', 'time', 'float', 'float', 'string']
            }).objectArray();

            data.records.forEach(function(d){
                d.month = d.time.getMonth();
                d.day = d.time.getDay();
                d.hour = d.time.getHours();
            })

            let subjects = R.reduce((acc, obj) => {
                if (!acc[obj.source])
                    acc[obj.source] = [];
                acc[obj.source].push(obj.target);
                return acc;
            }, {}, data.relationship);
            data.subjects = subjects;

            // var subjects = pipeline()
            // .group({
            //     $by: 'source',
            //     connection: {target: '$count'}
            // })
            // (data.relationship);

            var activityTotal = pipeline()
            .group({
                $by: 'user',
                count: {'location': '$count'}
            })(data.records)
            data.activityTotal = activityTotal;
            // console.log(activityTotal);

            selection.update({
                subjects: subjects,
                activityTotal: activityTotal
            })


            var selectedSubject = pipeline()
            .match({
                source: selectedSubjectID
            })
            (data.relationship);

            result = pipeline()
            .match({
                user: selectedSubjectID
            })
            (data.records);

        });

        selection.update = function(data) {

            R.forEachObjIndexed((subject, key) => {
                subjectList.append({
                    header: 'Subject ' + key,
                    icon: 'big spy',
                    text: subject.length + ' connections, ' + data.activityTotal[key].count + ' activities'
                })
            }, data.subjects);

            // data.subjects.forEach(function(d, i){
            //     subjects.append({
            //         header: 'Subject ' + i,
            //         icon: 'big spy',
            //         text: data.subjects[i].connection + ' connections, ' +
            //                 data.activityTotal[i].count + ' activtiies'
            //     })
            // })

            subjectList.setSelectedItemIds([0]);
            populateRelatedPeople(data.subjects[0]);

            // data.activityTotal.forEach(function(d){
            //     relatedPeople.append({
            //         header: 'Related Person ' + d.user,
            //         text: d.count + ' activtiies',
            //         icon: 'user mid'
            //     })
            // });

        }

        let populateRelatedPeople = (personIds) => {
            data.relatedPersonIds = personIds;
            relatedPeople.clear();
            let selectedItemIds = [];
            R.forEach(personId => {
                let d = data.activityTotal[personId];
                relatedPeople.append({
                    header: 'Related Person ' + d.user,
                    text: d.count + ' activities',
                    icon: 'user mid'
                });
                if (selected[personId]) {
                    let id = $(relatedPeople).children().length - 1;
                    selectedItemIds.push(id);
                }
            }, personIds);
            relatedPeople.setSelectedItemIds(selectedItemIds);
        }



        selection.result = function() {
            return result;
        }




        return selection;
    }

})
