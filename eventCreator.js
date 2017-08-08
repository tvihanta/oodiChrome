'use strict';

var eventCreator = (function() {

  var selectedText = null;

  // @corecode_begin getProtectedData
  function xhrWithAuth(method, url, interactive, callback) {
    var access_token;
    var retry = true;

    getToken();

    function getToken() {
      chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
        if (chrome.runtime.lastError) {
          callback(chrome.runtime.lastError);
          return;
        }

        access_token = token;
        requestStart();
      });
    }

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.onload = requestComplete;
      xhr.send();
    }

    function requestComplete() {
      if (this.status == 401 && retry) {
        retry = false;
        chrome.identity.removeCachedAuthToken({ token: access_token },
                                              getToken);
      } else {
        callback(null, this.status, this.response);
      }
    }
  }

  function interactiveSignIn() {

    chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError);

      } else {
        console.log('Token acquired:'+token+
          '. See chrome://identity-internals for details.');

      }
    });
    // @corecode_end getAuthToken
  }

  function revokeToken() {
    chrome.identity.getAuthToken({ 'interactive': false },
      function(current_token) {
        if (!chrome.runtime.lastError) {

          // @corecode_begin removeAndRevokeAuthToken
          // @corecode_begin removeCachedAuthToken
          // Remove the local cached token
          chrome.identity.removeCachedAuthToken({ token: current_token },
            function() {});
          // @corecode_end removeCachedAuthToken

          // Make a request to revoke token in the server
          var xhr = new XMLHttpRequest();
          xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
                   current_token);
          xhr.send();
          // @corecode_end removeAndRevokeAuthToken

          // Update the user interface accordingly
          console.log('Token revoked and removed from cache. '+
            'Check chrome://identity-internals to confirm.');
        }
    });
  }

  var oauth2 = {
    "client_id": "<client_id>",
    "scopes": ["https://www.googleapis.com/auth/plus.login", "https://www.googleapis.com/auth/calendar"]
  }

 function createEventObj(data){


 return null;
};


    /**
      * Load Google Calendar client library. List upcoming events
      * once client library is loaded.
      */
    function loadCalendarApi() {
        gapi.auth.authorize(
          {client_id: oauth2.client_id, scope: oauth2.scopes, immediate: true},
          function(){
              gapi.client.load('calendar', 'v3', function(){
                console.log("calendar api loaded.");
              });
          });
        return false;
    }

  function insertEvent(evt, callback){
    var request = gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': evt
    });

    request.execute(callback);
  }


  return {
    onload: function () {
      loadCalendarApi();

    /*  var signin_button = document.querySelector('#signin');
      signin_button.addEventListener('click', interactiveSignIn);

      var revoke_button = document.querySelector('#revoke');
      revoke_button.addEventListener('click', function(){

      });
*/
      /*$("#reCheck").click(function(){
        handleSelectedText($('#selection').val());
      });

      // send message to context handler to give the current selection
      chrome.extension.sendMessage({ msg: "getSelection"}, function(response){
        handleSelectedText(response.selection);
      });
*/
    },
    createEventObj:createEventObj,
    insertEvent:insertEvent
  };

})();

window.onload = eventCreator.onload;
