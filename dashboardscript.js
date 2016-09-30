var toNum;
var dt;
var opacity = 1;
dt = new Date(0);

var clientWidth, clientHeight, largeWidth, mediumWidth, smallWidth, allHeight;

var tooltip, infotip;
var loadChart, rChart, hourlyChart, weatherChart, dayChart, topLoad, bottomLoad, dailyMinMaxChart, weeklyMinMaxChart,
    dailyMinChart, dailyMaxChart,
    weeklyMinChart, weeklyMaxChart;

var maxLoad, minLoad = [];

var charts = ['lineC', 'rangeC', 'daily', 'week', 'weather', 'dailyRange', 'weeklyRange'];

var timelyDim, hourlyDim, dayDim, weatherDim, dailyDim, weeklyDim;
var timelyGrp, hourlyGrp, dayGrp, weatherGrp, dailyMaxGrp, dailyMinGrp, weeklyMaxGrp, weeklyMinGrp;

var counter = 0;
var daynames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buttonC() {
    console.log("Called on Load");
    var y = d3.select('#year');
    var m = d3.select('#month');

    y.on('click', function() {
        console.log("unchecked");
        document.getElementById('monthLine').hidden = true
    });
    m.on('click', function() {
        console.log("checked");
        document.getElementById('monthLine').hidden = false
    });

}

function loadData(mon) {
    var a;
    var forMon = mon;
    console.log("calling for " + forMon + "json");
    d3.json('/data/' + forMon + '.json', function(data) {
        a = clean(data);
        console.log(a.length);



        createDimsAndFacts(a);
    })

}

function loadYearlyData() {

    var q = d3_queue.queue(1);

    q.defer(d3.json, '/data/5.json')
        .defer(d3.json, '/data/6.json')
        .defer(d3.json, '/data/7.json')
        .defer(d3.json, '/data/8.json')
        .defer(d3.json, '/data/9.json')
        .defer(d3.json, '/data/10.json')
        .defer(d3.json, '/data/11.json')
        /*.defer(d3.json,'/data/12.json')*/
        .awaitAll(merge);


}

function merge(err, data) {
    var a = [];
    data.forEach(function(d) {
        a = a.concat(d);
        console.log(d.length);
    });
    console.log(a);
    var b = clean(a);

    createDimsAndFacts(b);


}

function clean(data) {

    console.log("CALLED CLEANING")
        /*console.log(data.length);*/
    var matData = [];
    data.forEach(function(day) {
        day.IntervalReading.forEach(function(mins) {
            toNum = +(mins.timePeriod.start);
            toNum = toNum * 1000
                /*console.log(toNum);*/

            mins.timePeriod.start = new Date(toNum);
            /*console.log(mins.timePeriod.start.getUTCDate() + " : " +mins.timePeriod.start.getUTCHours() );*/
            mins.timePeriod.duration = +(mins.timePeriod.duration);
            mins.value = +(mins.value)
                /*console.log(mins.timePeriod.start)*/
                /*console.log(mins.value);*/
            matData.push({
                time: new Date(mins.timePeriod.start.getFullYear(),
                    mins.timePeriod.start.getUTCMonth(),
                    mins.timePeriod.start.getDate(),
                    mins.timePeriod.start.getHours(),
                    mins.timePeriod.start.getMinutes(),
                    mins.timePeriod.start.getSeconds()),
                load: mins.value
                    /*hours: mins.timePeriod.start.getHours()*/
            });

            /*time: (new Date(mins.timePeriod.start.getFullYear(),
                                                              mins.timePeriod.start.getUTCMonth(),
                                                              mins.timePeriod.start.getDate())), hours: mins.timePeriod.start.getHours()});*/
            /*matData[counter].dat = mins.timePeriod.start;*/
            /*console.log(matData[counter]);*/
            /* matData[counter].day = mins.timePeriod.start.getDate();
		 matData[counter].time = mins.timePeriod.start.getHours() + ":" + mins.timePeriod.start.getMinutes() + mins.timePeriod.start.getSeconds();
		 matData[counter].value = mins.value;*/

            counter++;
            num = 0;

            /*console.log(mins.timePeriod.start);*/
        });
    });

    return (matData);

}

function initial() {
    return {
        count: 0,
        cload: 0,
        load: 0
    }
}

function addLoad(p, v) {
    ++p.count;
    p.cload = p.cload + v.load;
    p.load = ((p.load + v.load)/4) / p.count;

    return p;
}

function reduceLoad(p, v) {
    --p.count;
    p.cload = p.cload - v.cload;
    p.load = p.count ? (((p.load - v.load)/4) / p.count) : 0;

    return p;
}

