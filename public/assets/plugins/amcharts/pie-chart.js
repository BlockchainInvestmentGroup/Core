var chart = AmCharts.makeChart("piechart", {
  "type": "pie",
  "startDuration": 0,
  "theme": "light",
  "addClassNames": true,
  "legend":{
   	"position":"right",
    "marginRight":100,
    "autoMargins":false
  },
  "innerRadius": "30%",
  "defs": {
    "filter": [{
      "id": "shadow",
      "width": "200%",
      "height": "200%",
      "feOffset": {
        "result": "offOut",
        "in": "SourceAlpha",
        "dx": 0,
        "dy": 0
      },
      "feGaussianBlur": {
        "result": "blurOut",
        "in": "offOut",
        "stdDeviation": 5
      },
      "feBlend": {
        "in": "SourceGraphic",
        "in2": "blurOut",
        "mode": "normal"
      }
    }]
  },
  "dataProvider": [
  {
    "shares": "btc.com",
    "percentage": 21
  }, {
    "shares": "antpool",
    "percentage": 16
  }, {
    "shares": "btc.top",
    "percentage": 11
  }, {
    "shares": "viabtc",
    "percentage": 11
  }, {
    "shares": "unknown",
    "percentage": 10
  }, {
    "shares": "slush",
    "percentage": 10
  }, {
    "shares": "btcc",
    "percentage": 8
  }, {
    "shares": "f2pool",
    "percentage": 5
  }, {
    "shares": "bitfury",
    "percentage": 3
  }, {
    "shares": "gminers",
    "percentage": 2
  }, {
    "shares": "bitcoin.com",
    "percentage": 1
  }, {
    "shares": "bitclub",
    "percentage": 1
  }, {
    "shares": "bwpool",
    "percentage": 1
  }],
  "valueField": "percentage",
  "titleField": "shares",
  "export": {
    "enabled": true
  }
});

chart.addListener("init", handleInit);

chart.addListener("rollOverSlice", function(e) {
  handleRollOver(e);
});

function handleInit(){
  chart.legend.addListener("rollOverItem", handleRollOver);
}

function handleRollOver(e){
  var wedge = e.dataItem.wedge.node;
  wedge.parentNode.appendChild(wedge);
}