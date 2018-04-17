$(function () {
    var bindDatePicker = function() {
         $(".date").datetimepicker({
         format:'YYYY-MM-DD',
             icons: {
                 time: "fa fa-clock-o",
                 date: "fa fa-calendar",
                 up: "fa fa-arrow-up",
                 down: "fa fa-arrow-down"
             }
         }).find('input:first').on("blur",function () {
             // check if the date is correct. We can accept dd-mm-yyyy and yyyy-mm-dd.
             // update the format if it's yyyy-mm-dd
             var date = parseDate($(this).val());
 
             if (! isValidDate(date)) {
                 //create date based on momentjs (we have that)
                 date = moment().format('YYYY-MM-DD');
             }
 
             $(this).val(date);
         });
     }
    
    var isValidDate = function(value, format) {
         format = format || false;
         // lets parse the date to the best of our knowledge
         if (format) {
             value = parseDate(value);
         }
 
         var timestamp = Date.parse(value);
 
         return isNaN(timestamp) == false;
    }
    
    var parseDate = function(value) {
         var m = value.match(/^(\d{1,2})(\/|-)?(\d{1,2})(\/|-)?(\d{4})$/);
         if (m)
             value = m[5] + '-' + ("00" + m[3]).slice(-2) + '-' + ("00" + m[1]).slice(-2);
 
         return value;
    }
    
    bindDatePicker();
  });

function addStage(){
    var rowHtml = "";
    var id = Math.floor((Math.random()*10000) + 1);
    rowHtml = '<tr id="ico_item_' + id + '">';
    rowHtml += '<td><input type="text"/></td>';
    rowHtml += '<td><input type="text"/></td>';
    rowHtml += '<td><input type="text"/></td>';
    rowHtml += '<td>';
    rowHtml += '<input id="datepicker_ico'+ id +'" type="text" class="date input-type-1" value="">';
    rowHtml += '</td>'
    rowHtml += '<td><input type="text"/></td>';
    rowHtml += '<td><input type="text" value="0"/></td>';
    rowHtml += '<td style="width:90px; text-align: right"><button class="btn-danger" onclick="removeStage('+ id +')"><i class="fa fa-minus-circle">Delete</i></button></td>';
    rowHtml += '</tr>';

    $('#icolist tbody').append(rowHtml);
    $('#datepicker_ico' + id).datepicker({
        dateFormat: 'yy-mm-dd'
    });
}

function removeStage(id){
    var element = document.getElementById("ico_item_" + id);
    element.remove();
}

function setICOStatus(status){
    data = {
        ico_activation: status,
    }
    
    $.ajax({
        type:"post",
        url: "/icostart",
        dataType:"json",
        data: data, 
        success: function(res){
            console.log(res);
            if(res.status == "OK"){
                switch(status){
                    case 0: //stop ico
                        $('#ico_box').show();
                        $('#ico_start').show();
                        $('#ico_stop').hide();
                        break;
                    case 1: // start ico
                        $('#ico_box').hide();
                        $('#ico_start').hide();
                        $('#ico_stop').show();
                        break;
                }

                location.reload();
            }else{
                $('#error_modal_message').html("Please set again.");
                $('#error_modal').show();
            }
        }
    })
}

function saveICOStages(){
    var tr_elements = $('#icolist tbody tr');
    var data = [];
    for( var i = 1; i < tr_elements.length; i++){
        var element = tr_elements[i];
        var coins = parseInt(element.children[0].children[0].value);
        var price = parseFloat(element.children[1].children[0].value);
        var bonus = parseFloat(element.children[2].children[0].value);
        var startDate = element.children[3].children[0].value;
        var days = parseInt(element.children[4].children[0].value);
        var soldAmount = parseInt(element.children[5].children[0].value);

        if( coins.toString() == "NaN" || price.toString() == "NaN" || bonus.toString() == "NaN" || startDate == "" || days.toString() == "NaN"){
            continue;
        }

        data[i-1] = {
            round : i,
            coins : coins,
            price : price,
            bonus : bonus,
            startDate: new Date(startDate),
            days  : days, 
            soldAmount: soldAmount,
            status: 0
        };
    }

    console.log(data);

    $.ajax({
        type: "post",
        url: "/icosetting",
        dataType:"json",
        data: { data : JSON.stringify(data)},
        success: function(res){
            console.log(res);
            if(res.result == "success"){
                alert("Setting succeed.");
                location.reload();
            }
        },
        fail: function(res){
            console.log('error');
        }

    })
}

