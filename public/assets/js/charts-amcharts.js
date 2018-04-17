"use strict";

var chart = AmCharts.makeChart("depthChart", {

    "type": "serial",

    "theme": "light",

    "marginRight": 80,

    "dataProvider": [{

        "lineColor": "#84F766",

        "value": 408

    }, {

        "value": 401

    }, {

        "value": 301

    }, {

        "value": 290

    }, {

        "value": 286

    }, {

        "value": 255

    }, {

        "value": 199

    }, {

        "value": 205

    }, {

        "value": 159

    }, {

        "value": 149

    }, {

        "value": 140

    }, {

        "value": 99

    }, {

        "value": 45

    }, {

        "lineColor": "#FF6939",

        "value": 0

    }, {

        "value": 54

    }, {

        "value": 101

    }, {

        "value": 110

    }, {

        "value": 123

    }, {

        "value": 167

    }, {

        "value": 201

    }, {

        "value": 220

    }, {

        "value": 225

    }, {

        "value": 228

    }, {

        "value": 250

    }, {

        "value": 302

    }, {

        "value": 361

    }, {

        "value": 404

    }],

    "balloon": {

        "cornerRadius": 6,

        "horizontalPadding": 15,

        "verticalPadding": 10

    },

    // "valueAxes": [{

    //     "duration": "mm",

    //     "durationUnits": {

    //         "hh": "h ",

    //         "mm": "min"

    //     },

    //     "axisAlpha": 0

    // }],

    "graphs": [{

        "bullet": "square",

        "bulletBorderAlpha": 1,

        "bulletBorderThickness": 1,

        "fillAlphas": 0.3,

        "fillColorsField": "lineColor",

        "legendValueText": "[[value]]",

        "lineColorField": "lineColor",

        "title": "value",

        "valueField": "value"

    }],

    "chartScrollbar": {



    },

    "chartCursor": {

        "oneBalloonOnly": true

    },

    // "dataDateFormat": "YYYY-MM-DD",

    "categoryField": "value",

    // "categoryAxis": {

    //     "dateFormats": [{

    //         "period": "DD",

    //         "format": "DD"

    //     }, {

    //         "period": "WW",

    //         "format": "MMM DD"

    //     }, {

    //         "period": "MM",

    //         "format": "MMM"

    //     }, {

    //         "period": "YYYY",

    //         "format": "YYYY"

    //     }],

    //     "parseDates": true,

    //     "autoGridCount": false,

    //     "axisColor": "#555555",

    //     "gridAlpha": 0,

    //     "gridCount": 50

    // },

    "export": {

        "enabled": false

    }

});







chart.addListener("dataUpdated", zoomChart);

function zoomChart() { 

    return;

}

// function zoomChart() {

//     chart.zoomToDates(new Date(2012, 0, 2), new Date(2012, 0, 11));

// }