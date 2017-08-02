
DATETIMEFORMAT = "DD.MM.YYYY HH:mm";
var Event = Backbone.Model.extend({

  defaults: function() {
    return {
      title: "",
      startDatetime: new Date(),
      endDatetime: new Date(),
      fullDay:false,
      location:""
    };
  },
  returnGcalEvent:function(){
    var event = {
      'summary': this.get('title'),
      'location': this.get('location'),
     // 'description': 'A chance to hear more about Google\'s developer products.',
      'start': {
        'dateTime': this.get('startDatetime').toISOString(),
       // 'timeZone': 'America/Los_Angeles'
      },
      'end': {
        'dateTime': this.get('endDatetime').toISOString()
        //'timeZone': 'America/Los_Angeles'
      }
    }
    return event;
  },
  insertEvent:function(cb){
    console.log(this.returnGcalEvent());
    eventCreator.insertEvent(this.returnGcalEvent(), function(event) {
      console.log(event);
      cb();
    });
  }

});


var EventList = Backbone.Collection.extend({
   model: Event,
   comparator: 'title'

 });

var eventView = Backbone.View.extend({
    template:
        '<div class="col-12">'+
          '<div class="row">'+
            '<div class="col-6">'+
              '<div class="form-group">'+
                '<input type=\"text\" name="title" placeholder="add a title" class="form-control title" value=\"{{title}}\" />'+
              '</div>'+
            '</div>'+
            '<div class="col-6">'+
              '<div class="form-group">'+
                '<input type=\"text\" name="location" placeholder="location" class="form-control" value=\"{{location}}\" />'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="col-6">'+
              '<div class="form-group">'+
                  '<div class="input-group date" id="{{ident}}">'+
                      '<input type="text" name="startDatetime" class="form-control" />'+
                      '<span class="input-group-addon">'+
                          '<span class="glyphicon glyphicon-calendar"></span>'+
                      '</span>'+
                  '</div>'+
              '</div>'+
            '</div>'+
            '<div class="col-6">'+
              '<div class="form-group">'+
                  '<div class="input-group date2" id="{{ident}}">'+
                      '<input type="text" name="endDatetime" class="form-control" value="" />'+
                      '<span class="input-group-addon">'+
                          '<span class="glyphicon glyphicon-calendar"></span>'+
                      '</span>'+
                  '</div>'+
                '</div>'+
          '</div>'+
        '</div>'+
        '<hr/>',

    className:"row",
    tagName: "div",
    render: function(){
      //console.log(this.model.attributes);
      this.$el.html(Mustache.to_html(this.template, this.model.attributes));
      this.$('.date').datetimepicker({
        defaultDate: this.model.get('startDatetime'),
        format: DATETIMEFORMAT
      });
      this.$('.date2').datetimepicker({
        defaultDate: this.model.get('endDatetime'),
        format: DATETIMEFORMAT
      });
        return this
    }

});

