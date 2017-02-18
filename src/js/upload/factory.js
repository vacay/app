/* global Log, App, window, Utils, FormData, DOMParser, XMLHttpRequest, Notification */
(function(root, factory) {

  root.Upload = factory(root);

})(this, function() {

  var failed = function(e) {
    Log.error(e);
    Notification.show({msg: 'There was an error during the upload'});
  };

  var canceled = function(e) {
    Log.warn(e);
    Notification.show({msg: 'The upload was canceled by you or the browser dropped the connection'});
  };

  var warning = function() {
    return 'Leaving will cancel the upload';
  };    

  'use strict';

  return {
    files: [],
    progress: 0,
    sending: false,
    isDuplicate: function(file) {
      for (var i=0; i<this.files.length; i++) {
	if (this.files[i].file.name === file.name) {
	  return true;
	}
      }
      return false;
    },
    add: function(files, onProgress, onFinish) {
      for(var i=0; i<files.length; i++) {
	if (!this.isDuplicate(files[i])) {
	  this.files.push({
	    file: files[i],
	    onProgress: onProgress,
	    onFinish: onFinish
	  });
	  if (!this.sending) this.send();
	}
      }
    },
    send: function(file, onProgress, onFinish) {
      var self = this;
      var job;

      if (!file) {
	self.sending = true;

	job = self.files[0];
	file = job.file;
	onProgress = job.onProgress;
	onFinish = job.onFinish;
      }
      
      window.addEventListener('beforeunload', warning, false);
      App.api('/me/upload').post({
	ext: file.name ? file.name.split('.').pop() : Utils.getExtByMime(file.type)
      }).success(function (res) {
	var fd = new FormData();
	fd.append('key', res.data.key);
	fd.append('AWSAccessKeyId', 'AKIAIAQL5YQHQISA76FQ');
	fd.append('acl', 'public-read');
	fd.append('policy', res.data.policy);
	fd.append('signature', res.data.signature);
	fd.append('success_action_status', '201');
	fd.append('file', file);

	var xhr = new XMLHttpRequest();
	xhr.addEventListener('error', failed, false);
	xhr.addEventListener('abort', canceled, false);
	xhr.open('POST', 'https://vacay.s3.amazonaws.com/');
	
	xhr.upload.onprogress = function (e) {
	  if (e.lengthComputable) {
	    var percentCompleted = e.loaded * 100 / e.total;
	    onProgress(percentCompleted);
	    self.progress = percentCompleted;
	  }
	};
	
	xhr.onload = function () {
	  if (this.status === 201) {
	    var parser = new DOMParser();
	    var doc = parser.parseFromString(this.responseText, 'application/xml');
	    var s3Url = doc.getElementsByTagName('Location')[0].firstChild.nodeValue;
	    
	    self.progress = 100;
	    onProgress(100);
	    onFinish(s3Url, file);
	  }
	  
	  if (job) {
	    self.files.shift();
	    if (self.files[0]) {
	      self.send();
	    } else {
	      self.sending = false;
	    }
	  }
	  window.removeEventListener('beforeunload', warning, false);
	};
	
	xhr.send(fd);
      });
    }
  };

});
