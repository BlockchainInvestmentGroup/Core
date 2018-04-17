$( document ).ready(function() {
	"use strict";
    /* ======================================================= */
    // RICKSAW #1
    if (jQuery('#chart-realtime-simple-area-chart').length) {
	    var graph1 = new Rickshaw.Graph( {
	        element: document.querySelector("#chart-realtime-simple-area-chart"),
	        series: [{
	            color: '#FFD600',
	            data: [ 
	                { x: 0, y: 40 }, 
	                { x: 1, y: 49 }, 
	                { x: 2, y: 38 }, 
	                { x: 3, y: 30 }, 
	                { x: 4, y: 32 } ]
	        }]
	    });
	 
	    graph1.render();
    }
    /* ======================================================= */
    // RICKSAW #2
    if (jQuery('#chart-realtime-stacked-area-chart').length) {
	    var graph2 = new Rickshaw.Graph( {
	        element: document.querySelector("#chart-realtime-stacked-area-chart"),
	        renderer: 'area',
	        stroke: true,
	        series: [ {
	                data: [ 
	                    { x: 0, y: 40 }, 
	                    { x: 1, y: 49 }, 
	                    { x: 2, y: 38 }, 
	                    { x: 3, y: 30 }, 
	                    { x: 4, y: 32 } 
	                ],
	                color: '#252525'
	        }, {    
	                data: [
	                    { x: 0, y: 40 },
	                    { x: 1, y: 49 },
	                    { x: 2, y: 38 }, 
	                    { x: 3, y: 30 }, 
	                    { x: 4, y: 32 } 
	                ],
	                color: '#FFD600'
	        }]  
	    });
	 
	    graph2.render();
    }
    /* ======================================================= */
    // RICKSAW #3
    if (jQuery('#chart-realtime-line-chart').length) {
	    var graph3 = new Rickshaw.Graph({
	        element: document.querySelector("#chart-realtime-line-chart"),
	        renderer: 'line',
	        series: [{
	            data: [
	                { x: 0, y: 40 }, 
	                { x: 1, y: 49 }, 
	                { x: 2, y: 38 },
	                { x: 3, y: 30 }, 
	                { x: 4, y: 32 } 
	            ],
	            color: '#FFD600'
	        }]
	    });
	 
	    graph3.render();
    }
    /* ======================================================= */
    // RICKSAW #4
    if (jQuery('#chart-realtime-multiple-line-chart').length) {
	    var graph4 = new Rickshaw.Graph({
	        element: document.querySelector("#chart-realtime-multiple-line-chart"),
	        renderer: 'line',
	        series: [{
	            data: [
	                { x: 0, y: 40 },
	                { x: 1, y: 49 },
	                { x: 2, y: 38 },
	                { x: 3, y: 30 }, 
	                { x: 4, y: 32 } 
	            ],
	            color: '#252525'
	        }, {
	            data: [ 
	                { x: 0, y: 20 },
	                { x: 1, y: 24 },
	                { x: 2, y: 19 },
	                { x: 3, y: 15 }, 
	                { x: 4, y: 16 } 
	            ],
	            color: '#FFD600'
	        }]
	    });
	 
	    graph4.render();
    }
    /* ======================================================= */
    // RICKSAW #5
    if (jQuery('#chart-realtime-bar-chart').length) {
	    var graph5 = new Rickshaw.Graph({
	        element: document.querySelector("#chart-realtime-bar-chart"),
	        renderer: 'bar',
	        series: [{
	            data: [ 
	                { x: 0, y: 40 }, 
	                { x: 1, y: 49 },
	                { x: 2, y: 38 },
	                { x: 3, y: 30 },
	                { x: 4, y: 32 } 
	            ],
	            color: '#FFD600'
	        }]
	    });
	 
	    graph5.render();
	}    
    /* ======================================================= */
    // RICKSAW #6
    if (jQuery('#chart-realtime-stacked-bar-chart').length) {
	    var graph6 = new Rickshaw.Graph( {
	        element: document.querySelector("#chart-realtime-stacked-bar-chart"),
	        renderer: 'bar',
	        series: [ 
	            {
	                data: [ { x: 0, y: 40 }, { x: 1, y: 49 }, { x: 2, y: 38 }, { x: 3, y: 30 }, { x: 4, y: 32 } ],
	                color: '#252525'
	            }, {
	                data: [ { x: 0, y: 20 }, { x: 1, y: 24 }, { x: 2, y: 19 }, { x: 3, y: 15 }, { x: 4, y: 16 } ],
	                color: '#FFD600'
	            } ]
	    });
	    
	    graph6.render();
    }
    /* ======================================================= */
    // RICKSAW #7
    if (jQuery('#chart-realtime-multiple-bar-chart').length) {
	    var graph7 = new Rickshaw.Graph( {
	        element: document.querySelector("#chart-realtime-multiple-bar-chart"),
	        renderer: 'bar',
	        stack: false,
	        series: [{
	            data: [ 
	                { x: 0, y: 40 }, 
	                { x: 1, y: 49 }, 
	                { x: 2, y: 38 }, 
	                { x: 3, y: 30 }, 
	                { x: 4, y: 32 } 
	            ],
	            color: '#252525'
	        }, {
	            data: [ 
	                { x: 0, y: 20 }, 
	                { x: 1, y: 24 },
	                { x: 2, y: 19 },
	                { x: 3, y: 15 }, 
	                { x: 4, y: 16 }
	            ],
	            color: '#FFD600'
	        }]
	    });
	 
	    graph7.render();
    }
    /* ======================================================= */
    // RICKSAW #8
    if (jQuery('#chart-realtime-Scatterplot-chart').length) {
	    var graph8 = new Rickshaw.Graph( {
	        element: document.querySelector("#chart-realtime-Scatterplot-chart"),
	        renderer: 'scatterplot',
	        stroke: true,
	        max: 50,
	        series: [{
	            data: [
	                { x: 0, y: 22 },
	                { x: 1, y: 26 }, 
	                { x: 2, y: 30 }, 
	                { x: 3, y: 28 }, 
	                { x: 4, y: 31 }, 
	                { x: 5, y: 35 },
	                { x: 6, y: 38 },
	                { x: 7, y: 42 }, 
	                { x: 8, y: 34 }, 
	                { x: 9, y: 27 },
	                { x: 10, y: 26 } 
	            ],
	            color: '#FFD600'
	        }]
	    });
	 
	    graph8.render();
	    
	    
	    var seriesData = [ [], [], [], [], [], [], [], [], [] ];
	    var random = new Rickshaw.Fixtures.RandomData(150);
	    for (var i = 0; i < 150; i++) {
	        random.addData(seriesData);
	    }
    }
    /* ======================================================= */
    // RICKSAW #9
    if (jQuery('#chart-realtime-data-chart').length) {
	    var graph9 = new Rickshaw.Graph( {
	        element: document.querySelector("#chart-realtime-data-chart"),
	        renderer: 'area',
	        stroke: true,
	        preserve: true,
	        series: [
	            {
	                color: '#252525',
	                data: seriesData[0],
	                name: 'Litecoin'
	            }, {
	                color: '#FFD600',
	                data: seriesData[1],
	                name: 'Bitcoin'
	            }
	        ]
	    });
	 
	    graph9.render();
	    
	    setInterval( function() {
	        random.removeData(seriesData);
	        random.addData(seriesData);
	        graph9.update();
	    }, 300 );
	    
	    $(window).resize(function(){
	        graph9.render();
	    });
	}
    /* ======================================================= */
    // RICKSAW #10
    // if (jQuery('.rickshaw10').length) {
  //   	jQuery(".rickshaw10").each(function(){
		//     var graph10 = new Rickshaw.Graph({
		//         element: document.querySelector(".rickshaw10"),
		//         renderer: 'line',
		//         // width: 100,
		//         // height: 60,
		//         series: [{
		//             data: [
		//                 { x: 0, y: 40 }, 
		//                 { x: 1, y: 49 }, 
		//                 { x: 2, y: 38 },
		//                 { x: 3, y: 30 }, 
		//                 { x: 4, y: 32 } 
		//             ],
		//             color: '#FFD600'
		//         }]
		//     });
		 
		//     graph10.render();
		// });
	// }
    /* ======================================================= */
});