var AppView = Backbone.View.extend({
      // el - stands for element. Every view has a element associate in with HTML
      //      content will be rendered.
      el: '#container',
      events: {
         "click #save": "saveEvents",
         "keyup #titleForAll": "setTitleToAll"
       },
      // It's the first function called when this view it's instantiated.
      initialize: function(){
        var self = this;
        this.collection = new EventList();
        this.listenTo(this.collection, 'reset', this.addAll);
        chrome.extension.sendMessage({ msg: "getSelection"}, function(response){
    			var selection = response.selection;
    			items = self.handleSelectedText(selection);
          self.collection.reset(items);
    		});

      },
      setTitleToAll:function(){
        var title = this.$("#titleForAll").val()
        this.$(".title").val(title);
      },
      addOne: function(event) {
        var view = new eventView({model: event});
        this.$("#events").append(view.render().el);
      },
      addAll: function() {
        this.collection.each(this.addOne, this);
      },
      saveEvents: function () {
        var self = this;
        var data = $('#eventForm').serializeArray();
        var i = 0;
        var updatedModels = [];
        while( i < data.length ) {
          var model = new Event({
            title: data[i].value,
            location: data[i+1].value,
            startDatetime: moment(data[i+2].value, DATETIMEFORMAT),
            endDatetime : moment(data[i+3].value, DATETIMEFORMAT)
          });
          updatedModels.push(model);
          i = i+4;
        }
        this.collection.reset(updatedModels, {silent:true});
        finished = _.after(this.collection.length, function(){
          self.$("#loading-icon > a").html("Events saved.");
          setTimeout(function(){
            window.close();
          }, 1500);

        });
        self.$("#save-li").hide();
        self.$("#loading-icon").show();
        this.collection.each(function(model){
          model.insertEvent(finished);
        });
        //createEventObj();
      },
      strategies : [
            //for web-oodi format multiple dates
    		function(pSel){
    			try {
                console.log("strat 0");
    			var parts = pSel.replace(/\s+/g, " ").split(" ");
                var time = moment(parts[0]);
    		    var format = "D.M.YY HH.mm";
                var items = [];
				for (var i = 0, len=parts.length; i < len; i=i+4) {
					var obj = {};
					obj.startDatetime = moment(parts[i] +" "+parts[i+2].split("-")[0], format);
					obj.endDatetime = moment(parts[i] +" "+parts[i+2].split("-")[1],format);

                    if( obj.startDatetime.isValid() != true||obj.endDatetime.isValid() != true){
                    console.log("invalid date");
                    throw "invalid date"
                    }

    				obj.location = parts[i+3];
    				obj.num = i+1;
    				obj.ident ="start_"+i
        	        items.push(new Event(obj));
		         }
                console.log(items);
				return items;
    			} catch (e) {
                    throw "error in web-oodi strategy";
	            }
      	},
        // for open-university style markup for multiple dates
        function(pSel){
    			try {
            console.log("strat 1");
            var items = [];
            var reWhole = /(\d{1,2}.\d{1,2}.\d{2},\ *klo\ *\d{2}\.\d{2}\ *-\ *\d{2}\.\d{2})/gi;
    			  var parts = pSel.match(reWhole);
            console.log(parts);
            for (var i = 0, len=parts.length; i < len; i++) {
              var re = /(\d{1,2}.\d{1,2}.\d{2}),\ *klo\ *(\d{2}\.\d{2})\ *-\ *(\d{2}\.\d{2})/i;
              var found = parts[i].match(re);
              console.log(found);
              if(found !== null){
                var format = "D.M.YY HH.mm";
                var obj = {};
                obj.startDatetime = moment(found[1]+" "+found[2], format);
                obj.endDatetime = moment(found[1]+" "+found[3], format);

                if(obj.startDatetime.isValid() != true ||obj.endDatetime.isValid()!=true){
                    console.log("homonaamat");
                    throw "invalid date";
                }
                obj.num = i+1;
                obj.ident ="start_"+i
      	        items.push(new Event(obj));
              }
            }
            //console.log(items);
            return items;
    			} catch (e) {
            throw "error in open-u strategy";
    			}
      	},
        //generic try something
        function(pSel){
          try {
                console.log("strat 2");
    			var obj = {};
    			obj.startDatetime = moment(pSel);
                if( obj.startDatetime.isValid() != true ){
                  console.log("invalid date");
                  throw "invalid date"
                }
    			obj.endDatetime = moment();
    			obj.num = i+1;
    			obj.ident ="start_"+i
                console.log(obj);
				return [obj];
    		} catch (e) {
                throw "error in generic strategy";
    		}
        }

      ],
      handleSelectedText : function(pselText) {
    		var selectedText = pselText; //
      	//$('#selection').val(pselText);
        var result = null;
        for (var i=0, len=this.strategies.length; i < len; i++) {
    			try {
    				result = this.strategies[i](selectedText);
    				break;
    			} catch (e) {
    				console.log("error in strategy " + i);
    			}
    		}
        if (result == null){
          var m = new Event();
          m.set("title", pselText);
          result = [m];
        }
        return result;
     },

  });

$(function () {
    app = new AppView();
});