function sortForDataTable(una) {
    console.log("Removing tables")
    d3.selectAll('table').remove();
    minLoad = [];
    maxLoad = [];
    var len = una.length - 1;
    una.sort(function(a, b) {
        return a.load - b.load;
    });
    console.log("MINIMUM LOADS");
    for (var i = 0; i < 5; i++) {
        minLoad.push({
            time: una[i].time,
            load: una[i].load / 1000
        });


        /* console.log(una[i].time + "  :  "+una[i].load/1000);*/
    }
    tabulate(minLoad, ['time', 'load'], '#bottomLoad')
    console.log("MAXIMUM LOADS");
    for (var i = 0; i < 5; i++) {
        maxLoad.push({
            time: una[len - i].time,
            load: una[len - i].load / 1000
        });
        /* console.log(una[len-i].time + "  :  "+una[len-i].load/1000);*/
    }
    tabulate(maxLoad, ['time', 'load'], '#topLoad')
}

//CREATE OLAP DATA WITH CROSSFILTER
function createDimsAndFacts(data) {
    var cs = crossfilter(data);
    var all = cs.groupAll();

    //CREATE DIMENSIONS
    timelyDim = cs.dimension(function(d) {
        var a = new Date (d.time.getUTCFullYear(),d.time.getUTCMonth(),d.time.getUTCDate(),
        d.time.getUTCHours(),d.time.getUTCMinutes(),d.time.getUTCSeconds(),d.time.getUTCMilliseconds());
        return a;
    });
    hourlyDim = cs.dimension(function(d) {
        /*if ((d.time.getUTCHours() >= 0 ) && (d.time.getUTCHours() < 6) ){
            return 'Post Midnight Hours';
            
        }
        else if ((d.time.getUTCHours() >= 6 ) && (d.time.getUTCHours() < 18) ){
            return 'Day Hours';
            
        }
        else{
            return 'Evening Hours';
            
        }*/
        return d.time.getUTCHours();
    });
    dayDim = cs.dimension(function(d) {
        var a = d.time.getDay();
        return a + '.' + daynames[a];
    });
    weatherDim = cs.dimension(function(d) {
        if ((d.time.getUTCMonth() >= 5) && (d.time.getUTCMonth() <= 8)) {
            return 'Rainy';
        }
        else if ((d.time.getUTCMonth() >= 1) && (d.time.getUTCMonth() <= 4)) {
            return 'Summer';
        }
        else {
            return 'Winter';
        }
    });
    dailyDim = cs.dimension(function(d) {
        return new Date(d.time.getUTCFullYear(), d.time.getUTCMonth(), d.time.getUTCDate());
    })
    weeklyDim = cs.dimension(function(d) {
        return d3.time.weekOfYear(d.time);
    })


    //CREATE GROUPS
    timelyGrp = timelyDim.group().reduce(addLoad, reduceLoad, initial);
    hourlyGrp = hourlyDim.group();/*.reduce(addLoad, reduceLoad, initial);*/
    reducer = reductio().avg(function(d){ return (d.load/1000)});
    hourlyGrp = reducer(hourlyGrp);
    dayGrp = dayDim.group();
    reducer = reductio().avg(function(d){ return (d.load/1000)});
    dayGrp = reducer(dayGrp)
    weatherGrp = weatherDim.group()/*.reduce(addLoad, reduceLoad, initial);*/
    reducer = reductio().avg(function(d) {return (d.load/1000); })
    weatherGrp = reducer(weatherGrp);
    dailyMinGrp = reductio().min(function(d) {
        return d.load / 1000;
    })(dailyDim.group());
    dailyMaxGrp = reductio().max(function(d) {
        return d.load / 1000;
    })(dailyDim.group());
    weeklyMinGrp = reductio().min(function(d) {
        return d.load / 1000;
    })(weeklyDim.group());
    weeklyMaxGrp = reductio().max(function(d) {
        return d.load / 1000;
    })(weeklyDim.group());

    plotGraphs();

}

