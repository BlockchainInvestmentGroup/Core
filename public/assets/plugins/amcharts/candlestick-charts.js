
  var chartData = [];
    generateChartData();

       function generateChartData() {
  var firstDate = new Date();
  firstDate.setHours(0, 0, 0, 0);
  firstDate.setDate(firstDate.getDate() - 2000);

  for (var i = 0; i < 2000; i++) {
    var newDate = new Date(firstDate);

    newDate.setDate(newDate.getDate() + i);


    if(i==0) {
      var open = Math.round(Math.random() * (10000) );
    } else {
      var open = close;
    }


    var close = open + Math.round(Math.random() * (15) - Math.random() * 10);

    var low;
    if (open < close) {
      low = open - Math.round(Math.random() * 5);
    } else {
      low = close - Math.round(Math.random() * 5);
    }

    var high;
    if (open < close) {
      high = close + Math.round(Math.random() * 5);
    } else {
      high = open + Math.round(Math.random() * 5);
    }

    var volume = Math.round(Math.random() * (1000 + i)) + 100 + i;

    var value = Math.round(Math.random() * (30) + 100);

    chartData[i] = ({
      date: newDate,
      open: open,
      close: close,
      high: high,
      low: low,
      volume: volume,
      value: value
    });
  }
}
  var chart = AmCharts.makeChart( "chartdiv", {
      type: "stock",
      theme: "light",
      dataSets: [ {

        fieldMappings: [ {
          fromField: "open",
          toField: "open"
        },{
          fromField: "close",
          toField: "close"
        },{
          fromField: "high",
          toField: "high"
        },{
          fromField: "low",
          toField: "low"
        },{
          fromField: "volume",
          toField: "volume"
        },{
          fromField: "rsi",
          toField: "rsi"
        }],
        color: "#7f8da9",
        dataProvider: chartData,       
        categoryField: "date"
      }],

      
      categoryAxesSettings: {
        equalSpacing : true,
      },
      mouseWheelZoomEnabled: true,

      panels: [ {
          title: "Value",
          showCategoryAxis: false,
          percentHeight: 70,
          valueAxes: [ {
            id: "v1",
            dashLength: 5
          } ],

          categoryAxis: {
            dashLength: 5
          },

          stockGraphs: [ {
            title: ' Chart',
            type: "candlestick",
            id: "g1",
            balloonText: "Open:<b>[[open]]</b><br>Low:<b>[[low]]</b><br>High:<b>[[high]]</b><br>Close:<b>[[close]]</b><br>Volume:<b>[[volume]]</b><br>",
            openField: "open",
            closeField: "close",
            highField: "high",
            lowField: "low",
            valueField: "close",
            lineColor: "#006A00",
            fillColors: "#006A00",
            negativeLineColor: "#8C0000",
            negativeFillColors: "#8C0000",
            fillAlphas: 1,
            useDataSetColors: false,
            comparable: true,
            compareField: "value",
            showBalloon: true,
            proCandlesticks: false,
        gapField: 10
          }],

          stockLegend: {
            valueTextRegular: undefined,
            periodValueTextComparing: "[[percents.value.close]]%"
          }
        },
        {
          title: "Volume",
          percentHeight: 30,
          marginTop: 1,
          showCategoryAxis: true,
          valueAxes: [ {
            id: "v3",
            dashLength: 5
          } ],

          categoryAxis: {
            dashLength: 5
          },

          stockGraphs: [ {
            valueField: "volume",
            type: "column",
            useDataSetColors: false,
            lineColor: "#2B4073",
            balloonText: "Volume<br><b><span style='font-size:14px;'>value: [[value]]</span></b>",
            showBalloon: true,
            fillAlphas: false
          }],

          stockLegend: {
            markerType: "none",
            markerSize: 0,
            labelText: "",
            periodValueTextRegular: "[[value.close]]"
          }
        }
      ],

      chartScrollbarSettings: {
        graph: "g1",
        graphType: "line",
        usePeriod: "WW"
      },

      chartCursorSettings: {
        valueLineBalloonEnabled: true,
        valueLineEnabled: true,
        valueBalloonsEnabled:true
      },

      periodSelector: {
        position: "bottom",
        periods: [ {
          period: "DD",
          count: 10,
          label: "10 days"
        }, {
          period: "MM",
          count: 1,
          selected: true,
          label: "1 month"
        }, {
          period: "MM",         
          count: 4,
          label: "4 month"
        },{
          period: "MM",
          count: 6,
          label: "6 month"
        },{
          period: "YYYY",
          count: 1,
          label: "1 year"
        }, {
          period: "YTD",
          label: "YTD"
        }, {
          period: "MAX",
          label: "MAX"
        } ]
      },
     export: {
        enabled: true,
        menu:[{
          class: "export-main",
              menu: [{
              label: "Download As",
              menu: [ "PNG", "JPG"]
            },{
              label: "Annotate",
              action: "draw"
            }]
        }]
    }
});
