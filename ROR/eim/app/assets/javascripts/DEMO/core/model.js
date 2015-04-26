(function eimModel() {
	EIM.namespace('Model');

	EIM.Model = ( function () {
		// dependencies
		// ...

		// private properties
		var Constr;

		// private methods

		// end var

		// optionally one-time init procedures

		// public API -- constructor
		Constr = function (info_type) {
			// private properties


			// private methods
			this.info_type = info_type;
			this.namespace = 'EIM.Infos.' + info_type;
			this.storage = $.initNamespaceStorage(this.namespace).localStorage;
		};

		// public API -- prototype
		Constr.prototype = {
			constructor: EIM.Model,

			set: function (key, val) {
					// console.log(this.info_type + "[set] " + "key: " + key + ", val: " + val);
					this.storage.set(key, val);
			},
			get: function (key, callback) {
					if (!this.storage.isSet(key)) {
							// 
							// Skip some parts of content
				  		// ....
				  		// 
							return query_info();
					} else {
							// retreive from local storage
							var data = this.storage.get(key);
							return !!callback ? callback(data) : data;
					}
			},			
			update: function (key, callback) {
					// 
					// Skip some parts of content
		  		// ....
		  		// 
					})(this, key, callback);

					return query_info();
			},
			delete: function (key) {
					// 
					// Skip some parts of content
		  		// ....
		  		// 
			}
		};

		// return the constructor
		// to be assigned to the new namespace
		return Constr;

	} ());

}) ();


(function init_models() {
		EIM.namespace('Models');

		var info_types = ['Users', 'Groups', 'Files', 'Networks', 'Conversations', 'Posts', 'Polls', 'Events', 'Tasks', 'Notifications', 'ConversationShares', 'FileShares'];

		var l = info_types.length;
		for (var i = 0; i < l; i++) {
				EIM.Models[info_types[i]] = new EIM.Model(info_types[i]);
		};
})();