function plotGraphs() {

    var s = d3.select('#splash');
    s.style('visibility', 'hidden');

    var minDate, maxDate;

    minDate = timelyDim.bottom(1)[0].time;
    maxDate = timelyDim.top(1)[0].time;

    /*RANGE CHART TO SUPPORT LINE CHART*/
    rChart = dc.barChart('#rangeC')
        .width(1120)
        .height(75)
        .dimension(timelyDim)
        .group(timelyGrp)
        .centerBar(true)
        .mouseZoomable(true)
        .elasticY(true)
        .gap(1)
        .valueAccessor(function(d) {
            return d.value.load
        })
        .x(d3.time.scale().domain([minDate, maxDate]))
        .alwaysUseRounding(true)
        /*.yAxis().ticks(1)*/


    /*DAILY LOAD LINECHART*/
    loadChart = dc.lineChart('#lineC')
        .width(1120).height(400)
        .dimension(timelyDim).group(timelyGrp, "Load Requirement")
        .x(d3.time.scale().domain([minDate, maxDate]))
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .keyAccessor(function(d) {
            return d.key
        })
        .valueAccessor(function(d) {
            return (d.value.load / 1000)
        })
        /*.renderTitle(false)*/
        .rangeChart(rChart)
        .renderArea(true)
        .brushOn(false)
        .colors("orange")
        /*.transitionDuration(1500)*/
        .renderTitle(true)
        .title(function(d) {
            return "Date of the Month :   " + d.key + "\n" +
                "Load Value : " + (Math.round(d.value.load / 1000));
        })
        .elasticY(true)
        /*.elasticX(true)*/
        .mouseZoomable(true)
        .legend(dc.legend().x(500).y(10).itemHeight(25).gap(5))
        .yAxisLabel("Load in kW")
        .xAxisLabel("Timeline")
        /*.on("filtered", function(chart) {
            sortForDataTable(timelyDim.top(Infinity))
        })*/
    ;


    /*DAYS OF THE WEEK CHART*/
    dayChart = dc.rowChart('#week')
        .width(340).height(275)
        .dimension(dayDim).group(dayGrp)
        .valueAccessor(function(d) {
            return d.value.avg/4
        })
        .label(function(d) {
            return d.key.split('.')[1]
        })
        .title(function(d) {
            return Math.round(d.value.avg/4)
        })
        .ordinalColors(['#0E332A', '#AAE1FC', '#469DAB', '#780CE8', '#3753AB', '#AAE1FC', '#0E332A'])
        .elasticX(true)
        .xAxis().ticks(5)


    /*HOURLY PIE CHART*/
    hourlyChart = dc.pieChart('#daily')
        .width(340).height(275)
        .dimension(hourlyDim).group(hourlyGrp, "Load Consumption")
        .valueAccessor(function(d) {
            return Math.round((d.value.avg/4 ))
        })
        .colors(['#02735E', '#8ABF17', '#F2CD13', '#F2600C', '#BF0F0F'])
        .colorDomain(d3.extent(hourlyGrp.top(Infinity), function(d) {
            return Math.round((d.value.avg/4 ))
        }))
        .colorAccessor(function(d, i) {
            return d.value.avg / 4
        })
        .innerRadius(45)
        .label(function(d) {
            return d.key
        })
        .renderTitle(false);

    /*WEATHER PIE CHART*/
    weatherChart = dc.pieChart('#weather')
        .width(340).height(275)
        /*.colors(['#6888E8','#FFDC32','#59E86E'])*/
        .dimension(weatherDim).group(weatherGrp, "Load Consumption")
        .valueAccessor(function(d) {
            return (d.value.avg / 4)
        })
        .renderTitle(false)
        .innerRadius(50);

    /*DAILY MIN MAX RANGE*/

    dailyMinMaxChart = dc.compositeChart('#dailyRange')


    dailyMinChart = dc.lineChart(dailyMinMaxChart)

    .x(d3.time.scale().domain(d3.extent(dailyDim.top(Infinity), function(d) {
            return d.time;
        })))
        .dimension(dailyDim)
        .group(dailyMinGrp, "Minimum req.")
        .keyAccessor(function(d) {
            return d.key
        })
        .valueAccessor(function(d) {
            if (isNaN(d.value.min)) {
                return 0;
            }
            else {
                return d.value.min/4
            }
        })
        .colors('green')
        .renderTitle(true)
        .title(function(d){
            return "Time : " + d.key.toDateString() + " Min value: " + d.value.min;
        })
    /*.symbol('triangle-down')*/


    dailyMaxChart = dc.lineChart(dailyMinMaxChart)
        .x(d3.time.scale().domain(d3.extent(dailyDim.top(Infinity), function(d) {
            return d.time;
        })))
        .dimension(dailyDim)
        .group(dailyMaxGrp, "Maximum req.")
        .keyAccessor(function(d) {
            return d.key
        })
        .valueAccessor(function(d) {
            if (isNaN(d.value.max)) {
                return 0;
            }
            else {
                return d.value.max/4
            }
        })
        .colors('red')
        .renderTitle(true)
        .title(function(d){
            return "Time : " + d.key.toDateString() + " Max value: " + d.value.max;
        })
        /*.symbol('triangle-up')*/
        .legend(dc.legend().x(200).y(40).itemHeight(15).gap(5));



    dailyMinMaxChart
        .width(535).height(275)
        .x(d3.time.scale().domain(d3.extent(dailyDim.top(Infinity), function(d) {
            return d.time;
        })))
        .dimension(dailyDim)
        .keyAccessor(function(d) {
            return d.key
        })
        .shareTitle(false)
        .compose([dailyMinChart, dailyMaxChart])
        .elasticY(true)
        .elasticX(true)
        .brushOn(false)
        .renderTitle(true)
        /*.title(function(d){
            return "Time : " + d.key + "Min value: " + d.value.max;
        })*/
        .xAxis().ticks(8)
        
    weeklyMinMaxChart = dc.lineChart('#weeklyRange');
    
    weeklyMinMaxChart
        .renderArea(true)
        .width(535).height(275)
        .x(d3.scale.linear().domain(d3.extent(weeklyDim.top(Infinity), function(d) {
            return d3.time.weekOfYear(d.time);
        })))
        .dimension(weeklyDim)
        .keyAccessor(function(d) {
            return d.key
        })
        .group(weeklyMinGrp,"Weekly Min. Value")
        .valueAccessor(function(d){ if(isNaN(d.value.min)){return 0;}else{return d.value.min/4}})
        .stack(weeklyMaxGrp,"Weekly Max. Value",function(d){ if(isNaN(d.value.max)){return 0;}else{return d.value.max/4}})
        .elasticY(true)
        .elasticX(true)
        .brushOn(false)
        .renderTitle(true)
        .title(function(d){
            return "Week No "+ d.key + " Load " + ((d.value.min == undefined) ? d.value.max : d.value.min);
        })
        .legend(dc.legend().x(100).y(10).itemHeight(13).gap(5))
        .xAxis().ticks(4);
        /*.xAxis().ticks(8)*/
    
        



    /*RENDER ALL THE CHARTS*/
    dc.renderAll();

    //TOOL TIPS , INFO TIPS//
    tooltip = d3.select("body")
        .append("div")
        /*.attr('class','tip')*/
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden");
    infotip = d3.select("body")
        .append("div")
        /*.attr('class','tip')*/
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden");

    tooltip.attr('class', 'tip')
    infotip.attr('class', 'info')

    /*tooltip.attr('class','tip');*/
    d3.selectAll("#daily .pie-slice").on("mouseover", function(d) {
            /*console.log("In");*/
            return (tooltip.style("visibility", "visible").html("Hour of the Day: " + d.data.key + "<br>" + " Avg Load: " + Math.round(d.data.value.avg/4)));
        })
        .on("mousemove", function() {
            /*console.log("Move");*/
            return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            /*console.log("Out");*/
            return tooltip.style("visibility", "hidden");
        });

    d3.selectAll("#weather .pie-slice").on("mouseover", function(d) {
            /*console.log("In");*/
            return (tooltip.style("visibility", "visible").html("Weather: " + d.data.key + "<br> Avg Load: " + Math.round(d.data.value.avg/4)));
        })
        .on("mousemove", function() {
            /*console.log("Move");*/
            return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            /*console.log("Out");*/
            return tooltip.style("visibility", "hidden");
        });

    d3.selectAll(".glyphicon-info-sign").on("mouseover", function(d) {
            /*console.log("In");*/
            return (infotip.style("visibility", "visible").html("This plot gives you information about your load consumption for a given frame of time. <br> To reduce the time interval"));
        })
        .on("mousemove", function() {
            /*console.log("Move");*/
            return infotip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            /*console.log("Out");*/
            return infotip.style("visibility", "hidden");
        });

    darkOpa(); //////Increase the opacity of the chart

}

function darkOpa() {
    for (var i = 0; i < charts.length; i++) {
        var a = d3.select('#' + charts[i])
        a.style('opacity', '1');
    }
}

function tabulate(data, columns, vizid) {
    console.log("Called for: " + vizid + " section")
    var table = d3.select(vizid).append("table")
        /*.attr("style", "margin-left: 250px")*/
        ,
        thead = table.append("thead"),
        tbody = table.append("tbody");

    // append the header row
    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text(function(column) {
            return column.toUpperCase();
        });

    // create a row for each object in the data
    var rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function(row) {
            return columns.map(function(column) {
                return {
                    column: column,
                    value: row[column]
                };
            });
        })
        .enter()
        .append("td")
        .attr("style", "font-family: Courier")
        .html(function(d) {
            return d.value;
        });

    /*return table;*/
}

function startViz() {
    clientWidth = document.body.clientWidth;
    clientHeight = document.body.clientHeight;
    largeWidth = (clientWidth / 14) * 12
    mediumWidth = (clientWidth / 14) * 6
    smallWidth = (clientWidth / 14) * 4
    allHeight = clientHeight / 2
    var splash = d3.select('#splash');
    splash.style('visibility', 'visible');
    if (document.getElementById("month").checked) {
        var mon = document.getElementById("monthSelector").value;
        console.log(mon);
        loadData(mon);
    }
    else {
        loadYearlyData();
    }
}